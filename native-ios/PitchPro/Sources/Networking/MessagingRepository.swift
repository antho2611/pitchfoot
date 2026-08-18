import Foundation
import Supabase

private struct NewConversation: Encodable {
    let id: String
    let participant_a: String
    let participant_b: String
}

private struct ConversationIdRow: Decodable {
    let id: String
}

private struct NewMessage: Encodable {
    let conversation_id: String
    let sender_id: String
    let content: String
}

private struct LastMessageAtUpdate: Encodable {
    let last_message_at: String
}

private struct ProfileRow: Decodable {
    let id: String
    let displayName: String?
    let avatarUrl: String?

    enum CodingKeys: String, CodingKey {
        case id
        case displayName = "display_name"
        case avatarUrl = "avatar_url"
    }
}

private struct MessagePreviewRow: Decodable {
    let conversationId: String
    let content: String

    enum CodingKeys: String, CodingKey {
        case conversationId = "conversation_id"
        case content
    }
}

private struct NewNotification: Encodable {
    let user_id: String
    let type: String
    let title: String
    let body: String?
    let link: String?
}

/// Même logique que src/lib/messaging.ts + src/routes/_authenticated/messages.tsx :
/// une nouvelle conversation n'est acceptée par la base que si l'un des deux
/// comptes suit l'autre (voir can_message() dans la migration follows).
enum MessagingRepository {
    static func openConversation(me: String, other: String) async throws -> String {
        let sorted = [me, other].sorted()
        let existing: [ConversationIdRow] = try await supabase
            .from("conversations")
            .select("id")
            .eq("participant_a", value: sorted[0])
            .eq("participant_b", value: sorted[1])
            .execute()
            .value
        if let id = existing.first?.id { return id }

        let newId = UUID().uuidString
        try await supabase
            .from("conversations")
            .insert(NewConversation(id: newId, participant_a: sorted[0], participant_b: sorted[1]))
            .execute()
        return newId
    }

    static func notify(userId: String, type: String, title: String, body: String? = nil, link: String? = nil) async {
        try? await supabase
            .from("notifications")
            .insert(NewNotification(user_id: userId, type: type, title: title, body: body, link: link))
            .execute()
    }

    static func fetchConversations(myId: String) async throws -> [Conversation] {
        let rows: [ConversationRow] = try await supabase
            .from("conversations")
            .select("*")
            .order("last_message_at", ascending: false)
            .execute()
            .value

        guard !rows.isEmpty else { return [] }

        let otherIds = rows.map { $0.participantA == myId ? $0.participantB : $0.participantA }
        let convIds = rows.map { $0.id }

        async let profilesTask: [ProfileRow] = supabase
            .from("profiles")
            .select("id, display_name, avatar_url")
            .in("id", values: otherIds)
            .execute()
            .value
        async let previewsTask: [MessagePreviewRow] = supabase
            .from("messages")
            .select("conversation_id, content")
            .in("conversation_id", values: convIds)
            .order("created_at", ascending: false)
            .execute()
            .value

        let (profiles, previews) = try await (profilesTask, previewsTask)

        var previewByConversation: [String: String] = [:]
        for preview in previews where previewByConversation[preview.conversationId] == nil {
            previewByConversation[preview.conversationId] = preview.content
        }

        return rows.map { row in
            let otherId = row.participantA == myId ? row.participantB : row.participantA
            let profile = profiles.first { $0.id == otherId }
            let name = profile?.displayName?.isEmpty == false ? profile!.displayName! : "Utilisateur"
            return Conversation(
                id: row.id,
                otherId: otherId,
                name: name,
                avatarURL: profile?.avatarUrl,
                preview: previewByConversation[row.id] ?? "Nouvelle conversation",
                lastMessageAt: row.lastMessageAt
            )
        }
    }

    static func fetchMessages(conversationId: String) async throws -> [ChatMessage] {
        try await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", value: conversationId)
            .order("created_at", ascending: true)
            .execute()
            .value
    }

    static func send(conversationId: String, senderId: String, content: String) async throws {
        try await supabase
            .from("messages")
            .insert(NewMessage(conversation_id: conversationId, sender_id: senderId, content: String(content.prefix(2000))))
            .execute()
        try await supabase
            .from("conversations")
            .update(LastMessageAtUpdate(last_message_at: ISO8601DateFormatter().string(from: Date())))
            .eq("id", value: conversationId)
            .execute()
    }
}
