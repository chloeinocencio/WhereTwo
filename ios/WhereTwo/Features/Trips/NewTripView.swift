import SwiftUI

struct NewTripView: View {
    @Environment(TripStore.self) private var store
    @Environment(\.dismiss) private var dismiss

    /// Called with the new trip so the list can open it while the plan generates.
    var onCreated: (Itinerary) -> Void

    @State private var destination = ""
    /// The destination as of the last pause in typing, so the photo preview doesn't search on every keystroke.
    @State private var previewLocation = ""
    @State private var base = ""
    @State private var title = ""
    @State private var startDate = Calendar.current.date(byAdding: .day, value: 14, to: .now) ?? .now
    @State private var endDate = Calendar.current.date(byAdding: .day, value: 17, to: .now) ?? .now
    @State private var interests: Set<String> = []
    @State private var style = "balanced"
    @State private var pace = "moderate"
    @State private var isSaving = false
    @State private var errorMessage: String?

    // Keys match the server's prompt builder (generateOptimalPlan in the edge function).
    private struct Interest: Identifiable {
        let key: String, label: String, symbol: String
        var id: String { key }
        init(_ key: String, _ label: String, _ symbol: String) { (self.key, self.label, self.symbol) = (key, label, symbol) }
    }
    private struct Choice: Identifiable {
        let key: String, label: String
        var id: String { key }
        init(_ key: String, _ label: String) { (self.key, self.label) = (key, label) }
    }

    private static let interestOptions: [Interest] = [
        Interest("food", "Food", "fork.knife"),
        Interest("museums", "Museums & art", "building.columns"),
        Interest("history", "History", "scroll"),
        Interest("nature", "Nature", "leaf"),
        Interest("shopping", "Shopping", "bag"),
        Interest("nightlife", "Nightlife", "moon.stars"),
        Interest("adventure", "Adventure", "figure.hiking"),
        Interest("relaxation", "Relaxation", "cup.and.saucer"),
        Interest("photography", "Photo spots", "camera"),
        Interest("local", "Local culture", "person.3"),
    ]
    private static let styles = [Choice("budget", "Budget"), Choice("balanced", "Mid-range"), Choice("luxury", "Luxury"), Choice("family", "Family")]
    private static let paces = [Choice("relaxed", "Relaxed"), Choice("moderate", "Moderate"), Choice("packed", "Packed")]

    private var dayCount: Int {
        let cal = Calendar.current
        let diff = cal.dateComponents([.day], from: cal.startOfDay(for: startDate), to: cal.startOfDay(for: endDate)).day ?? 0
        return max(diff + 1, 1)
    }

    private var canSave: Bool {
        !destination.trimmingCharacters(in: .whitespaces).isEmpty
            && !base.trimmingCharacters(in: .whitespaces).isEmpty
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Destination, e.g. Tokyo", text: $destination)
                        .textInputAutocapitalization(.words)
                        .task(id: destination) {
                            try? await Task.sleep(for: .milliseconds(600))
                            guard !Task.isCancelled else { return }
                            previewLocation = destination.trimmingCharacters(in: .whitespaces)
                        }
                    if !previewLocation.isEmpty {
                        // Booking-style preview of the place, from its Wikipedia photo.
                        PlacePhotoBackground(location: previewLocation)
                            .frame(height: 140)
                            .overlay(alignment: .bottomLeading) {
                                Text(previewLocation.split(separator: ",").first.map(String.init) ?? previewLocation)
                                    .font(Theme.display(22))
                                    .foregroundStyle(.white)
                                    .padding(12)
                            }
                            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                            .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                    }
                    TextField("Where you're staying, e.g. Shibuya", text: $base)
                        .textInputAutocapitalization(.words)
                    TextField("Trip name (optional)", text: $title)
                } footer: {
                    Text("Your stay is the plan's home base — most stops stay within about 30 minutes of it.")
                }

                Section {
                    DatePicker("Start", selection: $startDate, displayedComponents: .date)
                    DatePicker("End", selection: $endDate, in: startDate..., displayedComponents: .date)
                } footer: {
                    Text("\(dayCount) day\(dayCount == 1 ? "" : "s")")
                }

                Section("What are you into?") {
                    FlowLayout {
                        ForEach(Self.interestOptions) { option in
                            chip(option.label, symbol: option.symbol, selected: interests.contains(option.key)) {
                                if interests.contains(option.key) { interests.remove(option.key) } else { interests.insert(option.key) }
                            }
                        }
                    }
                    .padding(.vertical, 4)
                }

                Section("Budget & pace") {
                    Picker("Budget", selection: $style) {
                        ForEach(Self.styles) { Text($0.label).tag($0.key) }
                    }
                    Picker("Pace", selection: $pace) {
                        ForEach(Self.paces) { Text($0.label).tag($0.key) }
                    }
                }

                if let errorMessage {
                    Section { Text(errorMessage).foregroundStyle(.red) }
                }
            }
            .navigationTitle("New trip")
            .navigationBarTitleDisplayMode(.inline)
            .onChange(of: startDate) { _, new in
                if endDate < new { endDate = new }
            }
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    if isSaving {
                        ProgressView()
                    } else {
                        Button("Create") { save() }
                            .bold()
                            .disabled(!canSave)
                    }
                }
            }
            .interactiveDismissDisabled(isSaving)
        }
    }

    private func chip(_ label: String, symbol: String, selected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Label(label, systemImage: symbol)
                .font(.subheadline.weight(.medium))
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(selected ? AnyShapeStyle(Theme.blue) : AnyShapeStyle(Color(.tertiarySystemFill)), in: Capsule())
                .foregroundStyle(selected ? .white : .primary)
        }
        .buttonStyle(.plain)
        .sensoryFeedback(.selection, trigger: selected)
    }

    private func save() {
        let place = destination.trimmingCharacters(in: .whitespaces)
        let name = title.trimmingCharacters(in: .whitespaces)
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"

        let draft = NewTripDraft(
            title: name.isEmpty ? "Trip to \(place)" : name,
            location: place,
            base: base.trimmingCharacters(in: .whitespaces),
            days: dayCount,
            startDate: formatter.string(from: startDate),
            endDate: formatter.string(from: endDate),
            interests: Self.interestOptions.map { $0.key }.filter { interests.contains($0) },
            travelStyle: style,
            pace: pace
        )

        isSaving = true
        errorMessage = nil
        Task {
            do {
                let trip = try await store.create(draft)
                onCreated(trip)
                dismiss()
                try? await store.generatePlan(for: trip.id)
            } catch {
                errorMessage = error.localizedDescription
                isSaving = false
            }
        }
    }
}
