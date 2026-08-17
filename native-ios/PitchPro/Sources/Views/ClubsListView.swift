import SwiftUI

struct ClubsListView: View {
    var body: some View {
        AsyncListView(
            title: "Clubs",
            emptyMessage: "Aucun club",
            emptySymbol: "shield",
            load: ClubsRepository.fetchAll
        ) { club in
            HStack(spacing: 12) {
                AsyncImage(url: club.logoURL.flatMap(URL.init)) { image in
                    image.resizable().scaledToFit()
                } placeholder: {
                    Color.secondary.opacity(0.2)
                }
                .frame(width: 40, height: 40)
                .clipShape(RoundedRectangle(cornerRadius: 6))

                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 4) {
                        Text(club.name).font(.headline)
                        if club.isVerified {
                            Image(systemName: "checkmark.seal.fill")
                                .font(.caption)
                                .foregroundStyle(Color.pitchGreen)
                        }
                    }
                    let subtitle = [club.city, club.championship].compactMap { $0 }.joined(separator: " · ")
                    if !subtitle.isEmpty {
                        Text(subtitle).font(.subheadline).foregroundStyle(.secondary)
                    }
                }
            }
            .padding(.vertical, 4)
        }
    }
}
