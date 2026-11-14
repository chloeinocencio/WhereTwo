import MapKit
import SwiftUI

/// Pins for one day's stops, numbered in plan order. Coordinates come from PlaceResolver,
/// which caches them so the pins (not the map tiles) still appear offline.
struct DayMapView: View {
    @Environment(TripStore.self) private var store
    let trip: Itinerary
    let day: Int

    private struct Pin: Identifiable {
        let id: Int
        let title: String
        let coordinate: CLLocationCoordinate2D
    }

    @State private var pins: [Pin] = []
    @State private var position: MapCameraPosition = .automatic
    @State private var isLoading = true

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Map(position: $position) {
                ForEach(pins) { pin in
                    Annotation(pin.title, coordinate: pin.coordinate) {
                        Text("\(pin.id + 1)")
                            .font(.caption.bold())
                            .foregroundStyle(.white)
                            .frame(width: 28, height: 28)
                            .background(isDone(pin.id) ? Color.gray : Theme.blue, in: Circle())
                            .overlay(Circle().strokeBorder(.white, lineWidth: 2))
                            .shadow(radius: 2)
                    }
                }
                if pins.count > 1 {
                    MapPolyline(coordinates: pins.map(\.coordinate))
                        .stroke(Theme.blue.opacity(0.6), style: StrokeStyle(lineWidth: 3, dash: [6, 6]))
                }
            }
            .mapControls { MapCompass() }
            .frame(height: 420)
            .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
            .overlay {
                if isLoading { ProgressView() }
            }

            if !isLoading {
                let total = trip.plan(forDay: day)?.activities.count ?? 0
                if total > pins.count {
                    Text(pins.isEmpty
                         ? "Couldn't place today's stops on the map. Open this day once with a connection to load them."
                         : "\(total - pins.count) stop\(total - pins.count == 1 ? "" : "s") couldn't be found on the map.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .task(id: "\(trip.id)-\(day)-\(trip.updatedAt ?? "")") { await loadPins() }
    }

    private func isDone(_ index: Int) -> Bool {
        store.isCompleted(trip: trip.id, day: day, index: index)
    }

    private func loadPins() async {
        isLoading = true
        var found: [Pin] = []
        for (index, item) in (trip.plan(forDay: day)?.activities ?? []).enumerated() {
            if let coordinate = await PlaceResolver.shared.coordinate(for: item, in: trip) {
                found.append(Pin(id: index, title: item.shortTitle, coordinate: coordinate))
            }
        }
        pins = found
        position = .automatic
        isLoading = false
    }
}
