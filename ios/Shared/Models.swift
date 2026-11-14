import Foundation

// Mirrors the JSON stored by the Supabase edge function (supabase/functions/server/index.tsx).
// Decoding is deliberately forgiving: the web app and Gemini both write this data, so a
// missing or oddly-typed field should degrade gracefully instead of hiding a whole trip.

struct Itinerary: Codable, Identifiable, Hashable {
    var id: String
    var title: String
    var location: String
    var area: String
    var base: String
    var days: Int
    var startDate: String?
    var endDate: String?
    var interests: [String]
    var travelStyle: String
    var pace: String
    var ownerId: String
    var ownerUsername: String
    var collaborators: [Collaborator]
    var plan: [DayPlan]
    var flights: [Flight]
    var createdAt: String?
    var updatedAt: String?

    enum CodingKeys: String, CodingKey {
        case id, title, location, area, base, days, startDate, endDate, interests, travelStyle, pace
        case ownerId, ownerUsername, collaborators, plan, flights, createdAt, updatedAt
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        title = c.lenient(String.self, .title) ?? "Untitled trip"
        location = c.lenient(String.self, .location) ?? ""
        area = c.lenient(String.self, .area) ?? ""
        base = c.lenient(String.self, .base) ?? ""
        days = c.lenientInt(.days) ?? 1
        startDate = c.lenient(String.self, .startDate)
        endDate = c.lenient(String.self, .endDate)
        interests = c.lenient([String].self, .interests) ?? []
        travelStyle = c.lenient(String.self, .travelStyle) ?? "balanced"
        pace = c.lenient(String.self, .pace) ?? "moderate"
        ownerId = c.lenient(String.self, .ownerId) ?? ""
        ownerUsername = c.lenient(String.self, .ownerUsername) ?? ""
        collaborators = c.lenientArray(Collaborator.self, .collaborators)
        plan = c.lenientArray(DayPlan.self, .plan).sorted { $0.day < $1.day }
        flights = c.lenientArray(Flight.self, .flights)
        createdAt = c.lenient(String.self, .createdAt)
        updatedAt = c.lenient(String.self, .updatedAt)
    }
}

struct Collaborator: Codable, Hashable {
    var userId: String
    var username: String
}

struct DayPlan: Codable, Hashable {
    var day: Int
    var activities: [PlanItem]

    enum CodingKeys: String, CodingKey { case day, activities }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        day = c.lenientInt(.day) ?? 1
        activities = c.lenientArray(PlanItem.self, .activities)
    }
}

struct PlanItem: Codable, Hashable {
    var id: String?
    var timeSlot: String
    var type: String
    var title: String
    var description: String
    var duration: String
    var notes: String?

    enum CodingKeys: String, CodingKey { case id, timeSlot, type, title, description, duration, notes }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = c.lenient(String.self, .id)
        timeSlot = c.lenient(String.self, .timeSlot) ?? ""
        type = c.lenient(String.self, .type) ?? ""
        title = c.lenient(String.self, .title) ?? "Activity"
        description = c.lenient(String.self, .description) ?? ""
        duration = c.lenient(String.self, .duration) ?? ""
        notes = c.lenient(String.self, .notes)
    }

    /// Gemini often writes "Place Name (street address)". The bare name reads better in
    /// tight spaces like widgets, and the parenthetical makes a better map search.
    var shortTitle: String {
        guard let paren = title.firstIndex(of: "(") else { return title }
        let trimmed = title[..<paren].trimmingCharacters(in: .whitespaces)
        return trimmed.isEmpty ? title : trimmed
    }

    /// Activity category, shared by the icon and tint so they always agree (same set as the web app).
    enum Kind {
        case sightseeing, dining, shopping, culture, nature, entertainment, relaxation, other
    }

    var kind: Kind {
        let t = type.lowercased()
        if t.contains("din") || t.contains("food") || t.contains("restaurant") { return .dining }
        if t.contains("museum") || t.contains("art") || t.contains("culture") { return .culture }
        if t.contains("shop") || t.contains("market") { return .shopping }
        if t.contains("nature") || t.contains("park") || t.contains("outdoor") || t.contains("adventure") { return .nature }
        if t.contains("night") || t.contains("bar") || t.contains("entertain") { return .entertainment }
        if t.contains("relax") || t.contains("wellness") || t.contains("spa") { return .relaxation }
        if t.contains("sight") { return .sightseeing }
        return .other
    }

    var symbolName: String {
        switch kind {
        case .sightseeing: return "building.columns"
        case .dining: return "fork.knife"
        case .shopping: return "bag"
        case .culture: return "paintpalette"
        case .nature: return "tree"
        case .entertainment: return "ticket"
        case .relaxation: return "cup.and.saucer"
        case .other: return "mappin"
        }
    }

    /// The street address Gemini puts in parentheses after the name, if any.
    var address: String? {
        guard let open = title.firstIndex(of: "("), let close = title.lastIndex(of: ")"), open < close else { return nil }
        let inner = String(title[title.index(after: open)..<close])
        return inner.rangeOfCharacter(from: .decimalDigits) != nil ? inner : nil
    }
}

struct Flight: Codable, Hashable, Identifiable {
    var id: String
    var airline: String
    var iata: String
    var flightNumber: String
    var from: String
    var to: String
    var date: String
    var departureTime: String
    var arrivalTime: String
    var notes: String

    enum CodingKeys: String, CodingKey {
        case id, airline, iata, flightNumber, from, to, date, departureTime, arrivalTime, notes
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = c.lenient(String.self, .id) ?? UUID().uuidString
        airline = c.lenient(String.self, .airline) ?? ""
        iata = c.lenient(String.self, .iata) ?? ""
        flightNumber = c.lenient(String.self, .flightNumber) ?? ""
        from = c.lenient(String.self, .from) ?? ""
        to = c.lenient(String.self, .to) ?? ""
        date = c.lenient(String.self, .date) ?? ""
        departureTime = c.lenient(String.self, .departureTime) ?? ""
        arrivalTime = c.lenient(String.self, .arrivalTime) ?? ""
        notes = c.lenient(String.self, .notes) ?? ""
    }
}

// MARK: - Trip dates

extension Itinerary {
    private static let dayFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.calendar = Calendar(identifier: .gregorian)
        f.timeZone = .current
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    /// Accepts "2026-11-14" or a full ISO timestamp, since older trips may have either.
    static func parseDay(_ string: String?) -> Date? {
        guard let string, !string.isEmpty else { return nil }
        return dayFormatter.date(from: String(string.prefix(10)))
    }

    var start: Date? { Self.parseDay(startDate) }

    var end: Date? {
        if let end = Self.parseDay(endDate) { return end }
        guard let start else { return nil }
        return Calendar.current.date(byAdding: .day, value: max(days - 1, 0), to: start)
    }

    /// 1-based trip day for `date`, or nil if the trip isn't happening that day.
    func dayNumber(on date: Date = .now) -> Int? {
        guard let start else { return nil }
        let cal = Calendar.current
        let diff = cal.dateComponents([.day], from: cal.startOfDay(for: start), to: cal.startOfDay(for: date)).day ?? -1
        let number = diff + 1
        return (1...max(days, 1)).contains(number) ? number : nil
    }

    func daysUntilStart(from date: Date = .now) -> Int? {
        guard let start else { return nil }
        let cal = Calendar.current
        return cal.dateComponents([.day], from: cal.startOfDay(for: date), to: cal.startOfDay(for: start)).day
    }

    func plan(forDay day: Int) -> DayPlan? { plan.first { $0.day == day } }

    var isPast: Bool {
        guard let end else { return false }
        return Calendar.current.startOfDay(for: end) < Calendar.current.startOfDay(for: .now)
    }

    var dateRangeText: String? {
        guard let start, let end else { return nil }
        return start.formatted(.dateTime.month(.abbreviated).day()) + " – " + end.formatted(.dateTime.month(.abbreviated).day())
    }

    var place: String { location.isEmpty ? title : location }
}

// MARK: - Lenient decoding helpers

extension KeyedDecodingContainer {
    func lenient<T: Decodable>(_ type: T.Type, _ key: Key) -> T? {
        (try? decodeIfPresent(type, forKey: key)) ?? nil
    }

    func lenientInt(_ key: Key) -> Int? {
        if let value = lenient(Int.self, key) { return value }
        if let value = lenient(Double.self, key) { return Int(value) }
        if let value = lenient(String.self, key) { return Int(value.trimmingCharacters(in: .whitespaces)) }
        return nil
    }

    /// Decodes an array element by element, skipping any element that fails.
    func lenientArray<T: Decodable>(_ type: T.Type, _ key: Key) -> [T] {
        guard var items = try? nestedUnkeyedContainer(forKey: key) else { return [] }
        var result: [T] = []
        while !items.isAtEnd {
            if let value = try? items.decode(T.self) {
                result.append(value)
            } else {
                _ = try? items.decode(AnyDecodable.self)
            }
        }
        return result
    }
}

/// Consumes one JSON value of any shape so `lenientArray` can step past bad elements.
private struct AnyDecodable: Decodable {
    init(from decoder: Decoder) throws {}
}
