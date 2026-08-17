import SwiftUI

/// Mêmes 5 sections que la barre du site web (src/components/layout/Shell.tsx).
/// Sur iOS 26+, TabView applique automatiquement le vrai matériau Liquid Glass — rien à coder.
struct MainTabView: View {
    var body: some View {
        TabView {
            NavigationStack { PlayersListView() }
                .tabItem { Label("Joueurs", systemImage: "person.2.fill") }

            NavigationStack { AnnoncesListView() }
                .tabItem { Label("Annonces", systemImage: "megaphone.fill") }

            NavigationStack { ClubsListView() }
                .tabItem { Label("Clubs", systemImage: "shield.fill") }

            NavigationStack { SeancesListView() }
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

struct MenuView: View {
    @EnvironmentObject private var session: SessionStore

    var body: some View {
        NavigationStack {
            List {
                Section {
                    NavigationLink("Préparateurs") { PreparateursListView() }
                    NavigationLink("Ebooks") { ComingSoonView(title: "Ebooks") }
                    NavigationLink("Premium") { ComingSoonView(title: "Premium") }
                }
                Section {
                    NavigationLink("Tableau de bord") { ComingSoonView(title: "Tableau de bord") }
                    NavigationLink("Messagerie") { ComingSoonView(title: "Messagerie") }
                    NavigationLink("Notifications") { ComingSoonView(title: "Notifications") }
                }
                Section {
                    Button(role: .destructive) {
                        Task { await session.signOut() }
                    } label: {
                        Text("Se déconnecter")
                    }
                }
            }
            .navigationTitle("Menu")
        }
    }
}
