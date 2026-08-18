import Foundation
import Supabase

@MainActor
final class SessionStore: ObservableObject {
    @Published var session: Session?
    @Published var isLoading = true
    @Published var errorMessage: String?
    @Published var resetEmailSent = false

    var isSignedIn: Bool { session != nil }

    init() {
        Task { await refresh() }
    }

    func refresh() async {
        isLoading = true
        session = try? await supabase.auth.session
        isLoading = false
    }

    func signIn(email: String, password: String) async {
        errorMessage = nil
        do {
            session = try await supabase.auth.signIn(email: email, password: password)
        } catch {
            errorMessage = "Email ou mot de passe incorrect."
        }
    }

    func signUp(email: String, password: String) async {
        errorMessage = nil
        do {
            _ = try await supabase.auth.signUp(email: email, password: password)
            errorMessage = "Compte créé — vérifiez votre email pour le confirmer."
        } catch {
            errorMessage = "Inscription impossible."
        }
    }

    /// Envoie le lien de réinitialisation vers la même page web que le site
    /// (pitchfoot.onrender.com/reset-password) — pas d'écran natif dédié,
    /// on réutilise le flow web sur le même projet Supabase.
    func resetPassword(email: String) async {
        errorMessage = nil
        resetEmailSent = false
        do {
            try await supabase.auth.resetPasswordForEmail(
                email,
                redirectTo: URL(string: "https://pitchfoot.onrender.com/reset-password")
            )
            resetEmailSent = true
        } catch {
            errorMessage = "Envoi impossible. Vérifiez l'adresse email."
        }
    }

    func signOut() async {
        try? await supabase.auth.signOut()
        session = nil
    }

    /// Ouvre le navigateur intégré (même écran Google/Apple que sur le site),
    /// puis revient dans l'app via le schéma d'URL pitchpro://login-callback.
    func signInWithOAuth(_ provider: Provider) async {
        errorMessage = nil
        do {
            session = try await supabase.auth.signInWithOAuth(
                provider: provider,
                redirectTo: URL(string: "pitchpro://login-callback")
            )
        } catch {
            errorMessage = "Connexion impossible."
        }
    }
}
