import ActivityKit
import Foundation

/// The Live Activity for "today on this trip". The app starts it from a trip's day view and
/// updates it locally as activities are checked off, so it needs no push server.
struct TripActivityAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        var currentTitle: String
        var currentSlot: String
        var currentSymbol: String
        var nextTitle: String?
        var completed: Int
        var total: Int

        var progress: Double { total == 0 ? 0 : Double(completed) / Double(total) }
        var isFinished: Bool { total > 0 && completed >= total }
    }

    var tripId: String
    var tripTitle: String
    var location: String
    var day: Int
}

extension TripActivityAttributes.ContentState {
    /// Builds the state from a day's plan and which activities are done: "current" is the
    /// first unfinished one, "next" the one after it.
    init(plan: DayPlan?, isDone: (Int) -> Bool) {
        let activities = plan?.activities ?? []
        let remaining = activities.indices.filter { !isDone($0) }
        let completed = activities.count - remaining.count

        if let first = remaining.first {
            let current = activities[first]
            self.init(
                currentTitle: current.shortTitle,
                currentSlot: current.timeSlot,
                currentSymbol: current.symbolName,
                nextTitle: remaining.dropFirst().first.map { activities[$0].shortTitle },
                completed: completed,
                total: activities.count
            )
        } else {
            self.init(
                currentTitle: activities.isEmpty ? "Free day" : "All done for today",
                currentSlot: "",
                currentSymbol: activities.isEmpty ? "sun.max" : "checkmark.seal.fill",
                nextTitle: nil,
                completed: completed,
                total: activities.count
            )
        }
    }
}
