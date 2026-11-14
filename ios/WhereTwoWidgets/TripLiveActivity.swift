import ActivityKit
import SwiftUI
import WidgetKit

struct TripLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: TripActivityAttributes.self) { context in
            LockScreenView(context: context)
                .activityBackgroundTint(Theme.navy)
                .activitySystemActionForegroundColor(.white)
                .widgetURL(URL(string: "wheretwo://trip/\(context.attributes.tripId)"))
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Label("Day \(context.attributes.day)", systemImage: "airplane")
                        .font(.caption.bold())
                        .foregroundStyle(Theme.sky)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("\(context.state.completed)/\(context.state.total)")
                        .font(.caption.bold())
                        .monospacedDigit()
                }
                DynamicIslandExpandedRegion(.center) {
                    Text(context.attributes.location)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(alignment: .leading, spacing: 6) {
                        HStack(spacing: 8) {
                            StopNumber(number: context.state.currentNumber, size: 24)
                            VStack(alignment: .leading, spacing: 1) {
                                if !context.state.currentSlot.isEmpty {
                                    Text(context.state.currentSlot.uppercased())
                                        .font(.caption2.bold())
                                        .foregroundStyle(.secondary)
                                }
                                Text(context.state.currentTitle)
                                    .font(.headline)
                                    .lineLimit(1)
                            }
                            Spacer(minLength: 0)
                        }
                        if let next = context.state.nextTitle {
                            Text("Then: \(next)")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                                .lineLimit(1)
                        }
                        ProgressView(value: context.state.progress)
                            .tint(Theme.sky)
                    }
                }
            } compactLeading: {
                StopNumber(number: context.state.currentNumber, size: 20)
            } compactTrailing: {
                Text(context.state.currentTitle)
                    .font(.caption2)
                    .lineLimit(1)
                    .frame(maxWidth: 70)
            } minimal: {
                Image(systemName: context.state.isFinished ? "checkmark" : "airplane")
                    .foregroundStyle(Theme.sky)
            }
            .widgetURL(URL(string: "wheretwo://trip/\(context.attributes.tripId)"))
            .keylineTint(Theme.sky)
        }
    }
}

private struct LockScreenView: View {
    let context: ActivityViewContext<TripActivityAttributes>

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("DAY \(context.attributes.day) · \(context.attributes.location.uppercased())")
                    .font(.caption2.bold())
                    .foregroundStyle(.white.opacity(0.7))
                    .lineLimit(1)
                Spacer()
                Text("\(context.state.completed) of \(context.state.total) done")
                    .font(.caption2.bold())
                    .foregroundStyle(.white.opacity(0.7))
            }

            HStack(spacing: 12) {
                StopNumber(number: context.state.currentNumber, size: 30)
                VStack(alignment: .leading, spacing: 2) {
                    if !context.state.currentSlot.isEmpty {
                        Text(context.state.currentSlot)
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(.white.opacity(0.7))
                    }
                    Text(context.state.currentTitle)
                        .font(.headline)
                        .foregroundStyle(.white)
                        .lineLimit(2)
                }
                Spacer(minLength: 0)
            }

            if let next = context.state.nextTitle {
                Text("Then: \(next)")
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.7))
                    .lineLimit(1)
            }

            ProgressView(value: context.state.progress)
                .tint(Theme.sky)
        }
        .padding(16)
    }
}

/// The current stop's position in the day, or a checkmark once the day is done.
private struct StopNumber: View {
    let number: Int?
    let size: CGFloat

    var body: some View {
        ZStack {
            Circle().fill(Theme.sky.opacity(0.25))
            if let number {
                Text("\(number)")
                    .font(.system(size: size * 0.5, weight: .bold, design: .rounded))
            } else {
                Image(systemName: "checkmark")
                    .font(.system(size: size * 0.45, weight: .bold))
            }
        }
        .foregroundStyle(Theme.sky)
        .frame(width: size, height: size)
    }
}
