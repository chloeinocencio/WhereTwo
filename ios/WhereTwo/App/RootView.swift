import SwiftUI

struct RootView: View {
    @Environment(AuthModel.self) private var auth
    @Environment(TripStore.self) private var store
    @Environment(\.scenePhase) private var scenePhase
    @State private var path: [String] = []

    var body: some View {
        Group {
            switch auth.state {
            case .loading:
                Theme.navy.ignoresSafeArea()
            case .signedOut:
                AuthView()
            case .signedIn:
                NavigationStack(path: $path) {
                    TripListView()
                        .navigationDestination(for: String.self) { id in
                            TripDetailView(tripId: id)
                        }
                }
            }
        }
        .animation(.easeInOut(duration: 0.25), value: auth.state)
        .onChange(of: auth.state) { _, state in
            switch state {
            case .signedIn: Task { await store.refresh() }
            case .signedOut: path = []; store.reset()
            case .loading: break
            }
        }
        .task {
            if case .signedIn = auth.state { await store.refresh() }
        }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active, case .signedIn = auth.state {
                Task { await store.refresh() }
            }
        }
        // Widget and Live Activity taps open wheretwo://trip/<id>.
        .onOpenURL { url in
            guard url.scheme == "wheretwo", url.host == "trip",
                  let id = url.pathComponents.dropFirst().first else { return }
            path = [id]
        }
    }
}
