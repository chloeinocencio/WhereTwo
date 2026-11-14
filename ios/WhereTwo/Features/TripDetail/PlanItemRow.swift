import SwiftUI

struct PlanItemRow: View {
    let item: PlanItem
    let place: String
    let isDone: Bool
    let onToggle: () -> Void

    @State private var expanded = false

    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            Button(action: onToggle) {
                Image(systemName: isDone ? "checkmark.circle.fill" : "circle")
                    .font(.title2)
                    .foregroundStyle(isDone ? Theme.blue : Color.secondary)
                    .contentTransition(.symbolEffect(.replace))
            }
            .buttonStyle(.plain)
            .sensoryFeedback(.success, trigger: isDone) { _, new in new }
            .accessibilityLabel(isDone ? "Mark not done" : "Mark done")

            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 6) {
                    if !item.timeSlot.isEmpty {
                        Text(item.timeSlot.uppercased())
                            .font(.caption2.bold())
                            .foregroundStyle(Theme.blue)
                    }
                    if !item.duration.isEmpty {
                        Text("· \(item.duration)")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }

                Label {
                    Text(item.shortTitle)
                        .font(.headline)
                        .strikethrough(isDone, color: .secondary)
                        .foregroundStyle(isDone ? .secondary : .primary)
                } icon: {
                    Image(systemName: item.symbolName).foregroundStyle(Theme.blue)
                }

                if !item.description.isEmpty {
                    Text(item.description)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .lineLimit(expanded ? nil : 3)
                        .onTapGesture { withAnimation(.easeInOut(duration: 0.2)) { expanded.toggle() } }
                }

                if let notes = item.notes, !notes.isEmpty {
                    Label(notes, systemImage: "note.text")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Link(destination: mapsURL) {
                    Label("Directions", systemImage: "arrow.triangle.turn.up.right.circle")
                        .font(.caption.weight(.semibold))
                }
                .padding(.top, 2)
            }
            Spacer(minLength: 0)
        }
        .padding(16)
        .background(Color(.secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .opacity(isDone ? 0.7 : 1)
        .animation(.easeInOut(duration: 0.2), value: isDone)
    }

    /// Opens Apple Maps searching for the place (address included when Gemini gave one).
    private var mapsURL: URL {
        var components = URLComponents(string: "https://maps.apple.com/")!
        components.queryItems = [URLQueryItem(name: "q", value: "\(item.title), \(place)")]
        return components.url!
    }
}
