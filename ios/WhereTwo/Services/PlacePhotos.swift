import Foundation
import SwiftUI

/// A photo of a place: the lead image of its Wikipedia article. Used for each trip's
/// destination and for each stop in a day's plan. Same lookup as the web app
/// (src/lib/placePhotos.ts), cached so each place is fetched once.
struct PlacePhoto: Codable, Hashable {
    var url: URL
    /// Wikimedia file page, where the photographer and license are listed.
    var creditURL: URL
}

@MainActor
final class PlacePhotos {
    static let shared = PlacePhotos()

    private struct CacheEntry: Codable {
        var photo: PlacePhoto?
        var savedAt: Date
    }

    private var cache: [String: CacheEntry]
    private var inFlight: [String: Task<PlacePhoto?, Never>] = [:]
    private let cacheURL: URL = {
        let dir = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
        return dir.appendingPathComponent("place-photos.json")
    }()

    private init() {
        cache = (try? JSONDecoder().decode([String: CacheEntry].self, from: Data(contentsOf: cacheURL))) ?? [:]
    }

    // MARK: Public

    static func destinationKey(_ location: String) -> String { "place:" + normalized(location) }
    static func stopKey(_ name: String, in location: String) -> String { "stop:\(normalized(location)):\(normalized(name))" }

    /// The cached answer for a key, if any (an inner nil means "looked, no good photo").
    func cached(_ key: String) -> PlacePhoto?? {
        guard let entry = cache[key], Date.now.timeIntervalSince(entry.savedAt) < 30 * 86_400 else { return nil }
        return .some(entry.photo)
    }

    func destination(_ location: String) async -> PlacePhoto? {
        await photo(Self.destinationKey(location)) { await Self.lookUpDestination(location) }
    }

    func stop(_ name: String, in location: String, neighborhood: String) async -> PlacePhoto? {
        await photo(Self.stopKey(name, in: location)) { await Self.lookUpStop(name, place: location, neighborhood: neighborhood) }
    }

    // MARK: Caching

    private func photo(_ key: String, lookUp: @escaping @Sendable () async -> PlacePhoto??) async -> PlacePhoto? {
        if let hit = cached(key) { return hit }
        if let task = inFlight[key] { return await task.value }
        let task = Task<PlacePhoto?, Never> {
            // A nil from lookUp means the network failed: don't remember that, try again later.
            guard let answer = await lookUp() else { return nil }
            self.cache[key] = CacheEntry(photo: answer, savedAt: .now)
            if let data = try? JSONEncoder().encode(self.cache) { try? data.write(to: self.cacheURL, options: .atomic) }
            return answer
        }
        inFlight[key] = task
        let result = await task.value
        inFlight[key] = nil
        return result
    }

    private static func normalized(_ text: String) -> String {
        text.trimmingCharacters(in: .whitespaces).lowercased()
    }

    // MARK: Lookups (outer nil = network failure, inner nil = no usable photo)

    /// "Portland, Oregon" first (finds the right Portland), then the city alone, then related articles.
    private static func lookUpDestination(_ location: String) async -> PlacePhoto?? {
        let parts = location.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
        guard let city = parts.first else { return .some(nil) }
        let titles = parts.count > 1 ? ["\(city), \(parts[1])", city] : [city]
        for title in titles {
            guard let pages = await query(["titles": title], size: 1280) else { return nil }
            if let photo = pages.first.flatMap({ usable($0, landscapeOnly: true) }) { return photo }
        }
        guard let results = await query(["generator": "search", "gsrsearch": parts.joined(separator: " "), "gsrlimit": "6"], size: 1280) else { return nil }
        return .some(results.lazy.compactMap { usable($0, landscapeOnly: true) }.first)
    }

    /// An exact article title wins ("Trevi Fountain"); otherwise a search, accepting a result only
    /// when its title shares a distinctive word with the stop's name.
    private static func lookUpStop(_ name: String, place: String, neighborhood: String) async -> PlacePhoto?? {
        guard let exact = await query(["titles": name], size: 250) else { return nil }
        if let photo = exact.first.flatMap({ usable($0, landscapeOnly: false) }) { return photo }

        let placeWords = Set(words(place + " " + neighborhood))
        let distinctive = words(name).filter { !kindWords.contains($0) && !placeWords.contains($0) }
        guard !distinctive.isEmpty else { return .some(nil) }
        let city = place.split(separator: ",").first.map(String.init) ?? place
        guard let results = await query(["generator": "search", "gsrsearch": "\(name) \(city)", "gsrlimit": "3"], size: 250) else { return nil }
        for page in results {
            let titleWords = Set(words(page.title ?? ""))
            guard distinctive.contains(where: titleWords.contains), let photo = usable(page, landscapeOnly: false) else { continue }
            return photo
        }
        return .some(nil)
    }

    // Lead images that aren't photos of the place: maps, flags, seals, logos, diagrams.
    private static let notAPhoto = try! NSRegularExpression(
        pattern: #"\.svg$|\.gif$|flag|map|locator|location|coat[_ ]of[_ ]arms|seal|logo|emblem|marker|montage|collage"#,
        options: .caseInsensitive
    )

    // Words that say what kind of place something is rather than which place it is.
    private static let kindWords: Set<String> = [
        "the", "and", "of", "de", "la", "le", "el", "del", "temple", "shrine", "palace", "museum", "market", "park",
        "garden", "gardens", "tower", "station", "street", "square", "restaurant", "cafe", "bar", "ramen", "sushi",
        "beach", "church", "cathedral", "castle", "bridge", "hotel", "district", "tour", "visit", "walk", "center", "centre",
    ]

    private static func words(_ text: String) -> [String] {
        text.folding(options: [.diacriticInsensitive, .caseInsensitive], locale: .init(identifier: "en"))
            .components(separatedBy: CharacterSet.alphanumerics.inverted)
            .filter { $0.count >= 3 }
    }

    private struct Response: Decodable {
        struct Query: Decodable { var pages: [Page]? }
        struct Page: Decodable {
            struct Thumbnail: Decodable { var source: URL; var width: Int; var height: Int }
            struct Props: Decodable { var disambiguation: String? }
            var title: String?
            var missing: Bool?
            var pageimage: String?
            var thumbnail: Thumbnail?
            var pageprops: Props?
            var index: Int?
        }
        var query: Query?
    }

    private static func usable(_ page: Response.Page, landscapeOnly: Bool) -> PlacePhoto? {
        guard page.missing != true, page.pageprops?.disambiguation == nil,
              let name = page.pageimage, let thumb = page.thumbnail,
              notAPhoto.firstMatch(in: name, range: NSRange(name.startIndex..., in: name)) == nil,
              !landscapeOnly || thumb.width >= thumb.height,
              let encoded = name.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed),
              let credit = URL(string: "https://commons.wikimedia.org/wiki/File:\(encoded)")
        else { return nil }
        return PlacePhoto(url: thumb.source, creditURL: credit)
    }

    /// nil when the request failed (offline); an empty array when Wikipedia had nothing.
    private static func query(_ params: [String: String], size: Int) async -> [Response.Page]? {
        var components = URLComponents(string: "https://en.wikipedia.org/w/api.php")!
        let base = [
            "action": "query", "format": "json", "formatversion": "2", "redirects": "1",
            "prop": "pageimages|pageprops", "piprop": "thumbnail|name", "pithumbsize": String(size),
        ]
        components.queryItems = base.merging(params) { $1 }.map { URLQueryItem(name: $0.key, value: $0.value) }
        var request = URLRequest(url: components.url!)
        // Wikimedia asks apps to identify themselves.
        request.setValue("WhereTwo/1.0 (iOS; \(Config.supportEmail))", forHTTPHeaderField: "User-Agent")
        guard let (data, _) = try? await URLSession.shared.data(for: request),
              let response = try? JSONDecoder().decode(Response.self, from: data)
        else { return nil }
        return (response.query?.pages ?? []).sorted { ($0.index ?? 0) < ($1.index ?? 0) }
    }
}

/// A trip destination's photo with a dark wash so white text reads on it. Shows the default
/// travel photo while loading or when the destination has no good photo.
struct PlacePhotoBackground: View {
    let location: String
    var muted = false
    var showsCredit = true

    @State private var photo: PlacePhoto?

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            Image("AuthBackground").resizable().scaledToFill().saturation(muted ? 0 : 1)
            if let photo {
                AsyncImage(url: photo.url, transaction: Transaction(animation: .easeOut(duration: 0.4))) { phase in
                    if let image = phase.image {
                        image.resizable().scaledToFill().saturation(muted ? 0 : 1)
                    }
                }
            }
            LinearGradient(colors: [.black.opacity(0.1), .black.opacity(0.25), .black.opacity(0.7)],
                           startPoint: .top, endPoint: .bottom)
            if showsCredit, let photo {
                Link("Photo: Wikimedia Commons", destination: photo.creditURL)
                    .font(.system(size: 10))
                    .foregroundStyle(.white.opacity(0.65))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
            }
        }
        .clipped()
        .task(id: location) {
            if let hit = PlacePhotos.shared.cached(PlacePhotos.destinationKey(location)) { photo = hit }
            photo = await PlacePhotos.shared.destination(location)
        }
    }
}

/// A stop's photo, Booking-style: the place's own Wikipedia photo, or the destination's photo
/// when the stop doesn't have one, so every card has the same shape.
struct StopPhoto: View {
    let name: String
    let location: String
    let neighborhood: String

    @State private var own: PlacePhoto?
    @State private var city: PlacePhoto?

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            Color(hex: 0xEEF0F3)
            if let photo = own ?? city {
                AsyncImage(url: photo.url, transaction: Transaction(animation: .easeOut(duration: 0.3))) { phase in
                    if let image = phase.image { image.resizable().scaledToFill() }
                }
            }
        }
        .clipped()
        .task(id: name) {
            let stopKey = PlacePhotos.stopKey(name, in: location)
            if let hit = PlacePhotos.shared.cached(stopKey) { own = hit }
            if let hit = PlacePhotos.shared.cached(PlacePhotos.destinationKey(location)) { city = hit }
            async let stop = PlacePhotos.shared.stop(name, in: location, neighborhood: neighborhood)
            async let place = PlacePhotos.shared.destination(location)
            own = await stop
            city = await place
        }
    }
}
