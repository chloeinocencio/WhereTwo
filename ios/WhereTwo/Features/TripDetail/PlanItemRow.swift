import SwiftUI

/// One stop on the day's route, matching the web trip page: a tinted marker on a
/// vertical route line, the time of day when it changes, then the place and details.
/// Tapping the marker checks the stop off.
struct PlanItemRow: View {
    let item: PlanItem
    let place: String
    let isDone: Bool
    /// Show the time-of-day label (only on the first stop of each slot).
    let showSlot: Bool
    /// The route line stops after the last stop.
    let isLast: Bool
    let onToggle: () -> Void

    @State private var expanded = false

    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            marker

            VStack(alignment: .leading, spacing: 0) {
                HStack(spacing: 10) {
                    if showSlot, !item.timeSlot.isEmpty {
                        Text(item.timeSlot).fontWeight(.medium)
                    }
                    if !item.duration.isEmpty {
                        Text(item.duration)
                    }
                }
                .font(.subheadline)
                .foregroundStyle(Theme.slate)
                .frame(minHeight: 40, alignment: .center)

                Text(item.shortTitle)
                    .font(Theme.display(19, .semibold))
                    .foregroundStyle(isDone ? Theme.slate : Theme.ink)
                    .strikethrough(isDone, color: Theme.slate)
                if let address = item.address {
                    Text(address)
                        .font(.subheadline)
                        .foregroundStyle(Theme.slate)
                        .padding(.top, 2)
                }

                if !item.description.isEmpty {
                    Text(item.description)
                        .font(.callout)
                        .foregroundStyle(Theme.ink.opacity(0.78))
                        .lineLimit(expanded ? nil : 4)
                        .padding(.top, 8)
                        .contentShape(Rectangle())
                        .onTapGesture { withAnimation(.easeInOut(duration: 0.2)) { expanded.toggle() } }
                }

                if let notes = item.notes, !notes.isEmpty {
                    (Text("Note: ").fontWeight(.semibold).foregroundStyle(Theme.ink) + Text(notes))
                        .font(.subheadline)
                        .foregroundStyle(Theme.ink.opacity(0.78))
                        .padding(.horizontal, 12)
                        .padding(.vertical, 9)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color(.systemBackground), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(Theme.mist))
                        .padding(.top, 10)
                }

                Link(destination: mapsURL) {
                    Label("Directions", systemImage: "map")
                        .font(.subheadline.weight(.medium))
                }
                .tint(Theme.blue)
                .padding(.top, 10)
            }
            .padding(.bottom, 30)
            .opacity(isDone ? 0.7 : 1)
        }
        // Route line down to the next stop, under the marker's center.
        .background(alignment: .topLeading) {
            if !isLast {
                Capsule()
                    .fill(Theme.mist)
                    .frame(width: 2)
                    .frame(maxHeight: .infinity)
                    .padding(.top, 46)
                    .padding(.leading, 19)
            }
        }
        .animation(.easeInOut(duration: 0.2), value: isDone)
    }

    /// The stop's marker doubles as its check-off button.
    private var marker: some View {
        let tint = item.kind.tint
        return Button(action: onToggle) {
            ZStack {
                Circle().fill(isDone ? tint : tint.opacity(0.12))
                Image(systemName: isDone ? "checkmark" : item.symbolName)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(isDone ? .white : tint)
                    .contentTransition(.symbolEffect(.replace))
            }
            .frame(width: 40, height: 40)
        }
        .buttonStyle(.plain)
        .sensoryFeedback(.success, trigger: isDone) { _, new in new }
        .accessibilityLabel(isDone ? "\(item.shortTitle), done. Mark not done" : "Mark \(item.shortTitle) done")
    }

    /// Opens Apple Maps searching for the place (address included when Gemini gave one).
    private var mapsURL: URL {
        var components = URLComponents(string: "https://maps.apple.com/")!
        components.queryItems = [URLQueryItem(name: "q", value: "\(item.title), \(place)")]
        return components.url!
    }
}
