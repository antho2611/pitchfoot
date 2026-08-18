import Foundation

struct Club: Identifiable, Codable {
    let id: String
    let name: String
    let city: String?
    let country: String?
    let championship: String?
    let level: String?
    let logoURL: String?
    let isVerified: Bool
    let description: String?
    let stadium: String?

    enum CodingKeys: String, CodingKey {
        case id, name, city, country, championship, level
        case logoURL = "logo_url"
        case isVerified = "is_verified"
        case description, stadium
    }
}
