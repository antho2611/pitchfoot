import SwiftUI

/// Mêmes 5 sections que la barre du site web (src/components/layout/Shell.tsx).
/// Sur iOS 26+, TabView applique automatiquement le vrai matériau Liquid Glass — rien à coder.
struct MainTabView: View {
    var body: some View {
        TabView {
            NavigationStack { PlayersListView() }
                .tabItem { Label("Joueurs", systemImage: "person.2.fill") }

            ComingSoonView(title: "Annonces")
                .tabItem { Label("Annonces", systemImage: "megaphone.fill") }

            ComingSoonView(title: "Clubs")
                .tabItem { Label("Clubs", systemImage: "shield.fill") }

            ComingSoonView(title: "Séances")
                .tabItem { Label("Séances", systemImage: "dumbbell.fill") }

            MenuView()
                .tabItem { Label("Menu", systemImage: "ellipsis.circle.fill") }
        }
        .tint(Color.pitchGreen)
    }
}

struct ComingSoonView: View {
    let title: String

    var body: some View {
        NavigationStack {
            VStack(spacing: 8) {
                Image(systemName: "hourglass")
                    .font(.largeTitle)
                    .foregroundStyle(.secondary)
                Text("Bientôt disponible")
                    .font(.headline)
                    .foregroundStyle(.secondary)
            }
            .navigationTitle(title)
        }
    }
}

struct MenuView: View {
    @EnvironmentObject private var session: SessionStore

    var body: some View {
        NavigationStack {
            List {
                Button(role: .destructive) {
                    Task { await session.signOut() }
                } label: {
                    Text("Se déconnecter")
                }
            }
            .navigationTitle("Menu")
        }
    }
}
