import Foundation

struct Listing: Identifiable, Codable {
    let id: String
    let title: String
    let position: String?
    let city: String?
    let championship: String?
    let level: String?
    let isOpen: Bool

    enum CodingKeys: String, CodingKey {
        case id, title, position, city, championship, level
        case isOpen = "is_open"
    }
}
