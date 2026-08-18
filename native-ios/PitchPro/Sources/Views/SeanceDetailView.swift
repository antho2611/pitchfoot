import SwiftUI

/// Pas de flux de réservation formalisé sur le site (pas de page détail séance
/// côté web) — cet écran affiche simplement toutes les infos de la séance.
struct SeanceDetailView: View {
    let session: CoachAnnonce

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text(session.title.uppercased()).font(.pitchDisplay(36))

                let subtitle = [session.sessionDate, session.startTime, session.city]
                    .compactMap { $0 }
                    .joined(separator: " · ")
                if !subtitle.isEmpty {
                    LabelXS(text: subtitle)
                }

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                    infoBox("Lieu", session.location ?? session.city ?? "—")
                    infoBox("Horaire", [session.startTime, session.endTime].compactMap { $0 }.joined(separator: " – ").isEmpty ? "—" : [session.startTime, session.endTime].compactMap { $0 }.joined(separator: " – "))
                    infoBox("Tarif", session.priceInfo ?? "—")
                    infoBox("Places", session.capacity.map { "\(session.reservedCount)/\($0)" } ?? "—")
                }

                if let description = session.description, !description.isEmpty {
                    Text(description).font(.body).foregroundStyle(.secondary)
                }
            }
            .padding()
            .frame(maxWidth: 700)
            .frame(maxWidth: .infinity)
        }
        .background(Color(.systemBackground))
        .navigationBarTitleDisplayMode(.inline)
    }

    private func infoBox(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            LabelXS(text: label)
            Text(value.uppercased()).font(.pitchDisplay(16))
        }
        .padding(10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay(Rectangle().strokeBorder(Color.secondary.opacity(0.15)))
    }
}
