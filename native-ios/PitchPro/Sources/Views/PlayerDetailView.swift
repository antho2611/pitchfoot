import SwiftUI

struct PlayerDetailView: View {
    let playerId: String

    @EnvironmentObject private var session: SessionStore
    @State private var player: Player?
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
                Text(errorMessage)
                    .foregroundStyle(.secondary)
                    .padding(.top, 60)
            } else if let player {
                content(for: player)
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
    private func content(for player: Player) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            AsyncImage(url: player.photoURL.flatMap(URL.init)) { image in
                image.resizable().scaledToFill()
            } placeholder: {
                Color.secondary.opacity(0.15)
            }
            .frame(height: 320)
            .clipped()

            VStack(alignment: .leading, spacing: 16) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("\(player.firstName) \(player.lastName)".uppercased())
                        .font(.pitchDisplay(40))
                    if let position = player.mainPosition {
                        LabelXS(text: position, color: Color.pitchGreen)
                    }
                }

                HStack(spacing: 10) {
                    Button {
                        Task { await contact(player: player) }
                    } label: {
                        if contacting {
                            ProgressView().tint(Color.pitchVolt)
                        } else {
                            Text("Contacter")
                        }
                    }
                    .buttonStyle(PillButtonStyle())
                    .disabled(contacting)

                    FollowButton(targetId: player.id, targetName: "\(player.firstName) \(player.lastName)")
                }

                FollowCounts(userId: player.id)

                if let contactError {
                    Text(contactError).font(.footnote).foregroundStyle(.red)
                }

                let tags = [player.currentClub, player.city, player.championship].compactMap { $0 }
                if !tags.isEmpty {
                    FlowTags(tags: tags)
                }

                HStack(spacing: 20) {
                    if let heightCm = player.heightCm {
                        statItem("Taille", "\(heightCm) cm")
                    }
                    if let weightKg = player.weightKg {
                        statItem("Poids", "\(weightKg) kg")
                    }
                    if let level = player.level {
                        statItem("Niveau", level)
                    }
                }

                if let bio = player.bio, !bio.isEmpty {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("PRÉSENTATION").font(.pitchDisplay(18))
                        Text(bio).font(.body).foregroundStyle(.primary)
                    }
                }
            }
            .padding()
        }
    }

    private func statItem(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            LabelXS(text: label)
            Text(value).font(.pitchDisplay(22))
        }
    }

    private func load() async {
        isLoading = true
        errorMessage = nil
        do {
            player = try await PlayersRepository.fetchOne(id: playerId)
        } catch {
            errorMessage = "Profil indisponible."
        }
        isLoading = false
    }

    private func contact(player: Player) async {
        guard let myId = session.session?.user.id.uuidString else { return }
        contacting = true
        contactError = nil
        do {
            let cid = try await MessagingRepository.openConversation(me: myId, other: player.id)
            await MessagingRepository.notify(
                userId: player.id,
                type: "message",
                title: "Nouveau contact",
                body: "Un club souhaite vous parler.",
                link: "/messages?c=\(cid)"
            )
            pushedConversation = Conversation(
                id: cid,
                otherId: player.id,
                name: "\(player.firstName) \(player.lastName)",
                avatarURL: player.photoURL,
                preview: "",
                lastMessageAt: ""
            )
        } catch {
            contactError = "Suivez ce profil pour pouvoir lui écrire."
        }
        contacting = false
    }
}

/// Petites étiquettes façon "pill" pour club / ville / championnat.
private struct FlowTags: View {
    let tags: [String]

    var body: some View {
        HStack(spacing: 8) {
            ForEach(tags, id: \.self) { tag in
                Text(tag)
                    .font(.system(size: 12, weight: .semibold))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(Color.pitchGreen.opacity(0.08))
                    .foregroundStyle(Color.pitchGreen)
            }
        }
    }
}
