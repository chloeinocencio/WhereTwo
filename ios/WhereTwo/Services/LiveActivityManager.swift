import ActivityKit
import Foundation

/// Starts, updates and ends the "today on this trip" Live Activity. Everything is local:
/// the app updates it when you check an activity off, so no push notification server is needed.
@MainActor
enum LiveActivityManager {
    static var isSupported: Bool { ActivityAuthorizationInfo().areActivitiesEnabled }

    static func activity(for tripId: String) -> Activity<TripActivityAttributes>? {
        Activity<TripActivityAttributes>.activities.first { $0.attributes.tripId == tripId }
    }

    static func isRunning(tripId: String, day: Int) -> Bool {
        guard let activity = activity(for: tripId) else { return false }
        return activity.attributes.day == day && activity.activityState == .active
    }

    static func start(trip: Itinerary, day: Int, store: TripStore) async throws {
        // One trip day on the Lock Screen at a time.
        for running in Activity<TripActivityAttributes>.activities {
            await running.end(nil, dismissalPolicy: .immediate)
        }
        let attributes = TripActivityAttributes(tripId: trip.id, tripTitle: trip.title, location: trip.place, day: day)
        let state = makeState(trip: trip, day: day, store: store)
        _ = try Activity<TripActivityAttributes>.request(
            attributes: attributes,
            content: ActivityContent(state: state, staleDate: endOfToday),
            pushType: nil
        )
    }

    static func update(trip: Itinerary, day: Int, store: TripStore) async {
        guard let activity = activity(for: trip.id), activity.attributes.day == day else { return }
        let state = makeState(trip: trip, day: day, store: store)
        await activity.update(ActivityContent(state: state, staleDate: endOfToday))
        if state.isFinished {
            // Leave the "all done" state up briefly, then clear it.
            await activity.end(ActivityContent(state: state, staleDate: nil),
                               dismissalPolicy: .after(.now.addingTimeInterval(30 * 60)))
        }
    }

    static func end(tripId: String) async {
        await activity(for: tripId)?.end(nil, dismissalPolicy: .immediate)
    }

    private static func makeState(trip: Itinerary, day: Int, store: TripStore) -> TripActivityAttributes.ContentState {
        TripActivityAttributes.ContentState(plan: trip.plan(forDay: day)) { index in
            store.isCompleted(trip: trip.id, day: day, index: index)
        }
    }

    private static var endOfToday: Date {
        Calendar.current.date(bySettingHour: 23, minute: 59, second: 0, of: .now) ?? .now.addingTimeInterval(12 * 3600)
    }
}
