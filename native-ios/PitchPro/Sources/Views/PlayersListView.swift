import SwiftUI

struct PlayersListView: View {
    @State private var players: [Player] = []
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        Group {
            if isLoading {
                ProgressView()
            } else if let errorMessage {
                ContentUnavailableView(errorMessage, systemImage: "exclamationmark.triangle")
            } else if players.isEmpty {
                ContentUnavailableView("Aucun joueur", systemImage: "person.2")
            } else {
                List(players) { player in
                    PlayerRow(player: player)
                }
                .listStyle(.plain)
            }
        }
        .navigationTitle("Joueurs")
        .task { await load() }
        .refreshable { await load() }
    }

    private func load() async {
        isLoading = true
        errorMessage = nil
        do {
            players = try await PlayersRepository.fetchAll()
        } catch {
            errorMessage = "Impossible de charger les joueurs."
        }
        isLoading = false
    }
}

private struct PlayerRow: View {
    let player: Player

    var body: some View {
        HStack(spacing: 12) {
            AsyncImage(url: player.photoURL.flatMap(URL.init)) { image in
                image.resizable().scaledToFill()
            } placeholder: {
                Color.secondary.opacity(0.2)
            }
            .frame(width: 48, height: 48)
            .clipShape(Circle())

            VStack(alignment: .leading, spacing: 2) {
                Text("\(player.firstName) \(player.lastName)")
                    .font(.headline)
                let subtitle = [player.mainPosition, player.currentClub]
                    .compactMap { $0 }
                    .joined(separator: " · ")
                if !subtitle.isEmpty {
                    Text(subtitle)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding(.vertical, 4)
    }
}
