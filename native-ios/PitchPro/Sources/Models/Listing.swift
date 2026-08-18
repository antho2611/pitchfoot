import Foundation

struct Listing: Identifiable, Codable {
    let id: String
    let title: String
    let position: String?
    let city: String?
    let championship: String?
    let level: String?
    let isOpen: Bool
    let clubId: String
    let description: String?
    let season: String?
    let minAge: Int?
    let maxAge: Int?

    enum CodingKeys: String, CodingKey {
        case id, title, position, city, championship, level
        case isOpen = "is_open"
        case clubId = "club_id"
        case description, season
        case minAge = "min_age"
        case maxAge = "max_age"
    }
}
