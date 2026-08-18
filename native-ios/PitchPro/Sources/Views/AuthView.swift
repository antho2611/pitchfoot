import SwiftUI
import Supabase

private let sharpFieldCls = RoundedRectangle(cornerRadius: 0)

struct AuthView: View {
    @EnvironmentObject private var session: SessionStore
    @State private var mode: Mode = .signIn
    @State private var email = ""
    @State private var password = ""
    @State private var busy = false

    enum Mode { case signIn, signUp, forgot }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    Spacer(minLength: 40)

                    HStack(spacing: 0) {
                        Text("PITCH")
                            .font(.pitchDisplay(44))
                        Text("PRO")
                            .font(.pitchDisplay(44))
                            .foregroundStyle(Color.pitchVolt)
                            .padding(.horizontal, 6)
                            .background(Color.pitchGreen)
                    }

                    if mode != .forgot {
                        HStack(spacing: 0) {
                            modeTab("Connexion", .signIn)
                            modeTab("Inscription", .signUp)
                        }
                        .overlay(Rectangle().strokeBorder(Color.pitchGreen, lineWidth: 1))
                        .padding(.horizontal)
                    }

                    if mode == .forgot {
                        forgotPasswordSection
                    } else {
                        VStack(spacing: 12) {
                            TextField("Email", text: $email)
                                .textInputAutocapitalization(.never)
                                .autocorrectionDisabled()
                                .keyboardType(.emailAddress)
                                .padding(12)
                                .overlay(sharpFieldCls.strokeBorder(Color.secondary.opacity(0.3)))

                            SecureField("Mot de passe", text: $password)
                                .padding(12)
                                .overlay(sharpFieldCls.strokeBorder(Color.secondary.opacity(0.3)))
                        }
                        .padding(.horizontal)

                        if mode == .signIn {
                            Button {
                                session.errorMessage = nil
                                session.resetEmailSent = false
                                mode = .forgot
                            } label: {
                                Text("Mot de passe oublié ?")
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundStyle(.secondary)
                            }
                            .frame(maxWidth: .infinity, alignment: .trailing)
                            .padding(.horizontal)
                        }

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
                                ProgressView().tint(Color.pitchVolt)
                            } else {
                                Text(mode == .signIn ? "Se connecter" : "Créer mon compte")
                            }
                        }
                        .buttonStyle(PitchButtonStyle())
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
                            }
                            .buttonStyle(PitchButtonStyle(filled: false))

                            Button {
                                Task { await session.signInWithOAuth(.apple) }
                            } label: {
                                Text("Continuer avec Apple")
                            }
                            .buttonStyle(PitchButtonStyle(filled: false))
                        }
                        .padding(.horizontal)
                    }

                    Spacer(minLength: 20)
                }
                .frame(maxWidth: 480)
                .frame(maxWidth: .infinity)
            }
        }
    }

    @ViewBuilder
    private var forgotPasswordSection: some View {
        VStack(spacing: 12) {
            if session.resetEmailSent {
                Text("Si un compte existe pour \(email), un lien de réinitialisation vient d'être envoyé. Ouvrez-le pour choisir un nouveau mot de passe.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            } else {
                Text("Indiquez votre email, on vous envoie un lien pour choisir un nouveau mot de passe.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                TextField("Email", text: $email)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .keyboardType(.emailAddress)
                    .padding(12)
                    .overlay(sharpFieldCls.strokeBorder(Color.secondary.opacity(0.3)))

                if let error = session.errorMessage {
                    Text(error).font(.footnote).foregroundStyle(.red)
                }

                Button {
                    Task {
                        busy = true
                        await session.resetPassword(email: email)
                        busy = false
                    }
                } label: {
                    if busy {
                        ProgressView().tint(Color.pitchVolt)
                    } else {
                        Text("Envoyer le lien")
                    }
                }
                .buttonStyle(PitchButtonStyle())
                .disabled(email.isEmpty || busy)
            }

            Button {
                session.errorMessage = nil
                session.resetEmailSent = false
                mode = .signIn
            } label: {
                Text("Retour à la connexion")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.horizontal)
    }

    private func modeTab(_ text: String, _ value: Mode) -> some View {
        Button {
            mode = value
        } label: {
            Text(text.uppercased())
                .font(.system(size: 13, weight: .bold))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
                .foregroundStyle(mode == value ? Color.pitchVolt : Color.pitchGreen)
                .background(mode == value ? Color.pitchGreen : Color.clear)
        }
        .buttonStyle(.plain)
    }
}
