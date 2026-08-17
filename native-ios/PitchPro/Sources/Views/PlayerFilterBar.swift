import SwiftUI

/// Barre de filtres toujours visible sur la page, comme sur le site
/// (pas cachée derrière une icône de barre de navigation).
struct PlayerFilterBar: View {
    @Binding var filters: PlayerFilters
    let onSearch: () -> Void

    private let box = RoundedRectangle(cornerRadius: 0)

    var body: some View {
        VStack(spacing: 10) {
            TextField("Nom, club...", text: $filters.query)
                .padding(10)
                .overlay(box.strokeBorder(Color.secondary.opacity(0.3)))

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                menu("Poste", selection: $filters.position, options: PitchProConstants.positions)
                menu("Niveau", selection: $filters.level, options: PitchProConstants.levels)
                menu(
                    "Disponibilité",
                    selection: $filters.availability,
                    options: PitchProConstants.availabilities.map(\.value),
                    labels: Dictionary(uniqueKeysWithValues: PitchProConstants.availabilities)
                )
                menu(
                    "Âge max",
                    selection: $filters.maxAge,
                    options: PitchProConstants.maxAges.map(String.init),
                    suffix: " ans max"
                )
            }

            TextField("Ville", text: $filters.city)
                .padding(10)
                .overlay(box.strokeBorder(Color.secondary.opacity(0.3)))

            HStack {
                if filters.isActive {
                    Button("Réinitialiser") { filters = PlayerFilters() }
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Button("Rechercher", action: onSearch)
                    .buttonStyle(PitchButtonStyle())
                    .frame(width: 160)
            }
        }
        .padding(.horizontal)
        .padding(.bottom, 4)
    }

    private func menu(
        _ placeholder: String,
        selection: Binding<String>,
        options: [String],
        labels: [String: String] = [:],
        suffix: String = ""
    ) -> some View {
        Menu {
            Button(placeholder) { selection.wrappedValue = "" }
            ForEach(options, id: \.self) { option in
                Button(labels[option] ?? "\(option)\(suffix)") { selection.wrappedValue = option }
            }
        } label: {
            HStack {
                Text(
                    selection.wrappedValue.isEmpty
                        ? placeholder
                        : (labels[selection.wrappedValue] ?? "\(selection.wrappedValue)\(suffix)")
                )
                .lineLimit(1)
                Spacer()
                Image(systemName: "chevron.down").font(.caption2)
            }
            .font(.system(size: 13, weight: .medium))
            .foregroundStyle(selection.wrappedValue.isEmpty ? Color.secondary : Color.pitchGreen)
            .padding(10)
            .overlay(box.strokeBorder(Color.secondary.opacity(0.3)))
        }
    }
}
