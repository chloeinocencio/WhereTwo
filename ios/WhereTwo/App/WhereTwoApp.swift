import SwiftUI

@main
struct WhereTwoApp: App {
    @State private var auth: AuthModel
    @State private var store: TripStore

    init() {
        let auth = AuthModel()
        _auth = State(initialValue: auth)
        _store = State(initialValue: TripStore(api: auth.api))
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(auth)
                .environment(store)
                .tint(Theme.blue)
        }
    }
}
