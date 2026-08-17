import SwiftUI

/// Écran liste générique (chargement / erreur / vide / contenu) — évite de répéter
/// la même mécanique dans chaque onglet (Annonces, Clubs, Préparateurs, Séances...).
/// Rendu en cartes bordées façon site web plutôt qu'en List système.
struct AsyncListView<Item: Identifiable, RowContent: View, Header: View>: View {
    let title: String
    let emptyMessage: String
    let emptySymbol: String
    let load: () async throws -> [Item]
    @ViewBuilder let row: (Item) -> RowContent
    @ViewBuilder var header: () -> Header = { EmptyView() }

    @State private var items: [Item] = []
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                Text(title.uppercased())
                    .font(.pitchDisplay(40))
                    .padding(.horizontal)
                    .padding(.top, 8)

                header()

                if isLoading {
                    ProgressView()
                        .frame(maxWidth: .infinity)
                        .padding(.top, 40)
                } else if let errorMessage {
                    stateMessage(errorMessage, symbol: "exclamationmark.triangle")
                } else if items.isEmpty {
                    stateMessage(emptyMessage, symbol: emptySymbol)
                } else {
                    VStack(spacing: 10) {
                        ForEach(items) { item in
                            PitchCard { row(item) }
                        }
                    }
                    .padding(.horizontal)
                }
            }
            .padding(.bottom, 24)
        }
        .background(Color(.systemBackground))
        .navigationBarTitleDisplayMode(.inline)
        .task { await fetch() }
        .refreshable { await fetch() }
    }

    private func stateMessage(_ text: String, symbol: String) -> some View {
        VStack(spacing: 8) {
            Image(systemName: symbol).font(.largeTitle).foregroundStyle(.secondary)
            Text(text).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 40)
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
