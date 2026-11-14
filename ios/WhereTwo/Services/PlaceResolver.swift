import CoreLocation
import MapKit

/// Gemini's plans have place names and addresses but no coordinates, so map pins come from
/// Apple's local search. Results are cached in the App Group so a day's map still has its
/// pins with no signal, once that day has been opened online.
@MainActor
final class PlaceResolver {
    static let shared = PlaceResolver()

    private var cache: [String: CachedPlace] = SharedStore.loadPlaces()

    func cityCenter(for trip: Itinerary) async -> CLLocationCoordinate2D? {
        await resolve(key: "city|\(trip.place)", query: trip.place, near: nil)
    }

    func coordinate(for item: PlanItem, in trip: Itinerary) async -> CLLocationCoordinate2D? {
        let center = await cityCenter(for: trip)
        return await resolve(key: "place|\(trip.place)|\(item.title)", query: Self.query(for: item, in: trip), near: center)
    }

    /// "Ichiran Ramen (1-22-7 Jinnan, Shibuya City)" → search the address if there is one,
    /// since it's more precise than the name; always add the city to keep results local.
    private static func query(for item: PlanItem, in trip: Itinerary) -> String {
        if let open = item.title.firstIndex(of: "("), let close = item.title.lastIndex(of: ")"), open < close {
            let address = item.title[item.title.index(after: open)..<close]
            if address.rangeOfCharacter(from: .decimalDigits) != nil {
                return "\(item.shortTitle), \(address), \(trip.place)"
            }
        }
        return "\(item.shortTitle), \(trip.place)"
    }

    private func resolve(key: String, query: String, near center: CLLocationCoordinate2D?) async -> CLLocationCoordinate2D? {
        if let hit = cache[key] {
            return CLLocationCoordinate2D(latitude: hit.latitude, longitude: hit.longitude)
        }
        let request = MKLocalSearch.Request()
        request.naturalLanguageQuery = query
        if let center {
            request.region = MKCoordinateRegion(center: center, latitudinalMeters: 40_000, longitudinalMeters: 40_000)
        }
        guard let item = try? await MKLocalSearch(request: request).start().mapItems.first else { return nil }
        let coordinate = item.placemark.coordinate
        cache[key] = CachedPlace(latitude: coordinate.latitude, longitude: coordinate.longitude)
        SharedStore.savePlaces(cache)
        return coordinate
    }
}
