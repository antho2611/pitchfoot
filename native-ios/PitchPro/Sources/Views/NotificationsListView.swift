import SwiftUI

struct NotificationsListView: View {
    @EnvironmentObject private var session: SessionStore
    @State private var notifications: [AppNotification] = []
    @State private var isLoading = true
    @State private var pushedConversation: Conversation?

    private var myId: String? { session.session?.user.id.uuidString.lowercased() }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                HStack(alignment: .firstTextBaseline) {
                    Text("NOTIFICATIONS").font(.pitchDisplay(36))
                    Spacer()
                    if notifications.contains(where: { !$0.isRead }) {
                        Button("Tout marquer comme lu") {
                            Task { await markAll() }
                        }
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(Color.pitchGreen)
                    }
                }
                .padding(.horizontal)
                .padding(.top, 8)
                .padding(.bottom, 12)

                if isLoading {
                    ProgressView().frame(maxWidth: .infinity).padding(.top, 40)
                } else if notifications.isEmpty {
                    Text("Aucune notification.")
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity)
                        .padding(.top, 60)
                } else {
                    VStack(spacing: 10) {
                        ForEach(notifications) { n in
                            row(for: n)
                        }
                    }
                    .padding(.horizontal)
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
        .navigationDestination(item: $pushedConversation) { conversation in
            if let myId {
                ConversationThreadView(myId: myId, conversation: conversation)
            }
        }
    }

    @ViewBuilder
    private func row(for n: AppNotification) -> some View {
        Button {
            Task { await open(n) }
        } label: {
            VStack(alignment: .leading, spacing: 4) {
                Text(n.title.uppercased()).font(.pitchDisplay(18)).foregroundStyle(.primary)
                if let body = n.body, !body.isEmpty {
                    Text(body).font(.footnote).foregroundStyle(.secondary)
                }
                Text(formatDateTime(n.createdAt))
                    .font(.system(size: 10))
                    .foregroundStyle(.tertiary)
            }
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(n.isRead ? Color.clear : Color.pitchVolt.opacity(0.12))
            .overlay(
                Rectangle().strokeBorder(n.isRead ? Color.secondary.opacity(0.15) : Color.pitchGreen.opacity(0.4))
            )
        }
        .buttonStyle(.plain)
    }

    private func load() async {
        isLoading = true
        notifications = (try? await NotificationsRepository.fetchAll()) ?? []
        isLoading = false
    }

    private func markAll() async {
        try? await NotificationsRepository.markAllRead()
        await load()
    }

    /// Marque comme lu au tap, puis ouvre le fil de discussion correspondant
    /// si la notification est de type "message" (lien du style /messages?c=...,
    /// même format que sur le site).
    private func open(_ n: AppNotification) async {
        if !n.isRead {
            try? await NotificationsRepository.markRead(id: n.id)
            await load()
        }
        guard n.type == "message", let myId, let cid = conversationId(fromLink: n.link) else { return }
        pushedConversation = try? await MessagingRepository.fetchConversation(id: cid, myId: myId)
    }

    private func conversationId(fromLink link: String?) -> String? {
        guard let link, let components = URLComponents(string: link) else { return nil }
        return components.queryItems?.first(where: { $0.name == "c" })?.value
    }
}

private func formatDateTime(_ iso: String) -> String {
    let withFractional = ISO8601DateFormatter()
    withFractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    let plain = ISO8601DateFormatter()
    plain.formatOptions = [.withInternetDateTime]
    guard let date = withFractional.date(from: iso) ?? plain.date(from: iso) else { return "" }
    let out = DateFormatter()
    out.dateStyle = .medium
    out.timeStyle = .short
    out.locale = Locale(identifier: "fr_FR")
    return out.string(from: date)
}
