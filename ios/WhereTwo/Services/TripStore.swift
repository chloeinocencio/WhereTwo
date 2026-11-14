import ActivityKit
import Foundation
import Observation
import WidgetKit

/// Trips for the signed-in user. Reads the on-disk cache first so the app opens instantly
/// and works offline, then refreshes from the server when it can.
@MainActor
@Observable
final class TripStore {
    private(set) var trips: [Itinerary]
    private(set) var completed: Set<String>
    private(set) var isRefreshing = false
    private(set) var isOffline = false
    /// Trip IDs with a Gemini plan currently being generated.
    private(set) var generating: Set<String> = []

    private let api: APIClient

    init(api: APIClient) {
        self.api = api
        trips = Self.sorted(SharedStore.loadTrips())
        completed = SharedStore.loadCompleted()
    }

    func trip(id: String) -> Itinerary? { trips.first { $0.id == id } }

    var currentAndUpcoming: [Itinerary] { trips.filter { !$0.isPast } }
    var past: [Itinerary] { trips.filter(\.isPast) }

    // MARK: Loading

    func refresh() async {
        isRefreshing = true
        defer { isRefreshing = false }
        do {
            trips = Self.sorted(try await api.itineraries())
            isOffline = false
            persist()
        } catch APIError.offline {
            isOffline = true
        } catch {
            // Keep showing cached trips; the list view surfaces `isOffline` only for network loss.
        }
    }

    func refreshTrip(id: String) async {
        do {
            replace(try await api.itinerary(id: id))
            isOffline = false
        } catch APIError.offline {
            isOffline = true
        } catch {}
    }

    // MARK: Changes

    @discardableResult
    func create(_ draft: NewTripDraft) async throws -> Itinerary {
        let trip = try await api.createItinerary(draft)
        replace(trip)
        return trip
    }

    func generatePlan(for id: String) async throws {
        generating.insert(id)
        defer { generating.remove(id) }
        let trip = try await api.generatePlan(id: id)
        // A regenerated plan invalidates old check-offs for this trip.
        completed = completed.filter { !$0.hasPrefix(id + "|") }
        SharedStore.saveCompleted(completed)
        replace(trip)
    }

    func invite(username: String, to id: String) async throws {
        let cleaned = username.trimmingCharacters(in: .whitespaces).trimmingCharacters(in: CharacterSet(charactersIn: "@"))
        replace(try await api.invite(username: cleaned, to: id))
    }

    func delete(id: String) async throws {
        try await api.deleteItinerary(id: id)
        trips.removeAll { $0.id == id }
        completed = completed.filter { !$0.hasPrefix(id + "|") }
        SharedStore.saveCompleted(completed)
        persist()
        await LiveActivityManager.end(tripId: id)
    }

    // MARK: Check-offs (kept on this device only)

    func isCompleted(trip: String, day: Int, index: Int) -> Bool {
        completed.contains(SharedStore.activityKey(tripId: trip, day: day, index: index))
    }

    func toggleCompleted(trip: Itinerary, day: Int, index: Int) {
        let key = SharedStore.activityKey(tripId: trip.id, day: day, index: index)
        if completed.contains(key) { completed.remove(key) } else { completed.insert(key) }
        SharedStore.saveCompleted(completed)
        WidgetCenter.shared.reloadAllTimelines()
        Task { await LiveActivityManager.update(trip: trip, day: day, store: self) }
    }

    /// On sign-out: forget everything, on disk too, so the next account starts clean.
    func reset() {
        trips = []
        completed = []
        isOffline = false
        SharedStore.clearAll()
        WidgetCenter.shared.reloadAllTimelines()
        Task { for activity in Activity<TripActivityAttributes>.activities { await activity.end(nil, dismissalPolicy: .immediate) } }
    }

    // MARK: Private

    private func replace(_ trip: Itinerary) {
        if let index = trips.firstIndex(where: { $0.id == trip.id }) {
            trips[index] = trip
        } else {
            trips.append(trip)
        }
        trips = Self.sorted(trips)
        persist()
    }

    private func persist() {
        SharedStore.saveTrips(trips)
        WidgetCenter.shared.reloadAllTimelines()
    }

    /// Soonest first; trips without dates after dated ones; past trips most-recent first.
    private static func sorted(_ trips: [Itinerary]) -> [Itinerary] {
        let active = trips.filter { !$0.isPast }.sorted {
            switch ($0.start, $1.start) {
            case let (a?, b?): return a < b
            case (.some, .none): return true
            case (.none, .some): return false
            case (.none, .none): return ($0.createdAt ?? "") > ($1.createdAt ?? "")
            }
        }
        let past = trips.filter(\.isPast).sorted { ($0.start ?? .distantPast) > ($1.start ?? .distantPast) }
        return active + past
    }
}
