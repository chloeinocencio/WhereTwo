import SwiftUI
import WidgetKit

// MARK: - Timeline

struct TodayEntry: TimelineEntry {
    let date: Date
    let snapshot: TodaySnapshot
    let completed: Set<String>

    func isDone(trip: String, day: Int, index: Int) -> Bool {
        completed.contains(SharedStore.activityKey(tripId: trip, day: day, index: index))
    }
}

struct TodayProvider: TimelineProvider {
    func placeholder(in context: Context) -> TodayEntry {
        TodayEntry(date: .now, snapshot: TodaySnapshot(trips: []), completed: [])
    }

    func getSnapshot(in context: Context, completion: @escaping (TodayEntry) -> Void) {
        completion(entry(for: .now))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<TodayEntry>) -> Void) {
        // The app reloads timelines whenever trips or check-offs change; otherwise the only
        // thing that changes what we show is the date, so refresh just after midnight.
        let now = Date.now
        let tomorrow = Calendar.current.startOfDay(for: now).addingTimeInterval(24 * 3600 + 60)
        completion(Timeline(entries: [entry(for: now)], policy: .after(tomorrow)))
    }

    private func entry(for date: Date) -> TodayEntry {
        TodayEntry(date: date, snapshot: TodaySnapshot(trips: SharedStore.loadTrips(), date: date),
                   completed: SharedStore.loadCompleted())
    }
}

// MARK: - Widget

struct TodayWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "TodayWidget", provider: TodayProvider()) { entry in
            TodayWidgetView(entry: entry)
        }
        .configurationDisplayName("Today's plan")
        .description("What's next on your trip, or a countdown to the next one.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular])
    }
}

struct TodayWidgetView: View {
    @Environment(\.widgetFamily) private var family
    let entry: TodayEntry

    var body: some View {
        content
            .containerBackground(for: .widget) {
                if family == .accessoryRectangular {
                    Color.clear
                } else {
                    Theme.headerGradient
                }
            }
            .widgetURL(tripURL)
    }

    private var tripURL: URL? {
        switch entry.snapshot.kind {
        case .onTrip(let trip, _, _), .upcoming(let trip, _):
            return URL(string: "wheretwo://trip/\(trip.id)")
        case .nothing:
            return nil
        }
    }

    @ViewBuilder
    private var content: some View {
        switch entry.snapshot.kind {
        case let .onTrip(trip, day, plan):
            onTrip(trip: trip, day: day, plan: plan)
        case let .upcoming(trip, daysAway):
            upcoming(trip: trip, daysAway: daysAway)
        case .nothing:
            nothing
        }
    }

    // MARK: On a trip today

    /// Unfinished activities first, in plan order, with their index in the day.
    private func remaining(trip: Itinerary, day: Int, plan: DayPlan?) -> [(Int, PlanItem)] {
        (plan?.activities ?? []).enumerated()
            .filter { !entry.isDone(trip: trip.id, day: day, index: $0.offset) }
            .map { ($0.offset, $0.element) }
    }

    @ViewBuilder
    private func onTrip(trip: Itinerary, day: Int, plan: DayPlan?) -> some View {
        let left = remaining(trip: trip, day: day, plan: plan)
        let total = plan?.activities.count ?? 0

        switch family {
        case .accessoryRectangular:
            VStack(alignment: .leading, spacing: 1) {
                Text("Day \(day) · \(trip.place)").font(.caption2.bold()).widgetAccentable()
                if let next = left.first?.1 {
                    Text(next.shortTitle).font(.headline).lineLimit(1)
                    if !next.timeSlot.isEmpty { Text(next.timeSlot).font(.caption2).foregroundStyle(.secondary) }
                } else {
                    Text(total == 0 ? "Free day" : "All done today").font(.headline)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)

        case .systemSmall:
            VStack(alignment: .leading, spacing: 6) {
                header(trip: trip, day: day)
                Spacer(minLength: 0)
                if let next = left.first?.1 {
                    Text(next.timeSlot.isEmpty ? "Next" : next.timeSlot.uppercased())
                        .font(.caption2.bold())
                        .foregroundStyle(.white.opacity(0.7))
                    Text(next.shortTitle)
                        .font(.headline)
                        .foregroundStyle(.white)
                        .lineLimit(3)
                } else {
                    Image(systemName: total == 0 ? "sun.max.fill" : "checkmark.seal.fill").font(.title2).foregroundStyle(.white)
                    Text(total == 0 ? "Free day" : "All done today").font(.headline).foregroundStyle(.white)
                }
                progress(done: total - left.count, total: total)
            }

        default:
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    header(trip: trip, day: day)
                    Spacer()
                    if total > 0 {
                        Text("\(total - left.count)/\(total)")
                            .font(.caption.bold())
                            .foregroundStyle(.white.opacity(0.8))
                    }
                }
                if left.isEmpty {
                    Spacer(minLength: 0)
                    Label(total == 0 ? "Free day — enjoy it" : "All done for today", systemImage: total == 0 ? "sun.max.fill" : "checkmark.seal.fill")
                        .font(.headline)
                        .foregroundStyle(.white)
                    Spacer(minLength: 0)
                } else {
                    ForEach(Array(left.prefix(3).enumerated()), id: \.offset) { position, pair in
                        HStack(spacing: 8) {
                            Image(systemName: pair.1.symbolName)
                                .font(.caption)
                                .frame(width: 16)
                            Text(pair.1.shortTitle)
                                .font(position == 0 ? .subheadline.bold() : .subheadline)
                                .lineLimit(1)
                            Spacer(minLength: 4)
                            Text(pair.1.timeSlot)
                                .font(.caption2)
                                .opacity(0.7)
                        }
                        .foregroundStyle(.white.opacity(position == 0 ? 1 : 0.8))
                    }
                    Spacer(minLength: 0)
                }
            }
        }
    }

    private func header(trip: Itinerary, day: Int) -> some View {
        VStack(alignment: .leading, spacing: 1) {
            Text("DAY \(day) OF \(trip.days)")
                .font(.caption2.bold())
                .foregroundStyle(.white.opacity(0.7))
            Text(trip.place)
                .font(.subheadline.bold())
                .foregroundStyle(.white)
                .lineLimit(1)
        }
    }

    private func progress(done: Int, total: Int) -> some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(.white.opacity(0.25))
                Capsule().fill(.white)
                    .frame(width: total == 0 ? 0 : geo.size.width * CGFloat(done) / CGFloat(total))
            }
        }
        .frame(height: 4)
    }

    // MARK: Upcoming trip

    @ViewBuilder
    private func upcoming(trip: Itinerary, daysAway: Int) -> some View {
        switch family {
        case .accessoryRectangular:
            VStack(alignment: .leading, spacing: 1) {
                Text(trip.place).font(.headline).lineLimit(1).widgetAccentable()
                Text(daysAway == 1 ? "Tomorrow" : "In \(daysAway) days").font(.caption)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        default:
            VStack(alignment: .leading, spacing: 4) {
                Image(systemName: "airplane.departure")
                    .font(.headline)
                    .foregroundStyle(.white.opacity(0.8))
                Spacer(minLength: 0)
                Text(daysAway == 1 ? "Tomorrow" : "\(daysAway) days")
                    .font(.system(size: family == .systemSmall ? 30 : 36, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                    .minimumScaleFactor(0.6)
                Text("until \(trip.place)")
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(.white.opacity(0.85))
                    .lineLimit(1)
                if family == .systemMedium, let range = trip.dateRangeText {
                    Text(range).font(.caption).foregroundStyle(.white.opacity(0.7))
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    // MARK: No trips

    @ViewBuilder
    private var nothing: some View {
        if family == .accessoryRectangular {
            Text("No trips planned").font(.headline)
        } else {
            VStack(alignment: .leading, spacing: 6) {
                Image(systemName: "globe.americas.fill").font(.title2).foregroundStyle(.white)
                Spacer(minLength: 0)
                Text("Where to next?").font(.headline).foregroundStyle(.white)
                Text("Plan a trip in WhereTwo").font(.caption).foregroundStyle(.white.opacity(0.75))
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}
