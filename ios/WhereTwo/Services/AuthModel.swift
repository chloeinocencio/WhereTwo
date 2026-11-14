import Foundation
import Observation
import Supabase

let supabase = SupabaseClient(supabaseURL: Config.supabaseURL, supabaseKey: Config.supabaseAnonKey)

@MainActor
@Observable
final class AuthModel {
    enum State: Equatable {
        case loading
        case signedOut
        case signedIn(userId: String)
    }

    private(set) var state: State = .loading
    private(set) var email: String?
    private(set) var username: String?

    let api = APIClient(accessToken: {
        // `session` refreshes an expired token before returning it.
        try await supabase.auth.session.accessToken
    })

    init() {
        // Use the stored session even if its token has expired, so trips open offline.
        // The next API call refreshes it, and a failed refresh signs the user out below.
        if let session = supabase.auth.currentSession {
            apply(session)
        } else {
            state = .signedOut
        }
        Task { await observeAuthChanges() }
    }

    private func observeAuthChanges() async {
        for await (event, session) in supabase.auth.authStateChanges {
            switch event {
            case .signedOut:
                clearUser()
            case .signedIn, .tokenRefreshed, .userUpdated:
                if let session { apply(session) }
            default:
                break
            }
        }
    }

    private func apply(_ session: Session) {
        email = session.user.email
        if case let .string(name)? = session.user.userMetadata["username"] {
            username = name
        }
        state = .signedIn(userId: session.user.id.uuidString.lowercased())
    }

    private func clearUser() {
        email = nil
        username = nil
        state = .signedOut
    }

    // MARK: Actions

    func signIn(email: String, password: String) async throws {
        let session = try await supabase.auth.signIn(email: email.trimmingCharacters(in: .whitespaces), password: password)
        apply(session)
    }

    /// Accounts are created by the edge function (it reserves the username), then we sign in.
    func signUp(email: String, password: String, username: String) async throws {
        try await api.signUp(email: email.trimmingCharacters(in: .whitespaces), password: password, username: username)
        try await signIn(email: email, password: password)
    }

    func suggestUsername() async -> String? {
        try? await api.generateUsername()
    }

    func signOut() async {
        try? await supabase.auth.signOut()
        SharedStore.clearAll()
        clearUser()
    }

    /// Deletes the account and all of its trips on the server (required by App Review 5.1.1(v)).
    func deleteAccount() async throws {
        try await api.deleteAccount()
        try? await supabase.auth.signOut(scope: .local)
        SharedStore.clearAll()
        clearUser()
    }
}
