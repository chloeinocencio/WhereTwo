import SwiftUI

struct AuthView: View {
    @Environment(AuthModel.self) private var auth

    private enum Mode { case signIn, signUp }
    private enum Field { case email, password, username }

    @State private var mode: Mode = .signIn
    @State private var email = ""
    @State private var password = ""
    @State private var username = ""
    @State private var isWorking = false
    @State private var errorMessage: String?
    @FocusState private var focus: Field?

    var body: some View {
        ZStack {
            background
            ScrollView {
                VStack(spacing: 28) {
                    header
                    card
                }
                .padding(.horizontal, 20)
                .padding(.top, 60)
                .padding(.bottom, 40)
            }
            .scrollDismissesKeyboard(.interactively)
        }
        .preferredColorScheme(.dark)
    }

    private var background: some View {
        ZStack {
            Image("AuthBackground")
                .resizable()
                .scaledToFill()
                .ignoresSafeArea()
            LinearGradient(colors: [.black.opacity(0.35), Theme.navy.opacity(0.9), Color.black],
                           startPoint: .top, endPoint: .bottom)
                .ignoresSafeArea()
        }
    }

    private var header: some View {
        VStack(spacing: 12) {
            Image("Wordmark")
                .resizable()
                .renderingMode(.template)
                .scaledToFit()
                .foregroundStyle(.white)
                .frame(maxWidth: 220)
                .accessibilityLabel("WhereTwo")
            Text("Let's explore the world together")
                .font(.title3)
                .foregroundStyle(.white.opacity(0.9))
            Label("AI-powered travel itineraries", systemImage: "mappin.and.ellipse")
                .font(.footnote)
                .foregroundStyle(.white.opacity(0.65))
        }
    }

    private var card: some View {
        VStack(alignment: .leading, spacing: 18) {
            VStack(alignment: .leading, spacing: 4) {
                Text(mode == .signIn ? "Welcome back" : "Create your account")
                    .font(.title.bold())
                Text(mode == .signIn ? "Sign in to continue planning" : "Plan trips with the people you travel with")
                    .foregroundStyle(.secondary)
            }

            if mode == .signUp {
                field("Username") {
                    HStack {
                        TextField("traveler123", text: $username)
                            .textContentType(.username)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .focused($focus, equals: .username)
                            .submitLabel(.next)
                            .onSubmit { focus = .email }
                        Button {
                            Task { if let name = await auth.suggestUsername() { username = name } }
                        } label: {
                            Image(systemName: "dice")
                        }
                        .accessibilityLabel("Suggest a username")
                    }
                }
            }

            field("Email") {
                TextField("you@example.com", text: $email)
                    .textContentType(.emailAddress)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .focused($focus, equals: .email)
                    .submitLabel(.next)
                    .onSubmit { focus = .password }
            }

            field("Password") {
                SecureField(mode == .signUp ? "At least 6 characters" : "Password", text: $password)
                    .textContentType(mode == .signUp ? .newPassword : .password)
                    .focused($focus, equals: .password)
                    .submitLabel(.go)
                    .onSubmit { submit() }
            }

            if let errorMessage {
                Text(errorMessage)
                    .font(.footnote)
                    .foregroundStyle(.red)
                    .transition(.opacity)
            }

            Button(action: submit) {
                Group {
                    if isWorking {
                        ProgressView().tint(Theme.navy)
                    } else {
                        Text(mode == .signIn ? "Sign In" : "Create Account")
                    }
                }
                .font(.headline)
                .foregroundStyle(Theme.navy)
                .frame(maxWidth: .infinity, minHeight: 50)
                .background(.white, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                .opacity(canSubmit ? 1 : 0.55)
            }
            .buttonStyle(.plain)
            .disabled(!canSubmit || isWorking)

            Button {
                withAnimation {
                    mode = mode == .signIn ? .signUp : .signIn
                    errorMessage = nil
                }
                if mode == .signUp, username.isEmpty {
                    Task { if let name = await auth.suggestUsername() { username = name } }
                }
            } label: {
                Text(LocalizedStringKey(mode == .signIn ? "Don't have an account? **Sign up**" : "Already have an account? **Sign in**"))
                    .font(.subheadline)
                    .frame(maxWidth: .infinity)
            }
            .foregroundStyle(.white.opacity(0.85))
        }
        .padding(24)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 24, style: .continuous).strokeBorder(.white.opacity(0.15)))
    }

    private func field<Content: View>(_ label: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label).font(.subheadline.weight(.semibold))
            content()
                .padding(.horizontal, 14)
                .frame(minHeight: 48)
                .background(.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(.white.opacity(0.15)))
        }
    }

    private var canSubmit: Bool {
        let base = email.contains("@") && password.count >= 6
        return mode == .signIn ? base : base && username.count >= 3
    }

    private func submit() {
        guard canSubmit, !isWorking else { return }
        focus = nil
        isWorking = true
        errorMessage = nil
        Task {
            defer { isWorking = false }
            do {
                if mode == .signIn {
                    try await auth.signIn(email: email, password: password)
                } else {
                    try await auth.signUp(email: email, password: password, username: username)
                }
            } catch {
                withAnimation { errorMessage = Self.friendly(error) }
            }
        }
    }

    private static func friendly(_ error: Error) -> String {
        let text = error.localizedDescription
        if text.localizedCaseInsensitiveContains("invalid login") { return "That email and password don't match." }
        if (error as? URLError) != nil { return "Can't reach WhereTwo. Check your connection." }
        return text
    }
}
