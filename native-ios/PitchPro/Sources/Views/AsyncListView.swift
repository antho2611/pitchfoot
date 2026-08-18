import SwiftUI

/// Écran liste générique (chargement / erreur / vide / contenu) — évite de répéter
/// la même mécanique dans chaque onglet (Annonces, Clubs, Préparateurs, Séances...).
/// Rendu en cartes bordées façon site web plutôt qu'en List système.
/// `columns > 1` bascule en grille (façon grille de cartes joueurs du site) —
/// dans ce cas `row` doit fournir sa propre carte (pas de PitchCard automatique).
struct AsyncListView<Item: Identifiable, RowContent: View, Header: View>: View {
    let title: String
    let emptyMessage: String
    let emptySymbol: String
    let columns: Int
    let load: () async throws -> [Item]
    let row: (Item) -> RowContent
    let header: () -> Header

    init(
        title: String,
        emptyMessage: String,
        emptySymbol: String,
        columns: Int = 1,
        load: @escaping () async throws -> [Item],
        @ViewBuilder row: @escaping (Item) -> RowContent,
        @ViewBuilder header: @escaping () -> Header
    ) {
        self.title = title
        self.emptyMessage = emptyMessage
        self.emptySymbol = emptySymbol
        self.columns = columns
        self.load = load
        self.row = row
        self.header = header
    }

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
                } else if columns > 1 {
                    LazyVGrid(
                        columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: columns),
                        spacing: 10
                    ) {
                        ForEach(items) { item in row(item) }
                    }
                    .padding(.horizontal)
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
            // Sur iPad, on garde une colonne de lecture confortable plutôt que
            // d'étirer les cartes sur toute la largeur de l'écran.
            .frame(maxWidth: 700)
            .frame(maxWidth: .infinity)
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

/// Version sans en-tête (Annonces, Clubs, Préparateurs, Séances) — le type
/// générique Header ne peut pas être déduit d'une valeur par défaut, donc on
/// le fixe explicitement à EmptyView ici plutôt que de compter sur l'inférence.
extension AsyncListView where Header == EmptyView {
    init(
        title: String,
        emptyMessage: String,
        emptySymbol: String,
        columns: Int = 1,
        load: @escaping () async throws -> [Item],
        @ViewBuilder row: @escaping (Item) -> RowContent
    ) {
        self.init(
            title: title,
            emptyMessage: emptyMessage,
            emptySymbol: emptySymbol,
            columns: columns,
            load: load,
            row: row,
            header: { EmptyView() }
        )
    }
}
