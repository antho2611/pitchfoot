import SwiftUI

struct ConversationsListView: View {
    @EnvironmentObject private var session: SessionStore
    @State private var conversations: [Conversation] = []
    @State private var isLoading = true

    private var myId: String? { session.session?.user.id.uuidString.lowercased() }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Text("MESSAGERIE")
                    .font(.pitchDisplay(40))
                    .padding(.horizontal)
                    .padding(.top, 8)
                    .padding(.bottom, 12)

                if isLoading {
                    ProgressView().frame(maxWidth: .infinity).padding(.top, 40)
                } else if conversations.isEmpty {
                    emptyState
                } else {
                    VStack(spacing: 0) {
                        ForEach(conversations) { conversation in
                            NavigationLink {
                                if let myId {
                                    ConversationThreadView(myId: myId, conversation: conversation)
                                }
                            } label: {
                                row(for: conversation)
                            }
                            .buttonStyle(.plain)
                            Divider().padding(.leading, 76)
                        }
                    }
                }
            }
            .padding(.bottom, 24)
        }
        .frame(maxWidth: 700)
        .frame(maxWidth: .infinity)
        .background(Color(.systemBackground))
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    private func row(for conversation: Conversation) -> some View {
        HStack(spacing: 12) {
            ChatAvatar(url: conversation.avatarURL, name: conversation.name, size: 48)
            VStack(alignment: .leading, spacing: 2) {
                Text(conversation.name.uppercased())
                    .font(.pitchDisplay(18))
                    .foregroundStyle(.primary)
                Text(conversation.preview)
                    .font(.subheadline)
                    .fontWeight(conversation.hasUnread ? .semibold : .regular)
                    .foregroundStyle(conversation.hasUnread ? .primary : .secondary)
                    .lineLimit(1)
            }
            Spacer()
            if conversation.hasUnread {
                Circle().fill(Color.pitchGreen).frame(width: 10, height: 10)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
    }

    @ViewBuilder
    private var emptyState: some View {
        VStack(spacing: 10) {
            Image(systemName: "message").font(.largeTitle).foregroundStyle(.secondary)
            Text("Aucune conversation").foregroundStyle(.secondary)
            Text("Suivez des joueurs ou des coachs pour pouvoir leur écrire.")
                .font(.footnote)
                .foregroundStyle(.tertiary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 60)
    }

    private func load() async {
        guard let myId else { isLoading = false; return }
        isLoading = true
        conversations = (try? await MessagingRepository.fetchConversations(myId: myId)) ?? []
        isLoading = false
    }
}

/// Avatar circulaire avec initiales de secours — seul élément arrondi de l'app,
/// comme sur le site où seuls les avatars de la messagerie sont des cercles.
struct ChatAvatar: View {
    let url: String?
    let name: String
    var size: CGFloat = 44

    private var initials: String {
        let letters = name.split(separator: " ").prefix(2).compactMap { $0.first }
        let text = String(letters).uppercased()
        return text.isEmpty ? "?" : text
    }

    var body: some View {
        ZStack {
            Color.pitchGreen
            if let url, let imageURL = URL(string: url) {
                AsyncImage(url: imageURL) { image in
                    image.resizable().scaledToFill()
                } placeholder: {
                    Text(initials).font(.system(size: size * 0.36, weight: .bold)).foregroundStyle(Color.pitchVolt)
                }
            } else {
                Text(initials).font(.system(size: size * 0.36, weight: .bold)).foregroundStyle(Color.pitchVolt)
            }
        }
        .frame(width: size, height: size)
        .clipShape(Circle())
    }
}
