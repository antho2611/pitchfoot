import SwiftUI

struct SeancesListView: View {
    var body: some View {
        AsyncListView(
            title: "Séances",
            emptyMessage: "Aucune séance",
            emptySymbol: "dumbbell",
            load: CoachAnnoncesRepository.fetchAll
        ) { session in
            VStack(alignment: .leading, spacing: 2) {
                Text(session.title).font(.headline)
                let subtitle = [session.sessionDate, session.startTime, session.city]
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
