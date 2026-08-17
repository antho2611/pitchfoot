import Foundation
import Supabase

@MainActor
final class SessionStore: ObservableObject {
    @Published var session: Session?
    @Published var isLoading = true
    @Published var errorMessage: String?

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

    func signOut() async {
        try? await supabase.auth.signOut()
        session = nil
    }
}
