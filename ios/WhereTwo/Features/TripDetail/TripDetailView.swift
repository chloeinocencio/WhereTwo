import SwiftUI

struct TripDetailView: View {
    @Environment(TripStore.self) private var store
    @Environment(AuthModel.self) private var auth
    @Environment(\.dismiss) private var dismiss

    let tripId: String

    private enum Mode: String, CaseIterable { case plan = "Plan", map = "Map" }

    @State private var selectedDay = 1
    @State private var mode: Mode = .plan
    @State private var showingInvite = false
    @State private var confirmingDelete = false
    @State private var confirmingRegenerate = false
    @State private var liveActivityRunning = false
    @State private var errorMessage: String?
    @State private var didPickInitialDay = false

    var body: some View {
        Group {
            if let trip = store.trip(id: tripId) {
                content(trip)
            } else {
                ContentUnavailableView("Trip not found", systemImage: "map",
                                       description: Text("It may have been deleted, or you were removed from it."))
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .task { await store.refreshTrip(id: tripId) }
        .alert("Something went wrong", isPresented: Binding(
            get: { errorMessage != nil },
            set: { if !$0 { errorMessage = nil } }
        )) {
            Button("OK") { errorMessage = nil }
        } message: {
            Text(errorMessage ?? "")
        }
    }

    // MARK: - Layout

    private func content(_ trip: Itinerary) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                TripHeader(trip: trip, isOwner: isOwner(trip)) { showingInvite = true }

                VStack(alignment: .leading, spacing: 20) {
                    if store.generating.contains(trip.id) {
                        generatingCard
                    } else if trip.plan.isEmpty {
                        emptyPlanCard(trip)
                    } else {
                        Picker("View", selection: $mode) {
                            ForEach(Mode.allCases, id: \.self) { Text($0.rawValue) }
                        }
                        .pickerStyle(.segmented)

                        dayPicker(trip)

                        dayHeading(trip)

                        if trip.dayNumber() == selectedDay && LiveActivityManager.isSupported {
                            liveActivityCard(trip)
                        }

                        switch mode {
                        case .plan: dayPlan(trip)
                        case .map: DayMapView(trip: trip, day: selectedDay)
                        }
                    }

                    if !trip.flights.isEmpty {
                        FlightsSection(flights: trip.flights)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 16)
                .padding(.bottom, 32)
            }
        }
        .background(Color(.systemGroupedBackground))
        .toolbarBackground(.hidden, for: .navigationBar)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .refreshable { await store.refreshTrip(id: trip.id) }
        .toolbar { toolbarMenu(trip) }
        .sheet(isPresented: $showingInvite) { InviteView(trip: trip) }
        .confirmationDialog("Delete \(trip.title)?", isPresented: $confirmingDelete, titleVisibility: .visible) {
            Button("Delete trip", role: .destructive) { delete(trip) }
        } message: {
            Text("This removes it for everyone you've shared it with.")
        }
        .confirmationDialog("Make a new plan?", isPresented: $confirmingRegenerate, titleVisibility: .visible) {
            Button("Replace plan", role: .destructive) { generate(trip) }
        } message: {
            Text("WhereTwo will plan every day again. Your current plan and check-offs will be replaced for everyone on this trip.")
        }
        .onAppear {
            guard !didPickInitialDay else { return }
            didPickInitialDay = true
            selectedDay = trip.dayNumber() ?? 1
            liveActivityRunning = LiveActivityManager.isRunning(tripId: trip.id, day: selectedDay)
        }
        .onChange(of: selectedDay) { _, day in
            liveActivityRunning = LiveActivityManager.isRunning(tripId: trip.id, day: day)
        }
    }

    @ToolbarContentBuilder
    private func toolbarMenu(_ trip: Itinerary) -> some ToolbarContent {
        ToolbarItem(placement: .topBarTrailing) {
            Menu {
                if isOwner(trip) {
                    Button { showingInvite = true } label: { Label("Invite someone", systemImage: "person.badge.plus") }
                }
                if !trip.plan.isEmpty {
                    Button { confirmingRegenerate = true } label: { Label("New AI plan", systemImage: "sparkles") }
                        .disabled(store.generating.contains(trip.id))
                }
                ShareLink(item: shareText(trip)) { Label("Share itinerary", systemImage: "square.and.arrow.up") }
                if isOwner(trip) {
                    Divider()
                    Button(role: .destructive) { confirmingDelete = true } label: { Label("Delete trip", systemImage: "trash") }
                }
            } label: {
                Image(systemName: "ellipsis.circle")
            }
        }
    }

    // MARK: - Pieces

    /// Day tiles, matching the web trip page: big day number, weekday and date, a dot for today.
    private func dayPicker(_ trip: Itinerary) -> some View {
        ScrollViewReader { proxy in
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(trip.plan.map(\.day), id: \.self) { day in
                        let selected = day == selectedDay
                        Button {
                            withAnimation(.snappy) { selectedDay = day }
                        } label: {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("\(day)")
                                    .font(Theme.display(26))
                                Text(date(of: day, in: trip)?.formatted(.dateTime.weekday(.abbreviated).day()) ?? "Day \(day)")
                                    .font(.caption)
                                    .foregroundStyle(selected ? Color.white.opacity(0.75) : Theme.slate)
                            }
                            .frame(width: 62, alignment: .leading)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 10)
                            .foregroundStyle(selected ? Color.white : Theme.ink)
                            .background(selected ? Theme.ink : Color(.secondarySystemGroupedBackground),
                                        in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                            .overlay {
                                if !selected {
                                    RoundedRectangle(cornerRadius: 16, style: .continuous).strokeBorder(Theme.mist)
                                }
                            }
                            .overlay(alignment: .topTrailing) {
                                if trip.dayNumber() == day {
                                    Circle().fill(Theme.today).frame(width: 8, height: 8).padding(10)
                                }
                            }
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel(dayAccessibilityLabel(day, in: trip))
                        .accessibilityAddTraits(selected ? .isSelected : [])
                        .id(day)
                    }
                }
                .padding(.vertical, 1)
            }
            .sensoryFeedback(.selection, trigger: selectedDay)
            .onAppear { proxy.scrollTo(selectedDay, anchor: .center) }
            .onChange(of: selectedDay) { _, day in withAnimation { proxy.scrollTo(day, anchor: .center) } }
        }
    }

    private func dayHeading(_ trip: Itinerary) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(date(of: selectedDay, in: trip)?.formatted(.dateTime.weekday(.wide).month(.wide).day()) ?? "Day \(selectedDay)")
                .font(Theme.display(28))
                .foregroundStyle(Theme.ink)
            HStack(spacing: 10) {
                if trip.dayNumber() == selectedDay {
                    Text("Today")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Color(red: 0x8A / 255, green: 0x53 / 255, blue: 0))
                        .padding(.horizontal, 10)
                        .padding(.vertical, 3)
                        .background(Color(red: 0xFD / 255, green: 0xF0 / 255, blue: 0xD9 / 255), in: Capsule())
                }
                Text("Day \(selectedDay) of \(trip.plan.count)")
                    .font(.subheadline)
                    .foregroundStyle(Theme.slate)
            }
        }
        .padding(.top, 4)
    }

    @ViewBuilder
    private func dayPlan(_ trip: Itinerary) -> some View {
        if let plan = trip.plan(forDay: selectedDay), !plan.activities.isEmpty {
            VStack(spacing: 0) {
                ForEach(Array(plan.activities.enumerated()), id: \.offset) { index, item in
                    PlanItemRow(
                        item: item,
                        place: trip.location,
                        neighborhood: trip.base,
                        number: index + 1,
                        isDone: store.isCompleted(trip: trip.id, day: selectedDay, index: index),
                        showSlot: index == 0 || plan.activities[index - 1].timeSlot != item.timeSlot,
                        isLast: index == plan.activities.count - 1
                    ) {
                        store.toggleCompleted(trip: trip, day: selectedDay, index: index)
                    }
                }
            }
        } else {
            Text("Nothing planned for this day. Keep it free to wander, or add stops on the web.")
                .font(.callout)
                .foregroundStyle(Theme.slate)
        }
    }

    private func dayAccessibilityLabel(_ day: Int, in trip: Itinerary) -> String {
        var label = "Day \(day)"
        if let date = date(of: day, in: trip) { label += ", " + date.formatted(.dateTime.weekday(.wide).month(.wide).day()) }
        if trip.dayNumber() == day { label += ", today" }
        return label
    }

    private func liveActivityCard(_ trip: Itinerary) -> some View {
        HStack(spacing: 12) {
            Image(systemName: "lock.iphone")
                .font(.title2)
                .foregroundStyle(Theme.blue)
            VStack(alignment: .leading, spacing: 2) {
                Text(liveActivityRunning ? "On your Lock Screen" : "Today on your Lock Screen")
                    .font(.subheadline.bold())
                Text(liveActivityRunning ? "Check things off here and it updates." : "Follow today's plan without opening the app.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Button(liveActivityRunning ? "Stop" : "Start") {
                Task {
                    if liveActivityRunning {
                        await LiveActivityManager.end(tripId: trip.id)
                        liveActivityRunning = false
                    } else {
                        do {
                            try await LiveActivityManager.start(trip: trip, day: selectedDay, store: store)
                            liveActivityRunning = true
                        } catch {
                            errorMessage = "Couldn't start the Live Activity. Check that Live Activities are on in Settings → WhereTwo."
                        }
                    }
                }
            }
            .buttonStyle(.bordered)
            .tint(liveActivityRunning ? Color.secondary : Theme.blue)
        }
        .padding(14)
        .background(Color(.secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    private var generatingCard: some View {
        VStack(spacing: 14) {
            ProgressView().controlSize(.large)
            Text("Planning your trip…").font(.headline)
            Text("Picking places near your stay and arranging each day. This takes about half a minute.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
        .padding(.horizontal, 20)
        .background(Color(.secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 20, style: .continuous))
    }

    private func emptyPlanCard(_ trip: Itinerary) -> some View {
        VStack(spacing: 14) {
            Image(systemName: "sparkles").font(.largeTitle).foregroundStyle(Theme.blue)
            Text("No plan yet").font(.headline)
            Text("Let WhereTwo build a day-by-day plan for \(trip.place).")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            Button("Plan my trip") { generate(trip) }
                .buttonStyle(.borderedProminent)
                .disabled(store.isOffline)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 36)
        .padding(.horizontal, 20)
        .background(Color(.secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 20, style: .continuous))
    }

    // MARK: - Actions & helpers

    private func isOwner(_ trip: Itinerary) -> Bool {
        if case let .signedIn(userId) = auth.state { return userId == trip.ownerId.lowercased() }
        return false
    }

    private func date(of day: Int, in trip: Itinerary) -> Date? {
        guard let start = trip.start else { return nil }
        return Calendar.current.date(byAdding: .day, value: day - 1, to: start)
    }

    private func generate(_ trip: Itinerary) {
        Task {
            do {
                await LiveActivityManager.end(tripId: trip.id)
                liveActivityRunning = false
                try await store.generatePlan(for: trip.id)
                selectedDay = store.trip(id: trip.id)?.dayNumber() ?? 1
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }

    private func delete(_ trip: Itinerary) {
        Task {
            do {
                try await store.delete(id: trip.id)
                dismiss()
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }

    private func shareText(_ trip: Itinerary) -> String {
        var lines = ["\(trip.title) — \(trip.place)"]
        if let range = trip.dateRangeText { lines.append(range) }
        for day in trip.plan {
            lines.append("")
            var heading = "Day \(day.day)"
            if let date = date(of: day.day, in: trip) { heading += " · " + date.formatted(.dateTime.weekday(.wide).month().day()) }
            lines.append(heading)
            for item in day.activities {
                lines.append("• \(item.timeSlot.isEmpty ? "" : item.timeSlot + ": ")\(item.shortTitle)")
            }
        }
        lines.append("")
        lines.append("Planned with WhereTwo")
        return lines.joined(separator: "\n")
    }
}

// MARK: - Header

private struct TripHeader: View {
    let trip: Itinerary
    let isOwner: Bool
    let onInvite: () -> Void

    private var travelers: [String] { [trip.ownerUsername] + trip.collaborators.map(\.username) }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(trip.title)
                .font(Theme.display(34))
                .foregroundStyle(.white)
                .fixedSize(horizontal: false, vertical: true)

            VStack(alignment: .leading, spacing: 6) {
                Label(trip.place, systemImage: "mappin")
                if let range = trip.dateRangeText {
                    Label(range, systemImage: "calendar")
                }
                if !trip.base.isEmpty {
                    Label(trip.base, systemImage: "bed.double")
                }
            }
            .font(.subheadline)
            .foregroundStyle(.white.opacity(0.85))

            HStack(spacing: 10) {
                HStack(spacing: -8) {
                    ForEach(travelers, id: \.self) { avatar($0) }
                }
                Text(travelers.map { "@\($0)" }.joined(separator: ", "))
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.8))
                    .lineLimit(1)
                Spacer(minLength: 0)
                if isOwner {
                    Button(action: onInvite) {
                        Label("Invite", systemImage: "person.badge.plus")
                            .font(.subheadline.weight(.semibold))
                            .padding(.horizontal, 12)
                            .padding(.vertical, 7)
                            .background(.white.opacity(0.18), in: Capsule())
                            .overlay(Capsule().strokeBorder(.white.opacity(0.3)))
                            .foregroundStyle(.white)
                    }
                }
            }
            .padding(.top, 6)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 20)
        .padding(.top, 8)
        .padding(.bottom, 24)
        .background {
            // The destination's own photo, or the default travel photo until it's found.
            PlacePhotoBackground(location: trip.location)
                .ignoresSafeArea(edges: .top)
        }
    }

    private func avatar(_ name: String) -> some View {
        Text(String(name.prefix(1)).uppercased())
            .font(.footnote.weight(.semibold))
            .frame(width: 32, height: 32)
            .background(.white, in: Circle())
            .overlay(Circle().strokeBorder(Theme.ink.opacity(0.6), lineWidth: 2))
            .foregroundStyle(Theme.ink)
            .accessibilityLabel("@\(name)")
    }
}

// MARK: - Flights

private struct FlightsSection: View {
    let flights: [Flight]

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Flights").font(.headline)
            ForEach(flights) { flight in
                HStack(spacing: 14) {
                    Image(systemName: "airplane")
                        .foregroundStyle(Theme.blue)
                        .frame(width: 28)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("\(flight.from.uppercased()) → \(flight.to.uppercased())").font(.subheadline.bold())
                        Text([flight.airline, "\(flight.iata)\(flight.flightNumber)"].filter { !$0.isEmpty }.joined(separator: " · "))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 2) {
                        if let date = Itinerary.parseDay(flight.date) {
                            Text(date.formatted(.dateTime.month(.abbreviated).day())).font(.caption.bold())
                        }
                        if !flight.departureTime.isEmpty {
                            Text(flight.arrivalTime.isEmpty ? flight.departureTime : "\(flight.departureTime)–\(flight.arrivalTime)")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                .padding(14)
                .background(Color(.secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
            }
        }
    }
}
