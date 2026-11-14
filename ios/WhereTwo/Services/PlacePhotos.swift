import Foundation
import SwiftUI

/// A photo of a trip's destination: the lead image of its Wikipedia article.
/// Same lookup as the web app (src/lib/placePhotos.ts), cached per destination.
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

    // Lead images that aren't photos of the place: maps, flags, seals, diagrams.
    private static let notAPhoto = try! NSRegularExpression(
        pattern: #"\.svg$|\.gif$|flag|map|locator|location|coat[_ ]of[_ ]arms|seal|logo|emblem|marker|montage|collage"#,
        options: .caseInsensitive
    )

    private init() {
        cache = (try? JSONDecoder().decode([String: CacheEntry].self, from: Data(contentsOf: cacheURL))) ?? [:]
    }

    /// The cached photo, if this destination has been looked up before (nil inside means "no good photo").
    func cached(for location: String) -> PlacePhoto?? {
        guard let entry = cache[key(location)], Date.now.timeIntervalSince(entry.savedAt) < 30 * 86_400 else { return nil }
        return .some(entry.photo)
    }

    func photo(for location: String) async -> PlacePhoto? {
        if let hit = cached(for: location) { return hit }
        let k = key(location)
        if let task = inFlight[k] { return await task.value }
        let task = Task { await Self.lookUp(location) }
        inFlight[k] = task
        let result = await task.value
        inFlight[k] = nil
        // Only remember answers we actually got; a network failure tries again next time.
        if !Task.isCancelled {
            cache[k] = CacheEntry(photo: result, savedAt: .now)
            if let data = try? JSONEncoder().encode(cache) { try? data.write(to: cacheURL, options: .atomic) }
        }
        return result
    }

    private func key(_ location: String) -> String { location.trimmingCharacters(in: .whitespaces).lowercased() }

    // MARK: Lookup

    private struct Response: Decodable {
        struct Query: Decodable { var pages: [Page]? }
        struct Page: Decodable {
            struct Thumbnail: Decodable { var source: URL; var width: Int; var height: Int }
            var title: String?
            var missing: Bool?
            var pageimage: String?
            var thumbnail: Thumbnail?
            struct Props: Decodable { var disambiguation: String? }
            var pageprops: Props?
            var index: Int?
        }
        var query: Query?
    }

    private static func lookUp(_ location: String) async -> PlacePhoto? {
        let parts = location.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
        guard let city = parts.first else { return nil }

        // "Portland, Oregon" finds the right Portland; "Tokyo, Japan" redirects to Tokyo.
        let titles = parts.count > 1 ? ["\(city), \(parts[1])", city] : [city]
        for title in titles {
            if let page = await query(["titles": title]).first, let photo = usable(page) { return photo }
        }
        // The article's lead image is a map or flag: try related articles.
        let search = ([city] + parts.dropFirst()).joined(separator: " ")
        for page in await query(["generator": "search", "gsrsearch": search, "gsrlimit": "6"]) {
            if let photo = usable(page) { return photo }
        }
        return nil
    }

    private static func usable(_ page: Response.Page) -> PlacePhoto? {
        guard page.missing != true, page.pageprops?.disambiguation == nil,
              let name = page.pageimage, let thumb = page.thumbnail,
              notAPhoto.firstMatch(in: name, range: NSRange(name.startIndex..., in: name)) == nil,
              thumb.width >= thumb.height,
              let encoded = name.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed),
              let credit = URL(string: "https://commons.wikimedia.org/wiki/File:\(encoded)")
        else { return nil }
        return PlacePhoto(url: thumb.source, creditURL: credit)
    }

    private static func query(_ params: [String: String]) async -> [Response.Page] {
        var components = URLComponents(string: "https://en.wikipedia.org/w/api.php")!
        let base = [
            "action": "query", "format": "json", "formatversion": "2", "redirects": "1",
            "prop": "pageimages|pageprops", "piprop": "thumbnail|name", "pithumbsize": "1280",
        ]
        components.queryItems = base.merging(params) { $1 }.map { URLQueryItem(name: $0.key, value: $0.value) }
        var request = URLRequest(url: components.url!)
        // Wikimedia asks apps to identify themselves.
        request.setValue("WhereTwo/1.0 (iOS; \(Config.supportEmail))", forHTTPHeaderField: "User-Agent")
        guard let (data, _) = try? await URLSession.shared.data(for: request),
              let response = try? JSONDecoder().decode(Response.self, from: data)
        else { return [] }
        return (response.query?.pages ?? []).sorted { ($0.index ?? 0) < ($1.index ?? 0) }
    }
}

/// The destination's photo with a dark wash so white text reads on it; the destination's
/// color pair while loading or when there's no good photo.
struct PlacePhotoBackground: View {
    let location: String
    var muted = false
    var showsCredit = true
    /// Shown until (or instead of) the destination photo; the destination's colors when nil.
    var fallbackImage: String? = nil

    @State private var photo: PlacePhoto?

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            if let fallbackImage {
                Image(fallbackImage).resizable().scaledToFill()
            } else {
                Theme.destinationGradient(for: location, muted: muted)
            }
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
            if let hit = PlacePhotos.shared.cached(for: location) { photo = hit }
            photo = await PlacePhotos.shared.photo(for: location)
        }
    }
}
