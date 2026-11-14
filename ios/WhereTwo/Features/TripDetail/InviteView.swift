import SwiftUI

struct InviteView: View {
    @Environment(TripStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    let trip: Itinerary

    @State private var username = ""
    @State private var isSending = false
    @State private var errorMessage: String?
    @FocusState private var focused: Bool

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    HStack {
                        Text("@").foregroundStyle(.secondary)
                        TextField("username", text: $username)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .focused($focused)
                            .submitLabel(.send)
                            .onSubmit(send)
                    }
                } header: {
                    Text("Invite to \(trip.title)")
                } footer: {
                    Text("They'll be able to see and plan this trip with you. Ask them for their WhereTwo username — it's under Account.")
                }

                if !trip.collaborators.isEmpty {
                    Section("Already on this trip") {
                        ForEach(trip.collaborators, id: \.userId) { Text("@\($0.username)") }
                    }
                }

                if let errorMessage {
                    Section { Text(errorMessage).foregroundStyle(.red) }
                }
            }
            .navigationTitle("Invite")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    if isSending {
                        ProgressView()
                    } else {
                        Button("Invite", action: send)
                            .bold()
                            .disabled(username.trimmingCharacters(in: .whitespaces).count < 3)
                    }
                }
            }
            .onAppear { focused = true }
        }
        .presentationDetents([.medium, .large])
    }

    private func send() {
        guard !isSending, username.trimmingCharacters(in: .whitespaces).count >= 3 else { return }
        isSending = true
        errorMessage = nil
        Task {
            do {
                try await store.invite(username: username, to: trip.id)
                dismiss()
            } catch {
                errorMessage = error.localizedDescription
                isSending = false
            }
        }
    }
}
