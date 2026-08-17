import SwiftUI

struct AnnoncesListView: View {
    var body: some View {
        AsyncListView(
            title: "Annonces",
            emptyMessage: "Aucune annonce ouverte",
            emptySymbol: "megaphone",
            load: ListingsRepository.fetchOpen
        ) { listing in
            VStack(alignment: .leading, spacing: 2) {
                Text(listing.title).font(.headline)
                let subtitle = [listing.position, listing.city, listing.championship]
                    .compactMap { $0 }
                    .joined(separator: " · ")
                if !subtitle.isEmpty {
                    Text(subtitle).font(.subheadline).foregroundStyle(.secondary)
                }
            }
            .padding(.vertical, 4)
        }
    }
}
