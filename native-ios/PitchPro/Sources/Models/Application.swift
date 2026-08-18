import Foundation

struct Application: Identifiable, Decodable {
    let id: String
    let listingId: String
    let playerId: String
    let clubId: String
    let message: String?
    let status: String
    let createdAt: String

    enum CodingKeys: String, CodingKey {
        case id
        case listingId = "listing_id"
        case playerId = "player_id"
        case clubId = "club_id"
        case message, status
        case createdAt = "created_at"
    }
}

struct SavedPlayer: Identifiable, Decodable {
    let id: String
    let clubId: String
    let playerId: String

    enum CodingKeys: String, CodingKey {
        case id
        case clubId = "club_id"
        case playerId = "player_id"
    }
}

struct AccountProfile: Decodable {
    let accountType: String
    let displayName: String

    enum CodingKeys: String, CodingKey {
        case accountType = "account_type"
        case displayName = "display_name"
    }
}
