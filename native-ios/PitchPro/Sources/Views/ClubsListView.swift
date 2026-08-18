import SwiftUI

struct ClubsListView: View {
    var body: some View {
        AsyncListView(
            title: "Clubs",
            emptyMessage: "Aucun club",
            emptySymbol: "shield",
            load: ClubsRepository.fetchAll
        ) { club in
            NavigationLink {
                ClubDetailView(clubId: club.id)
            } label: {
                HStack(spacing: 12) {
                    AsyncImage(url: club.logoURL.flatMap(URL.init)) { image in
                        image.resizable().scaledToFit()
                    } placeholder: {
                        Color.secondary.opacity(0.15)
                    }
                    .frame(width: 44, height: 44)

                    VStack(alignment: .leading, spacing: 3) {
                        HStack(spacing: 4) {
                            Text(club.name.uppercased()).font(.pitchDisplay(20))
                            if club.isVerified {
                                Image(systemName: "checkmark.seal.fill")
                                    .font(.caption)
                                    .foregroundStyle(Color.pitchGreen)
                            }
                        }
                        let subtitle = [club.city, club.championship].compactMap { $0 }.joined(separator: " · ")
                        if !subtitle.isEmpty {
                            LabelXS(text: subtitle)
                        }
                    }

                    Spacer()
                    Image(systemName: "chevron.right").font(.caption).foregroundStyle(.tertiary)
                }
                .foregroundStyle(.primary)
            }
        }
    }
}
