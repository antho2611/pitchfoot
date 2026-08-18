import Foundation

struct ChatMessage: Identifiable, Decodable {
    let id: String
    let conversationId: String
    let senderId: String
    let content: String
    let createdAt: String

    enum CodingKeys: String, CodingKey {
        case id
        case conversationId = "conversation_id"
        case senderId = "sender_id"
        case content
        case createdAt = "created_at"
    }
}

struct ConversationRow: Decodable {
    let id: String
    let participantA: String
    let participantB: String
    let lastMessageAt: String

    enum CodingKeys: String, CodingKey {
        case id
        case participantA = "participant_a"
        case participantB = "participant_b"
        case lastMessageAt = "last_message_at"
    }
}

/// Vue composée côté client — équivalent du type Conv dans messages.tsx.
/// Hashable (en plus d'Identifiable) car navigationDestination(item:) l'exige.
struct Conversation: Identifiable, Hashable {
    let id: String
    let otherId: String
    let name: String
    let avatarURL: String?
    let preview: String
    let lastMessageAt: String
}
