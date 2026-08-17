import SwiftUI

struct PlayersListView: View {
    var body: some View {
        AsyncListView(
            title: "Joueurs",
            emptyMessage: "Aucun joueur",
            emptySymbol: "person.2",
            load: PlayersRepository.fetchAll
        ) { player in
            NavigationLink {
                PlayerDetailView(playerId: player.id)
            } label: {
                PlayerRow(player: player)
            }
            .buttonStyle(.plain)
        }
    }
}

private struct PlayerRow: View {
    let player: Player

    var body: some View {
        HStack(spacing: 12) {
            AsyncImage(url: player.photoURL.flatMap(URL.init)) { image in
                image.resizable().scaledToFill()
            } placeholder: {
                Color.secondary.opacity(0.15)
            }
            .frame(width: 52, height: 52)
            .clipShape(Circle())

            VStack(alignment: .leading, spacing: 3) {
                Text("\(player.firstName) \(player.lastName)".uppercased())
                    .font(.pitchDisplay(20))
                    .foregroundStyle(.primary)
                let subtitle = [player.mainPosition, player.currentClub].compactMap { $0 }.joined(separator: " · ")
                if !subtitle.isEmpty {
                    LabelXS(text: subtitle)
                }
            }

            Spacer()
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
    }
}
