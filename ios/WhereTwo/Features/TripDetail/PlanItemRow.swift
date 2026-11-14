import SwiftUI

/// One stop in the day, as a Booking-style card matching the web: the place's photo on the
/// left, the name, address and details on the right. The time of day is shown above the
/// first stop of each slot. The check button marks the stop done.
struct PlanItemRow: View {
    let item: PlanItem
    let place: String
    /// Where the trip is staying, so photo matching can ignore the neighborhood's name.
    let neighborhood: String
    let isDone: Bool
    /// Show the time-of-day heading (only on the first stop of each slot).
    let showSlot: Bool
    let onToggle: () -> Void

    @State private var expanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            if showSlot, !item.timeSlot.isEmpty {
                Text(item.timeSlot)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Theme.ink)
                    .padding(.top, 6)
            }

            HStack(alignment: .top, spacing: 0) {
                StopPhoto(name: item.shortTitle, location: place, neighborhood: neighborhood)
                    .frame(width: 112)
                    .frame(maxHeight: .infinity)
                    .saturation(isDone ? 0 : 1)

                VStack(alignment: .leading, spacing: 6) {
                    HStack(alignment: .top, spacing: 8) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(item.shortTitle)
                                .font(Theme.display(17, .semibold))
                                .foregroundStyle(Theme.ink)
                                .strikethrough(isDone, color: Theme.slate)
                            if let address = item.address {
                                Text(address)
                                    .font(.caption)
                                    .foregroundStyle(Theme.slate)
                            }
                        }
                        Spacer(minLength: 0)
                        checkButton
                    }

                    if !item.description.isEmpty {
                        Text(item.description)
                            .font(.subheadline)
                            .foregroundStyle(Theme.ink.opacity(0.75))
                            .lineLimit(expanded ? nil : 3)
                            .contentShape(Rectangle())
                            .onTapGesture { withAnimation(.easeInOut(duration: 0.2)) { expanded.toggle() } }
                    }

                    if let notes = item.notes, !notes.isEmpty {
                        (Text("Note: ").fontWeight(.semibold).foregroundStyle(Theme.ink) + Text(notes))
                            .font(.footnote)
                            .foregroundStyle(Theme.ink.opacity(0.75))
                    }

                    HStack {
                        Link("Directions", destination: mapsURL)
                            .font(.subheadline.weight(.semibold))
                            .tint(Theme.blue)
                        Spacer()
                        if !item.duration.isEmpty {
                            Text(item.duration)
                                .font(.caption.weight(.medium))
                                .foregroundStyle(Theme.ink.opacity(0.75))
                                .padding(.horizontal, 8)
                                .padding(.vertical, 3)
                                .background(Color(hex: 0xEEF0F3), in: Capsule())
                        }
                    }
                    .padding(.top, 2)
                }
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .fixedSize(horizontal: false, vertical: true)
            .frame(minHeight: 140)
            .background(Color(.secondarySystemGroupedBackground))
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).strokeBorder(Theme.mist))
            .opacity(isDone ? 0.75 : 1)
        }
        .padding(.bottom, 12)
        .animation(.easeInOut(duration: 0.2), value: isDone)
    }

    private var checkButton: some View {
        Button(action: onToggle) {
            Image(systemName: isDone ? "checkmark.circle.fill" : "circle")
                .font(.title3)
                .foregroundStyle(isDone ? Theme.blue : Theme.slate.opacity(0.6))
                .contentTransition(.symbolEffect(.replace))
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
