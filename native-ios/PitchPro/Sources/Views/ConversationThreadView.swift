import SwiftUI

struct ConversationThreadView: View {
    let myId: String
    let conversation: Conversation

    @State private var messages: [ChatMessage] = []
    @State private var text = ""
    @State private var isLoading = true
    @State private var sending = false

    var body: some View {
        VStack(spacing: 0) {
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 10) {
                        if messages.isEmpty && !isLoading {
                            Text("C'est le début de votre conversation.")
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                                .frame(maxWidth: .infinity)
                                .padding(.top, 40)
                        }
                        ForEach(messages) { message in
                            bubble(for: message).id(message.id)
                        }
                    }
                    .padding(12)
                }
                .onChange(of: messages.count) { _, _ in
                    if let lastId = messages.last?.id {
                        withAnimation { proxy.scrollTo(lastId, anchor: .bottom) }
                    }
                }
            }

            Divider()

            HStack(alignment: .bottom, spacing: 10) {
                TextField("Votre message…", text: $text, axis: .vertical)
                    .lineLimit(1...4)
                    .textFieldStyle(.plain)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 9)
                    .background(Color.secondary.opacity(0.1))
                    .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))

                Button {
                    Task { await send() }
                } label: {
                    Image(systemName: "arrow.up")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(Color.pitchVolt)
                        .frame(width: 38, height: 38)
                        .background(Color.pitchGreen)
                        .clipShape(Circle())
                }
                .disabled(text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || sending)
            }
            .padding(10)
        }
        .background(Color(.systemBackground))
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .principal) {
                HStack(spacing: 8) {
                    ChatAvatar(url: conversation.avatarURL, name: conversation.name, size: 28)
                    Text(conversation.name.uppercased()).font(.pitchDisplay(16))
                }
            }
        }
        .task { await load() }
        .task { await poll() }
    }

    @ViewBuilder
    private func bubble(for message: ChatMessage) -> some View {
        let mine = message.senderId.lowercased() == myId.lowercased()
        HStack {
            if mine { Spacer(minLength: 40) }
            VStack(alignment: .leading, spacing: 4) {
                Text(message.content)
                Text(formatTime(message.createdAt))
                    .font(.system(size: 10))
                    .opacity(0.6)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 9)
            .foregroundStyle(mine ? Color.white : Color.primary)
            .background(mine ? Color.pitchGreen : Color.secondary.opacity(0.12))
            .clipShape(
                UnevenRoundedRectangle(
                    cornerRadii: RectangleCornerRadii(
                        topLeading: 18,
                        bottomLeading: mine ? 18 : 4,
                        bottomTrailing: mine ? 4 : 18,
                        topTrailing: 18
                    ),
                    style: .continuous
                )
            )
            .frame(maxWidth: 280, alignment: .leading)
            if !mine { Spacer(minLength: 40) }
        }
        .frame(maxWidth: .infinity, alignment: mine ? .trailing : .leading)
    }

    private func load() async {
        isLoading = true
        messages = (try? await MessagingRepository.fetchMessages(conversationId: conversation.id)) ?? []
        isLoading = false
    }

    /// Pas de canal realtime côté natif pour l'instant : rafraîchissement
    /// périodique pendant que l'écran est ouvert. La tâche s'arrête toute
    /// seule à la fermeture de la vue (comportement standard de .task).
    private func poll() async {
        while !Task.isCancelled {
            try? await Task.sleep(for: .seconds(4))
            if Task.isCancelled { break }
            if let fresh = try? await MessagingRepository.fetchMessages(conversationId: conversation.id) {
                messages = fresh
            }
        }
    }

    private func send() async {
        let content = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !content.isEmpty else { return }
        text = ""
        sending = true
        try? await MessagingRepository.send(conversationId: conversation.id, senderId: myId, content: content)
        await MessagingRepository.notify(
            userId: conversation.otherId,
            type: "message",
            title: "Nouveau message",
            body: String(content.prefix(140)),
            link: "/messages?c=\(conversation.id)"
        )
        messages = (try? await MessagingRepository.fetchMessages(conversationId: conversation.id)) ?? messages
        sending = false
    }
}

private func formatTime(_ iso: String) -> String {
    let withFractional = ISO8601DateFormatter()
    withFractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    let plain = ISO8601DateFormatter()
    plain.formatOptions = [.withInternetDateTime]
    guard let date = withFractional.date(from: iso) ?? plain.date(from: iso) else { return "" }
    let out = DateFormatter()
    out.dateFormat = "HH:mm"
    return out.string(from: date)
}
