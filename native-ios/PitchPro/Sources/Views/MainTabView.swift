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
        VStack(alignment: .leading, spacing: 12) {
            Text(title.uppercased())
                .font(.pitchDisplay(40))
                .padding(.horizontal)
                .padding(.top, 8)
            VStack(spacing: 8) {
                Image(systemName: "hourglass")
                    .font(.largeTitle)
                    .foregroundStyle(.secondary)
                Text("Bientôt disponible")
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity)
            .padding(.top, 40)
            Spacer()
        }
        .navigationBarTitleDisplayMode(.inline)
    }
}

private struct MenuRow: View {
    let text: String

    var body: some View {
        Text(text.uppercased())
            .font(.pitchDisplay(20))
            .foregroundStyle(.primary)
    }
}

struct MenuView: View {
    @EnvironmentObject private var session: SessionStore

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    Text("MENU")
                        .font(.pitchDisplay(40))
                        .padding(.horizontal)
                        .padding(.top, 8)

                    VStack(spacing: 10) {
                        NavigationLink { PreparateursListView() } label: {
                            PitchCard { MenuRow(text: "Préparateurs") }
                        }
                        NavigationLink { EbooksListView() } label: {
                            PitchCard { MenuRow(text: "Ebooks") }
                        }
                        NavigationLink { ComingSoonView(title: "Premium") } label: {
                            PitchCard { MenuRow(text: "Premium") }
                        }
                        NavigationLink { ComingSoonView(title: "Tableau de bord") } label: {
                            PitchCard { MenuRow(text: "Tableau de bord") }
                        }
                        NavigationLink { ComingSoonView(title: "Messagerie") } label: {
                            PitchCard { MenuRow(text: "Messagerie") }
                        }
                        NavigationLink { ComingSoonView(title: "Notifications") } label: {
                            PitchCard { MenuRow(text: "Notifications") }
                        }
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal)

                    Button(role: .destructive) {
                        Task { await session.signOut() }
                    } label: {
                        Text("Se déconnecter")
                    }
                    .buttonStyle(PitchButtonStyle(filled: false))
                    .padding(.horizontal)
                    .padding(.top, 12)
                }
                .padding(.bottom, 24)
            }
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}
