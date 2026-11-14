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
            VStack(alignment: .leading, spacing: 20) {
                TripHeader(trip: trip, isOwner: isOwner(trip)) { showingInvite = true }

                if store.generating.contains(trip.id) {
                    generatingCard
                } else if trip.plan.isEmpty {
                    emptyPlanCard(trip)
                } else {
                    dayPicker(trip)
                    Picker("View", selection: $mode) {
                        ForEach(Mode.allCases, id: \.self) { Text($0.rawValue) }
                    }
                    .pickerStyle(.segmented)

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
            .padding(16)
        }
        .background(Color(.systemGroupedBackground))
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

    private func dayPicker(_ trip: Itinerary) -> some View {
        ScrollViewReader { proxy in
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(trip.plan.map(\.day), id: \.self) { day in
                        let selected = day == selectedDay
                        Button {
                            withAnimation(.snappy) { selectedDay = day }
                        } label: {
                            VStack(spacing: 2) {
                                Text("Day \(day)").font(.subheadline.bold())
                                if let date = date(of: day, in: trip) {
                                    Text(date.formatted(.dateTime.weekday(.abbreviated).day()))
                                        .font(.caption2)
                                        .opacity(0.8)
                                }
                            }
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .background(selected ? AnyShapeStyle(Theme.blue) : AnyShapeStyle(Color(.secondarySystemGroupedBackground)),
                                        in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                            .foregroundStyle(selected ? .white : .primary)
                            .overlay(alignment: .topTrailing) {
                                if trip.dayNumber() == day {
                                    Circle().fill(.orange).frame(width: 8, height: 8).offset(x: -6, y: 6)
                                }
                            }
                        }
                        .buttonStyle(.plain)
                        .id(day)
                    }
                }
            }
            .sensoryFeedback(.selection, trigger: selectedDay)
            .onAppear { proxy.scrollTo(selectedDay, anchor: .center) }
        }
    }

    @ViewBuilder
    private func dayPlan(_ trip: Itinerary) -> some View {
        if let plan = trip.plan(forDay: selectedDay), !plan.activities.isEmpty {
            VStack(spacing: 12) {
                ForEach(Array(plan.activities.enumerated()), id: \.offset) { index, item in
                    PlanItemRow(
                        item: item,
                        place: trip.place,
                        isDone: store.isCompleted(trip: trip.id, day: selectedDay, index: index)
                    ) {
                        store.toggleCompleted(trip: trip, day: selectedDay, index: index)
                    }
                }
            }
        } else {
            ContentUnavailableView("Free day", systemImage: "sun.max",
                                   description: Text("Nothing planned — wander and see what you find."))
        }
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

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(trip.title)
                .font(.largeTitle.bold())
                .foregroundStyle(.white)
            HStack(spacing: 14) {
                Label(trip.place, systemImage: "mappin")
                if !trip.base.isEmpty { Label(trip.base, systemImage: "bed.double") }
            }
            .font(.subheadline)
            .foregroundStyle(.white.opacity(0.85))
            if let range = trip.dateRangeText {
                Label(range, systemImage: "calendar")
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.85))
            }

            HStack(spacing: -8) {
                avatar(trip.ownerUsername)
                ForEach(trip.collaborators, id: \.userId) { avatar($0.username) }
                if isOwner {
                    Button(action: onInvite) {
                        Image(systemName: "plus")
                            .font(.caption.bold())
                            .frame(width: 32, height: 32)
                            .background(.white.opacity(0.2), in: Circle())
                            .overlay(Circle().strokeBorder(.white.opacity(0.6), style: StrokeStyle(lineWidth: 1.5, dash: [3])))
                            .foregroundStyle(.white)
                    }
                    .padding(.leading, 14)
                    .accessibilityLabel("Invite someone")
                }
            }
            .padding(.top, 4)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(20)
        .background(Theme.headerGradient, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
    }

    private func avatar(_ name: String) -> some View {
        Text(String(name.prefix(1)).uppercased())
            .font(.caption.bold())
            .frame(width: 32, height: 32)
            .background(Theme.sky, in: Circle())
            .overlay(Circle().strokeBorder(Theme.navy, lineWidth: 2))
            .foregroundStyle(.white)
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
