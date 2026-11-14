import Foundation

enum APIError: LocalizedError {
    case server(String)
    case offline
    case unauthorized
    case badResponse

    var errorDescription: String? {
        switch self {
        case .server(let message): return message
        case .offline: return "You're offline. Showing your saved trips."
        case .unauthorized: return "Your session expired. Please sign in again."
        case .badResponse: return "Something went wrong. Please try again."
        }
    }
}

/// Talks to the existing edge function (supabase/functions/server/index.tsx), the same API
/// the web app uses, so trips stay in sync between iPhone and web.
struct APIClient {
    /// Returns a fresh access token, or nil for unauthenticated routes like sign-up.
    var accessToken: @Sendable () async throws -> String

    private var decoder: JSONDecoder { JSONDecoder() }

    // MARK: Auth

    func generateUsername() async throws -> String {
        struct Response: Decodable { let username: String }
        let r: Response = try await send("generate-username", authenticated: false)
        return r.username
    }

    func signUp(email: String, password: String, username: String) async throws {
        struct Body: Encodable { let email, password, username: String }
        let _: Empty = try await send("signup", method: "POST",
                                      body: Body(email: email, password: password, username: username),
                                      authenticated: false)
    }

    func deleteAccount() async throws {
        let _: Empty = try await send("account", method: "DELETE")
    }

    // MARK: Itineraries

    func itineraries() async throws -> [Itinerary] {
        struct Response: Decodable { let itineraries: [Itinerary] }
        let r: Response = try await send("itineraries")
        return r.itineraries
    }

    func itinerary(id: String) async throws -> Itinerary {
        let r: ItineraryResponse = try await send("itineraries/\(id)")
        return r.itinerary
    }

    func createItinerary(_ draft: NewTripDraft) async throws -> Itinerary {
        let r: ItineraryResponse = try await send("itineraries", method: "POST", body: draft)
        return r.itinerary
    }

    /// Asks Gemini (server-side) for a day-by-day plan. Takes ~10–30s.
    func generatePlan(id: String) async throws -> Itinerary {
        let r: ItineraryResponse = try await send("itineraries/\(id)/generate", method: "POST", timeout: 120)
        return r.itinerary
    }

    func invite(username: String, to id: String) async throws -> Itinerary {
        struct Body: Encodable { let username: String }
        let r: ItineraryResponse = try await send("itineraries/\(id)/invite", method: "POST", body: Body(username: username))
        return r.itinerary
    }

    func deleteItinerary(id: String) async throws {
        let _: Empty = try await send("itineraries/\(id)", method: "DELETE")
    }

    // MARK: Plumbing

    private struct ItineraryResponse: Decodable { let itinerary: Itinerary }
    private struct Empty: Decodable {}

    private func send<Response: Decodable>(
        _ path: String,
        method: String = "GET",
        body: (any Encodable)? = nil,
        authenticated: Bool = true,
        timeout: TimeInterval = 30
    ) async throws -> Response {
        var request = URLRequest(url: Config.apiBase.appendingPathComponent(path))
        request.httpMethod = method
        request.timeoutInterval = timeout
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        // Edge functions require a bearer token on every call; the anon key covers public routes.
        let token = authenticated ? try await accessToken() : Config.supabaseAnonKey
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        if let body {
            request.httpBody = try JSONEncoder().encode(body)
        }

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await URLSession.shared.data(for: request)
        } catch let error as URLError where Self.offlineCodes.contains(error.code) {
            throw APIError.offline
        }

        guard let http = response as? HTTPURLResponse else { throw APIError.badResponse }
        guard (200..<300).contains(http.statusCode) else {
            if http.statusCode == 401 { throw APIError.unauthorized }
            struct ServerError: Decodable { let error: String }
            if let message = try? decoder.decode(ServerError.self, from: data).error {
                throw APIError.server(message)
            }
            throw APIError.badResponse
        }
        do {
            return try decoder.decode(Response.self, from: data)
        } catch {
            throw APIError.badResponse
        }
    }

    private static let offlineCodes: Set<URLError.Code> = [
        .notConnectedToInternet, .networkConnectionLost, .timedOut,
        .cannotFindHost, .cannotConnectToHost, .dataNotAllowed, .internationalRoamingOff,
    ]
}

/// What the "New trip" form sends; field names match the server's create route.
struct NewTripDraft: Encodable {
    var title: String
    var location: String
    var base: String
    var area: String = ""
    var days: Int
    var startDate: String
    var endDate: String
    var interests: [String]
    var travelStyle: String
    var pace: String
}
