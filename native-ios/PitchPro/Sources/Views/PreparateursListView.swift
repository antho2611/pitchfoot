import SwiftUI

struct PreparateursListView: View {
    var body: some View {
        AsyncListView(
            title: "Préparateurs",
            emptyMessage: "Aucun préparateur",
            emptySymbol: "figure.strengthtraining.traditional",
            load: PreparateursRepository.fetchAll
        ) { coach in
            HStack(spacing: 12) {
                AsyncImage(url: coach.photoURL.flatMap(URL.init)) { image in
                    image.resizable().scaledToFill()
                } placeholder: {
                    Color.secondary.opacity(0.2)
                }
                .frame(width: 44, height: 44)
                .clipShape(Circle())

                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 4) {
                        Text(coach.fullName).font(.headline)
                        if coach.isVerified {
                            Image(systemName: "checkmark.seal.fill")
                                .font(.caption)
                                .foregroundStyle(Color.pitchGreen)
                        }
                    }
                    let subtitle = [coach.headline, coach.city].compactMap { $0 }.joined(separator: " · ")
                    if !subtitle.isEmpty {
                        Text(subtitle).font(.subheadline).foregroundStyle(.secondary)
                    }
                }
            }
            .padding(.vertical, 4)
        }
    }
}
