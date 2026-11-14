import SwiftUI

struct TripListView: View {
    @Environment(TripStore.self) private var store
    @State private var showingNewTrip = false
    @State private var showingSettings = false
    @State private var createdTripId: String?

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 16) {
                if store.isOffline {
                    Label("Offline — showing your saved trips", systemImage: "wifi.slash")
                        .font(.footnote.weight(.medium))
                        .foregroundStyle(.secondary)
                        .padding(.horizontal, 4)
                }

                if store.trips.isEmpty {
                    emptyState
                } else {
                    ForEach(store.currentAndUpcoming) { trip in
                        NavigationLink(value: trip.id) { TripCard(trip: trip) }
                            .buttonStyle(.plain)
                    }
                    if !store.past.isEmpty {
                        Text("Past trips")
                            .font(.headline)
                            .foregroundStyle(.secondary)
                            .padding(.top, 8)
                        ForEach(store.past) { trip in
                            NavigationLink(value: trip.id) { TripCard(trip: trip) }
                                .buttonStyle(.plain)
                        }
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 32)
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Your trips")
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
        .overlay {
            if store.isRefreshing && store.trips.isEmpty { ProgressView() }
        }
        .sheet(isPresented: $showingNewTrip) {
            NewTripView { trip in createdTripId = trip.id }
        }
        .sheet(isPresented: $showingSettings) { SettingsView() }
        .navigationDestination(item: $createdTripId) { id in TripDetailView(tripId: id) }
    }

    @ViewBuilder
    private var emptyState: some View {
        if !store.isRefreshing {
            VStack(spacing: 14) {
                Image(systemName: "airplane.departure")
                    .font(.system(size: 44))
                    .foregroundStyle(Theme.blue)
                Text("No trips yet").font(.title3.bold())
                Text("Tell WhereTwo where you're going and it'll plan each day around what you love.")
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.secondary)
                Button("Plan a trip") { showingNewTrip = true }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                    .padding(.top, 4)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 60)
            .padding(.horizontal, 24)
        }
    }
}

private struct TripCard: View {
    @Environment(TripStore.self) private var store
    let trip: Itinerary

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(trip.title)
                        .font(.title3.bold())
                        .foregroundStyle(.white)
                        .lineLimit(2)
                    Label(trip.place, systemImage: "mappin")
                        .font(.subheadline)
                        .foregroundStyle(.white.opacity(0.85))
                }
                Spacer()
                statusBadge
            }
            HStack(spacing: 14) {
                if let range = trip.dateRangeText {
                    Label(range, systemImage: "calendar")
                }
                Label("\(trip.days) day\(trip.days == 1 ? "" : "s")", systemImage: "sun.max")
                if !trip.collaborators.isEmpty {
                    Label("\(trip.collaborators.count + 1)", systemImage: "person.2")
                }
            }
            .font(.caption.weight(.medium))
            .foregroundStyle(.white.opacity(0.8))
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(trip.isPast ? AnyShapeStyle(Color.gray.gradient) : AnyShapeStyle(Theme.headerGradient),
                    in: RoundedRectangle(cornerRadius: 20, style: .continuous))
        .opacity(trip.isPast ? 0.8 : 1)
        .contentShape(Rectangle())
    }

    @ViewBuilder
    private var statusBadge: some View {
        if store.generating.contains(trip.id) {
            ProgressView().tint(.white)
        } else if let day = trip.dayNumber() {
            badge("Day \(day)")
        } else if let away = trip.daysUntilStart(), away > 0, away <= 60 {
            badge(away == 1 ? "Tomorrow" : "In \(away) days")
        } else if trip.plan.isEmpty {
            badge("No plan yet")
        }
    }

    private func badge(_ text: String) -> some View {
        Text(text)
            .font(.caption.bold())
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(.white.opacity(0.2), in: Capsule())
            .foregroundStyle(.white)
    }
}
