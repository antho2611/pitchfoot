import Foundation

struct AppNotification: Identifiable, Decodable {
    let id: String
    let type: String
    let title: String
    let body: String?
    let link: String?
    let isRead: Bool
    let createdAt: String

    enum CodingKeys: String, CodingKey {
        case id, type, title, body, link
        case isRead = "is_read"
        case createdAt = "created_at"
    }
}
