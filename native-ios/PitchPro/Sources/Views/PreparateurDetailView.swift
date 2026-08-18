import SwiftUI

struct PreparateurDetailView: View {
    let preparateurId: String

    @EnvironmentObject private var session: SessionStore
    @State private var coach: Preparateur?
    @State private var sessions: [CoachAnnonce] = []
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var pushedConversation: Conversation?
    @State private var contactError: String?
    @State private var contacting = false

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().padding(.top, 60)
            } else if let errorMessage {
                Text(errorMessage).foregroundStyle(.secondary).padding(.top, 60)
            } else if let coach {
                content(for: coach)
                    .frame(maxWidth: 700)
                    .frame(maxWidth: .infinity)
            }
        }
        .background(Color(.systemBackground))
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .navigationDestination(item: $pushedConversation) { conversation in
            if let myId = session.session?.user.id.uuidString {
                ConversationThreadView(myId: myId, conversation: conversation)
            }
        }
    }

    @ViewBuilder
    private func content(for coach: Preparateur) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(alignment: .top, spacing: 14) {
                AsyncImage(url: coach.photoURL.flatMap(URL.init)) { image in
                    image.resizable().scaledToFill()
                } placeholder: {
                    Color.secondary.opacity(0.15)
                }
                .frame(width: 84, height: 84)
                .clipShape(Circle())

                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 6) {
                        Text(coach.fullName.uppercased()).font(.pitchDisplay(26))
                        if coach.isVerified {
                            Image(systemName: "checkmark.seal.fill").foregroundStyle(Color.pitchGreen)
                        }
                    }
                    if let headline = coach.headline {
                        Text(headline).font(.subheadline).foregroundStyle(.secondary)
                    }
                    let subtitle = [coach.city, coach.country].compactMap { $0 }.joined(separator: ", ")
                    if !subtitle.isEmpty {
                        LabelXS(text: subtitle)
                    }
                }
            }
            .padding(.top)

            HStack(spacing: 12) {
                Button {
                    Task { await contact(coach: coach) }
                } label: {
                    if contacting {
                        ProgressView().tint(Color.pitchVolt)
                    } else {
                        Text("Contacter")
                    }
                }
                .buttonStyle(PitchButtonStyle())
                .fixedSize()
                .disabled(contacting)

                FollowButton(targetId: coach.id, targetName: coach.fullName)
            }
            FollowCounts(userId: coach.id)
            if let contactError {
                Text(contactError).font(.footnote).foregroundStyle(.red)
            }

            if !coach.specialties.isEmpty {
                HStack {
                    ForEach(coach.specialties, id: \.self) { specialty in
                        Text(specialty)
                            .font(.system(size: 12, weight: .semibold))
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(Color.pitchGreen.opacity(0.08))
                            .foregroundStyle(Color.pitchGreen)
                    }
                }
            }

            if let qualifications = coach.qualifications, !qualifications.isEmpty {
                infoBlock("Qualifications", qualifications)
            }

            if let priceInfo = coach.priceInfo, !priceInfo.isEmpty {
                infoBlock("Tarifs", priceInfo)
            }

            if let bio = coach.bio, !bio.isEmpty {
                infoBlock("À propos", bio)
            }

            if !sessions.isEmpty {
                VStack(alignment: .leading, spacing: 10) {
                    Text("SÉANCES PROPOSÉES").font(.pitchDisplay(22))
                    VStack(spacing: 8) {
                        ForEach(sessions) { session in
                            NavigationLink {
                                SeanceDetailView(session: session)
                            } label: {
                                PitchCard {
                                    HStack {
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text(session.title.uppercased()).font(.pitchDisplay(16))
                                            LabelXS(text: session.sessionDate)
                                        }
                                        Spacer()
                                        Image(systemName: "chevron.right")
                                            .font(.caption2)
                                            .foregroundStyle(.tertiary)
                                    }
                                }
                            }
                            .foregroundStyle(.primary)
                        }
                    }
                }
            }
        }
        .padding()
    }

    private func infoBlock(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label.uppercased()).font(.pitchDisplay(18))
            Text(value).font(.body).foregroundStyle(.secondary)
        }
    }

    private func load() async {
        isLoading = true
        errorMessage = nil
        do {
            async let coachTask = PreparateursRepository.fetchOne(id: preparateurId)
            async let sessionsTask = CoachAnnoncesRepository.fetchForCoach(coachId: preparateurId)
            let (fetchedCoach, fetchedSessions) = try await (coachTask, sessionsTask)
            coach = fetchedCoach
            sessions = fetchedSessions
        } catch {
            errorMessage = "Fiche indisponible."
        }
        isLoading = false
    }

    private func contact(coach: Preparateur) async {
        guard let myId = session.session?.user.id.uuidString else { return }
        contacting = true
        contactError = nil
        do {
            let cid = try await MessagingRepository.openConversation(me: myId, other: coach.id)
            pushedConversation = Conversation(
                id: cid,
                otherId: coach.id,
                name: coach.fullName,
                avatarURL: coach.photoURL,
                preview: "",
                lastMessageAt: ""
            )
        } catch {
            contactError = "Suivez ce profil pour pouvoir lui écrire."
        }
        contacting = false
    }
}
