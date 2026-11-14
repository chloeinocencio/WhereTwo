import SwiftUI

/// The trips list, matching the web app: a photo header with a greeting, the trip that's
/// happening now (or next) shown large, then a card per trip in its destination's colors
/// with a row of icons previewing the plan.
struct TripListView: View {
    @Environment(TripStore.self) private var store
    @Environment(AuthModel.self) private var auth
    @State private var showingNewTrip = false
    @State private var showingSettings = false
    @State private var createdTripId: String?

    private var featured: Itinerary? {
        store.currentAndUpcoming.first { $0.dayNumber() != nil || ($0.daysUntilStart() ?? 0) > 0 }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                header

                LazyVStack(alignment: .leading, spacing: 18) {
                    if store.isOffline {
                        Label("Offline. Showing your saved trips.", systemImage: "wifi.slash")
                            .font(.footnote.weight(.medium))
                            .foregroundStyle(Theme.slate)
                    }

                    if store.trips.isEmpty {
                        emptyState
                    } else {
                        if let featured {
                            NavigationLink(value: featured.id) { FeaturedTripCard(trip: featured) }
                                .buttonStyle(.plain)
                        }

                        let others = store.currentAndUpcoming.filter { $0.id != featured?.id }
                        if !others.isEmpty {
                            if featured != nil { sectionTitle("More trips") }
                            ForEach(others) { trip in
                                NavigationLink(value: trip.id) { TripCard(trip: trip) }
                                    .buttonStyle(.plain)
                            }
                        }

                        if !store.past.isEmpty {
                            sectionTitle("Past trips")
                            ForEach(store.past) { trip in
                                NavigationLink(value: trip.id) { TripCard(trip: trip) }
                                    .buttonStyle(.plain)
                            }
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 20)
                .padding(.bottom, 32)
            }
        }
        .background(Color(.systemGroupedBackground))
        .refreshable { await store.refresh() }
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                Button { showingSettings = true } label: { Image(systemName: "person.crop.circle") }
                    .accessibilityLabel("Account")
            }
            ToolbarItem(placement: .topBarTrailing) {
                Button { showingNewTrip = true } label: { Image(systemName: "plus") }
                    .accessibilityLabel("New trip")
            }
        }
        .toolbarBackground(.hidden, for: .navigationBar)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .overlay {
            if store.isRefreshing && store.trips.isEmpty { ProgressView() }
        }
        .sheet(isPresented: $showingNewTrip) {
            NewTripView { trip in createdTripId = trip.id }
        }
        .sheet(isPresented: $showingSettings) { SettingsView() }
        .navigationDestination(item: $createdTripId) { id in TripDetailView(tripId: id) }
    }

    // MARK: Header

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(greeting)
                .font(Theme.display(34))
                .foregroundStyle(.white)
                .fixedSize(horizontal: false, vertical: true)
            if !store.trips.isEmpty {
                Text(summary)
                    .font(.callout)
                    .foregroundStyle(.white.opacity(0.8))
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 20)
        .padding(.top, 24)
        .padding(.bottom, 26)
        .background {
            ZStack {
                Image("AuthBackground").resizable().scaledToFill()
                LinearGradient(colors: [Theme.ink.opacity(0.2), Theme.ink.opacity(0.5), Theme.ink.opacity(0.9)],
                               startPoint: .top, endPoint: .bottom)
            }
            .ignoresSafeArea(edges: .top)
            .clipped()
        }
    }

    private var greeting: String {
        if let name = auth.username { return "Where to next, \(name)?" }
        return "Where to next?"
    }

    private var summary: String {
        let underway = store.trips.filter { $0.dayNumber() != nil }.count
        let upcoming = store.trips.filter { ($0.daysUntilStart() ?? 0) > 0 }.count
        let parts = [
            underway > 0 ? "\(underway) trip\(underway == 1 ? "" : "s") happening now" : nil,
            upcoming > 0 ? "\(upcoming) coming up" : nil,
        ].compactMap { $0 }
        return parts.isEmpty ? "All your trips are behind you. Time to plan another." : parts.joined(separator: " and ")
    }

    private func sectionTitle(_ text: String) -> some View {
        Text(text)
            .font(Theme.display(19, .semibold))
            .foregroundStyle(Theme.ink)
            .padding(.top, 8)
    }

    @ViewBuilder
    private var emptyState: some View {
        if !store.isRefreshing {
            VStack(spacing: 12) {
                Text("No trips yet")
                    .font(Theme.display(24))
                    .foregroundStyle(Theme.ink)
                Text("Pick a city and your dates, and WhereTwo plans each day around where you're staying.")
                    .multilineTextAlignment(.center)
                    .foregroundStyle(Theme.slate)
                Button("Plan a trip") { showingNewTrip = true }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                    .padding(.top, 6)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 48)
            .padding(.horizontal, 24)
            .overlay(RoundedRectangle(cornerRadius: 28, style: .continuous)
                .strokeBorder(Theme.mist, style: StrokeStyle(lineWidth: 2, dash: [8, 6])))
        }
    }
}

// MARK: - Shared pieces

private enum TripStatus {
    case underway(day: Int, of: Int)
    case upcoming(daysAway: Int)
    case past
    case undated

    init(_ trip: Itinerary) {
        if let day = trip.dayNumber() {
            self = .underway(day: day, of: trip.days)
        } else if let away = trip.daysUntilStart(), away > 0 {
            self = .upcoming(daysAway: away)
        } else if trip.isPast {
            self = .past
        } else {
            self = .undated
        }
    }

    var text: String {
        switch self {
        case let .underway(day, of): return "Day \(day) of \(of)"
        case let .upcoming(away): return away == 1 ? "Tomorrow" : "In \(away) days"
        case .past: return "Past trip"
        case .undated: return "Dates not set"
        }
    }

    var isUnderway: Bool { if case .underway = self { return true } else { return false } }
}

private struct StatusChip: View {
    let status: TripStatus

    var body: some View {
        HStack(spacing: 5) {
            if status.isUnderway {
                Circle().fill(Color(hex: 0x3A2300)).frame(width: 5, height: 5)
            }
            Text(status.text)
        }
        .font(.caption.weight(.semibold))
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .foregroundStyle(status.isUnderway ? Color(hex: 0x3A2300) : .white)
        .background(status.isUnderway ? AnyShapeStyle(Theme.today) : AnyShapeStyle(Color.white.opacity(0.2)), in: Capsule())
    }
}

private struct Avatars: View {
    let trip: Itinerary
    var fill: Color = .white
    var ring: Color = .white

    var body: some View {
        HStack(spacing: -8) {
            ForEach(([trip.ownerUsername] + trip.collaborators.map(\.username)).prefix(4), id: \.self) { name in
                Text(String(name.prefix(1)).uppercased())
                    .font(.caption.weight(.semibold))
                    .frame(width: 28, height: 28)
                    .background(fill, in: Circle())
                    .overlay(Circle().strokeBorder(ring, lineWidth: 2))
                    .foregroundStyle(Theme.ink)
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(([trip.ownerUsername] + trip.collaborators.map(\.username)).map { "@\($0)" }.joined(separator: ", "))
    }
}

/// A line naming the first stops, so each card hints at what the plan holds.
private struct PlanPreview: View {
    let trip: Itinerary

    var body: some View {
        let stops = trip.plan.flatMap(\.activities)
        if stops.isEmpty {
            Text("No plan yet. Open the trip to make one.")
                .font(.subheadline)
                .foregroundStyle(Theme.slate)
        } else {
            let names = stops.prefix(2).map(\.shortTitle).joined(separator: ", ")
            let more = stops.count - min(stops.count, 2)
            (Text(names).fontWeight(.medium).foregroundStyle(Theme.ink)
                + Text(more > 0 ? " and \(more) more stop\(more == 1 ? "" : "s")" : ""))
                .font(.subheadline)
                .foregroundStyle(Theme.slate)
        }
    }
}

private func placeParts(_ trip: Itinerary) -> (city: String, region: String) {
    let parts = trip.place.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }
    return (parts.first ?? trip.place, parts.dropFirst().joined(separator: ", "))
}

// MARK: - Featured trip

private struct FeaturedTripCard: View {
    @Environment(TripStore.self) private var store
    let trip: Itinerary

    var body: some View {
        let status = TripStatus(trip)
        let place = placeParts(trip)

        VStack(alignment: .leading, spacing: 0) {
            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    StatusChip(status: status)
                    Spacer()
                    Avatars(trip: trip, ring: .white.opacity(0.5))
                }
                Spacer(minLength: 28)
                if case let .upcoming(away) = status {
                    HStack(alignment: .firstTextBaseline, spacing: 6) {
                        Text("\(away)")
                            .font(Theme.display(64, .heavy))
                        Text(away == 1 ? "day to go" : "days to go")
                            .font(.headline)
                            .foregroundStyle(.white.opacity(0.8))
                    }
                }
                Text(place.city)
                    .font(Theme.display(40))
                if !place.region.isEmpty {
                    Text(place.region)
                        .font(.subheadline)
                        .foregroundStyle(.white.opacity(0.8))
                        .padding(.top, 2)
                }
            }
            .foregroundStyle(.white)
            .padding(20)
            .frame(maxWidth: .infinity, minHeight: 230, alignment: .leading)
            .background { PlacePhotoBackground(location: trip.location) }

            VStack(alignment: .leading, spacing: 14) {
                VStack(alignment: .leading, spacing: 3) {
                    Text(trip.title)
                        .font(Theme.display(19, .semibold))
                        .foregroundStyle(Theme.ink)
                    Text([trip.dateRangeText, trip.base.isEmpty ? nil : "staying in \(trip.base)"]
                        .compactMap { $0 }.joined(separator: ", "))
                        .font(.subheadline)
                        .foregroundStyle(Theme.slate)
                }

                if case let .underway(day, _) = status, let plan = trip.plan(forDay: day), !plan.activities.isEmpty {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Today").font(.subheadline.weight(.semibold)).foregroundStyle(Theme.ink)
                        ForEach(Array(plan.activities.prefix(3).enumerated()), id: \.offset) { index, stop in
                            HStack(alignment: .firstTextBaseline, spacing: 12) {
                                Text(stop.timeSlot)
                                    .font(.subheadline)
                                    .foregroundStyle(Theme.slate)
                                    .frame(width: 84, alignment: .leading)
                                Text(stop.shortTitle)
                                    .font(.callout.weight(.medium))
                                    .foregroundStyle(Theme.ink)
                                    .strikethrough(store.isCompleted(trip: trip.id, day: day, index: index), color: Theme.slate)
                                    .lineLimit(1)
                            }
                        }
                    }
                } else {
                    PlanPreview(trip: trip)
                }
            }
            .padding(20)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(.secondarySystemGroupedBackground))
        }
        .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
        .shadow(color: Theme.ink.opacity(0.18), radius: 18, y: 10)
        .contentShape(Rectangle())
    }
}

// MARK: - Trip card

private struct TripCard: View {
    let trip: Itinerary

    var body: some View {
        let status = TripStatus(trip)
        let place = placeParts(trip)

        VStack(alignment: .leading, spacing: 0) {
            VStack(alignment: .leading, spacing: 0) {
                StatusChip(status: status)
                Spacer(minLength: 16)
                Text(place.city)
                    .font(Theme.display(28))
                    .lineLimit(1)
                if !place.region.isEmpty {
                    Text(place.region)
                        .font(.subheadline)
                        .foregroundStyle(.white.opacity(0.8))
                        .lineLimit(1)
                }
            }
            .foregroundStyle(.white)
            .padding(18)
            .padding(.bottom, 8)
            .frame(maxWidth: .infinity, minHeight: 150, alignment: .leading)
            .background { PlacePhotoBackground(location: trip.location, muted: trip.isPast) }

            VStack(alignment: .leading, spacing: 14) {
                HStack(alignment: .center) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(trip.title).font(.headline).foregroundStyle(Theme.ink).lineLimit(1)
                        Text(trip.dateRangeText ?? "\(trip.days) day\(trip.days == 1 ? "" : "s")")
                            .font(.subheadline)
                            .foregroundStyle(Theme.slate)
                    }
                    Spacer()
                    Avatars(trip: trip, fill: Color(hex: 0xE6ECF8), ring: Color(.secondarySystemGroupedBackground))
                }
                PlanPreview(trip: trip)
            }
            .padding(18)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(.secondarySystemGroupedBackground))
        }
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 24, style: .continuous).strokeBorder(Theme.mist))
        .contentShape(Rectangle())
    }
}
