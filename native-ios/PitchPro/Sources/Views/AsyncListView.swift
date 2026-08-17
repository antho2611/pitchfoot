import SwiftUI

/// Écran liste générique (chargement / erreur / vide / contenu) — évite de répéter
/// la même mécanique dans chaque onglet (Annonces, Clubs, Préparateurs, Séances...).
struct AsyncListView<Item: Identifiable, RowContent: View>: View {
    let title: String
    let emptyMessage: String
    let emptySymbol: String
    let load: () async throws -> [Item]
    @ViewBuilder let row: (Item) -> RowContent

    @State private var items: [Item] = []
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        Group {
            if isLoading {
                ProgressView()
            } else if let errorMessage {
                ContentUnavailableView(errorMessage, systemImage: "exclamationmark.triangle")
            } else if items.isEmpty {
                ContentUnavailableView(emptyMessage, systemImage: emptySymbol)
            } else {
                List(items) { item in
                    row(item)
                }
                .listStyle(.plain)
            }
        }
        .navigationTitle(title)
        .task { await fetch() }
        .refreshable { await fetch() }
    }

    private func fetch() async {
        isLoading = true
        errorMessage = nil
        do {
            items = try await load()
        } catch {
            errorMessage = "Chargement impossible."
        }
        isLoading = false
    }
}
