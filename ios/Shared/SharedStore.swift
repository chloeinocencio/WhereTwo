import Foundation

/// File-backed cache in the App Group container, shared by the app and the widget extension.
/// It's what makes trips readable offline, and it's the widget's only data source.
enum SharedStore {
    static let appGroup = "group.com.chloeinocencio.wheretwo"

    private static var directory: URL {
        let base = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroup)
            ?? FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        let dir = base.appendingPathComponent("WhereTwo", isDirectory: true)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir
    }

    private static var tripsURL: URL { directory.appendingPathComponent("trips.json") }
    private static var completedURL: URL { directory.appendingPathComponent("completed.json") }
    private static var placesURL: URL { directory.appendingPathComponent("places.json") }

    // MARK: Trips

    static func loadTrips() -> [Itinerary] {
        guard let data = try? Data(contentsOf: tripsURL) else { return [] }
        return (try? JSONDecoder().decode([Itinerary].self, from: data)) ?? []
    }

    static func saveTrips(_ trips: [Itinerary]) {
        guard let data = try? JSONEncoder().encode(trips) else { return }
        try? data.write(to: tripsURL, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
    }

    // MARK: Completed activities (local to this device)

    static func activityKey(tripId: String, day: Int, index: Int) -> String {
        "\(tripId)|\(day)|\(index)"
    }

    static func loadCompleted() -> Set<String> {
        guard let data = try? Data(contentsOf: completedURL) else { return [] }
        return (try? JSONDecoder().decode(Set<String>.self, from: data)) ?? []
    }

    static func saveCompleted(_ keys: Set<String>) {
        guard let data = try? JSONEncoder().encode(keys) else { return }
        try? data.write(to: completedURL, options: .atomic)
    }

    // MARK: Geocoded places, so map pins work offline once a trip has been opened

    static func loadPlaces() -> [String: CachedPlace] {
        guard let data = try? Data(contentsOf: placesURL) else { return [:] }
        return (try? JSONDecoder().decode([String: CachedPlace].self, from: data)) ?? [:]
    }

    static func savePlaces(_ places: [String: CachedPlace]) {
        guard let data = try? JSONEncoder().encode(places) else { return }
        try? data.write(to: placesURL, options: .atomic)
    }

    /// Called on sign-out and account deletion so the next person on this phone sees nothing.
    static func clearAll() {
        for url in [tripsURL, completedURL, placesURL] {
            try? FileManager.default.removeItem(at: url)
        }
    }
}

struct CachedPlace: Codable, Hashable {
    var latitude: Double
    var longitude: Double
}

// MARK: - What the widget and Live Activity show

/// Picks the trip worth showing right now: one happening today, else the next upcoming one.
struct TodaySnapshot {
    enum Kind {
        case onTrip(trip: Itinerary, day: Int, plan: DayPlan?)
        case upcoming(trip: Itinerary, daysAway: Int)
        case nothing
    }

    let kind: Kind

    init(trips: [Itinerary], date: Date = .now) {
        if let trip = trips.first(where: { $0.dayNumber(on: date) != nil }),
           let day = trip.dayNumber(on: date) {
            kind = .onTrip(trip: trip, day: day, plan: trip.plan(forDay: day))
            return
        }
        let upcoming = trips
            .compactMap { trip -> (Itinerary, Int)? in
                guard let away = trip.daysUntilStart(from: date), away > 0 else { return nil }
                return (trip, away)
            }
            .min { $0.1 < $1.1 }
        if let pick = upcoming {
            kind = .upcoming(trip: pick.0, daysAway: pick.1)
        } else {
            kind = .nothing
        }
    }
}
