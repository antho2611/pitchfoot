import SwiftUI
import Supabase

struct AuthView: View {
    @EnvironmentObject private var session: SessionStore
    @State private var mode: Mode = .signIn
    @State private var email = ""
    @State private var password = ""
    @State private var busy = false

    enum Mode { case signIn, signUp }

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                Spacer(minLength: 40)

                HStack(spacing: 0) {
                    Text("PITCH")
                        .font(.system(size: 40, weight: .black))
                    Text("PRO")
                        .font(.system(size: 40, weight: .black))
                        .foregroundStyle(Color.pitchVolt)
                        .padding(.horizontal, 6)
                        .background(Color.pitchGreen)
                }

                Picker("Mode", selection: $mode) {
                    Text("Connexion").tag(Mode.signIn)
                    Text("Inscription").tag(Mode.signUp)
                }
                .pickerStyle(.segmented)
                .padding(.horizontal)

                VStack(spacing: 12) {
                    TextField("Email", text: $email)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .keyboardType(.emailAddress)
                        .textFieldStyle(.roundedBorder)

                    SecureField("Mot de passe", text: $password)
                        .textFieldStyle(.roundedBorder)
                }
                .padding(.horizontal)

                if let error = session.errorMessage {
                    Text(error)
                        .font(.footnote)
                        .foregroundStyle(.red)
                        .padding(.horizontal)
                }

                Button {
                    Task {
                        busy = true
                        if mode == .signIn {
                            await session.signIn(email: email, password: password)
                        } else {
                            await session.signUp(email: email, password: password)
                        }
                        busy = false
                    }
                } label: {
                    if busy {
                        ProgressView()
                            .frame(maxWidth: .infinity)
                    } else {
                        Text(mode == .signIn ? "Se connecter" : "Créer mon compte")
                            .fontWeight(.bold)
                            .frame(maxWidth: .infinity)
                    }
                }
                .buttonStyle(.borderedProminent)
                .tint(Color.pitchGreen)
                .controlSize(.large)
                .padding(.horizontal)
                .disabled(email.isEmpty || password.isEmpty || busy)

                HStack {
                    VStack { Divider() }
                    Text("ou").font(.caption).foregroundStyle(.secondary)
                    VStack { Divider() }
                }
                .padding(.horizontal)

                VStack(spacing: 10) {
                    Button {
                        Task { await session.signInWithOAuth(.google) }
                    } label: {
                        Text("Continuer avec Google")
                            .fontWeight(.semibold)
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.large)

                    Button {
                        Task { await session.signInWithOAuth(.apple) }
                    } label: {
                        Text("Continuer avec Apple")
                            .fontWeight(.semibold)
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.large)
                }
                .padding(.horizontal)

                Spacer()
            }
        }
    }
}
