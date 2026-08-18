import SwiftUI

struct PlayersListView: View {
    @State private var draft = PlayerFilters()
    @State private var applied = PlayerFilters()

    var body: some View {
        AsyncListView(
            title: "Joueurs",
            emptyMessage: "Aucun joueur ne correspond à ces filtres",
            emptySymbol: "person.2",
            columns: 2,
            load: { try await PlayersRepository.fetchAll(filters: applied) }
        ) { player in
            NavigationLink {
                PlayerDetailView(playerId: player.id)
            } label: {
                PlayerGridCard(player: player)
            }
            .buttonStyle(.plain)
        } header: {
            PlayerFilterBar(filters: $draft) {
                applied = draft
            }
        }
        .id(applied)
    }
}

/// Carte carrée façon grille du site (src/components/PlayerCard.tsx).
private struct PlayerGridCard: View {
    let player: Player

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ZStack(alignment: .topTrailing) {
                AsyncImage(url: player.photoURL.flatMap(URL.init)) { image in
                    image.resizable().scaledToFill()
                } placeholder: {
                    Color.secondary.opacity(0.15)
                }
                .frame(height: 140)
                .clipped()

                Text(player.availabilityLabel.uppercased())
                    .font(.system(size: 8, weight: .black))
                    .padding(.horizontal, 5)
                    .padding(.vertical, 3)
                    .background(Color.pitchGreen)
                    .foregroundStyle(Color.pitchVolt)
                    .padding(4)

                if player.isPremium {
                    Text("PREMIUM")
                        .font(.system(size: 8, weight: .black))
                        .padding(.horizontal, 5)
                        .padding(.vertical, 3)
                        .background(Color.pitchVolt)
                        .foregroundStyle(Color.pitchGreen)
                        .padding(4)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            }

            VStack(alignment: .leading, spacing: 6) {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 1) {
                        Text("\(player.firstName) \(player.lastName)".uppercased())
                            .font(.pitchDisplay(16))
                            .lineLimit(1)
                        let subtitle = [player.currentClub ?? "Sans club", player.age.map { "\($0) ans" }]
                            .compactMap { $0 }
                            .joined(separator: " • ")
                        LabelXS(text: subtitle)
                    }
                    Spacer(minLength: 4)
                    if let short = player.positionShort {
                        Text(short)
                            .font(.system(size: 10, weight: .black))
                            .padding(.horizontal, 5)
                            .padding(.vertical, 3)
                            .background(Color.pitchVolt)
                            .foregroundStyle(Color.pitchGreen)
                    }
                }
            }
            .padding(10)
        }
        .background(Color.white)
        .overlay(Rectangle().strokeBorder(Color.pitchGreen.opacity(0.12), lineWidth: 1))
    }
}
