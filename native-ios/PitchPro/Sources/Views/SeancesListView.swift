import SwiftUI

struct SeancesListView: View {
    var body: some View {
        AsyncListView(
            title: "Séances",
            emptyMessage: "Aucune séance",
            emptySymbol: "dumbbell",
            load: CoachAnnoncesRepository.fetchAll
        ) { session in
            VStack(alignment: .leading, spacing: 4) {
                Text(session.title.uppercased()).font(.pitchDisplay(20))
                let subtitle = [session.sessionDate, session.startTime, session.city]
                    .compactMap { $0 }
                    .joined(separator: " · ")
                if !subtitle.isEmpty {
                    LabelXS(text: subtitle)
                }
            }
        }
    }
}
