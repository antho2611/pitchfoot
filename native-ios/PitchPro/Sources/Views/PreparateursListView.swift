import SwiftUI

struct PreparateursListView: View {
    var body: some View {
        AsyncListView(
            title: "Préparateurs",
            emptyMessage: "Aucun préparateur",
            emptySymbol: "figure.strengthtraining.traditional",
            load: PreparateursRepository.fetchAll
        ) { coach in
            NavigationLink {
                PreparateurDetailView(preparateurId: coach.id)
            } label: {
                HStack(spacing: 12) {
                    AsyncImage(url: coach.photoURL.flatMap(URL.init)) { image in
                        image.resizable().scaledToFill()
                    } placeholder: {
                        Color.secondary.opacity(0.15)
                    }
                    .frame(width: 44, height: 44)
                    .clipShape(Circle())

                    VStack(alignment: .leading, spacing: 3) {
                        HStack(spacing: 4) {
                            Text(coach.fullName.uppercased()).font(.pitchDisplay(20))
                            if coach.isVerified {
                                Image(systemName: "checkmark.seal.fill")
                                    .font(.caption)
                                    .foregroundStyle(Color.pitchGreen)
                            }
                        }
                        let subtitle = [coach.headline, coach.city].compactMap { $0 }.joined(separator: " · ")
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
