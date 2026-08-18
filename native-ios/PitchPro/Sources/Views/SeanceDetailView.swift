import SwiftUI

struct SeanceDetailView: View {
    let session: CoachAnnonce
    @EnvironmentObject private var authSession: SessionStore

    @State private var message = ""
    @State private var sending = false
    @State private var sent = false
    @State private var alreadyReserved = false
    @State private var sendError: String?
    @State private var checkingStatus = true

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
                    infoBox("Horaire", timeRange)
                    infoBox("Tarif", session.priceInfo ?? "—")
                    infoBox("Places", session.capacity.map { "\(session.reservedCount)/\($0)" } ?? "—")
                }

                if let description = session.description, !description.isEmpty {
                    Text(description).font(.body).foregroundStyle(.secondary)
                }

                registrationSection
            }
            .padding()
            .frame(maxWidth: 700)
            .frame(maxWidth: .infinity)
        }
        .background(Color(.systemBackground))
        .navigationBarTitleDisplayMode(.inline)
        .task { await checkExistingReservation() }
    }

    @ViewBuilder
    private var registrationSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("S'INSCRIRE").font(.pitchDisplay(28))

            if checkingStatus {
                ProgressView()
            } else if sent || alreadyReserved {
                Text("Votre demande d'inscription a été envoyée au préparateur.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            } else if session.isFull {
                Text("Cette séance est complète.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            } else {
                TextEditor(text: $message)
                    .frame(height: 100)
                    .padding(6)
                    .overlay(RoundedRectangle(cornerRadius: 0).strokeBorder(Color.secondary.opacity(0.3)))
                    .overlay(alignment: .topLeading) {
                        if message.isEmpty {
                            Text("Message (optionnel)")
                                .foregroundStyle(.secondary)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 14)
                                .allowsHitTesting(false)
                        }
                    }

                if let sendError {
                    Text(sendError).font(.footnote).foregroundStyle(.red)
                }

                Button {
                    Task { await reserve() }
                } label: {
                    if sending {
                        ProgressView().tint(Color.pitchVolt)
                    } else {
                        Text("Demander une place")
                    }
                }
                .buttonStyle(PitchButtonStyle())
                .disabled(sending)
            }
        }
        .padding()
        .overlay(Rectangle().strokeBorder(Color.pitchGreen.opacity(0.15)))
    }

    private var timeRange: String {
        let parts = [session.startTime, session.endTime].compactMap { $0 }
        return parts.isEmpty ? "—" : parts.joined(separator: " – ")
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

    private func checkExistingReservation() async {
        checkingStatus = true
        if let playerId = authSession.session?.user.id {
            alreadyReserved = (try? await CoachReservationsRepository.hasReservation(
                annonceId: session.id,
                playerId: playerId.uuidString
            )) ?? false
        }
        checkingStatus = false
    }

    private func reserve() async {
        guard let playerId = authSession.session?.user.id else { return }
        sending = true
        sendError = nil
        do {
            try await CoachReservationsRepository.reserve(
                annonceId: session.id,
                coachId: session.coachId,
                playerId: playerId.uuidString,
                message: message
            )
            sent = true
        } catch {
            sendError = "Inscription impossible (déjà demandée ?)."
        }
        sending = false
    }
}
