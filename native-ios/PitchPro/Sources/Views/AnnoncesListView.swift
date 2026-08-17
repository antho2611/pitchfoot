import SwiftUI

struct AnnoncesListView: View {
    var body: some View {
        AsyncListView(
            title: "Annonces",
            emptyMessage: "Aucune annonce ouverte",
            emptySymbol: "megaphone",
            load: ListingsRepository.fetchOpen
        ) { listing in
            VStack(alignment: .leading, spacing: 4) {
                Text(listing.title.uppercased()).font(.pitchDisplay(20))
                let subtitle = [listing.position, listing.city, listing.championship]
                    .compactMap { $0 }
                    .joined(separator: " · ")
                if !subtitle.isEmpty {
                    LabelXS(text: subtitle)
                }
            }
        }
    }
}
