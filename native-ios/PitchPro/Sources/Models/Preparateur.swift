import Foundation

struct Preparateur: Identifiable, Codable {
    let id: String
    let fullName: String
    let headline: String?
    let city: String?
    let country: String?
    let photoURL: String?
    let isVerified: Bool
    let bio: String?
    let qualifications: String?
    let specialties: [String]
    let priceInfo: String?

    enum CodingKeys: String, CodingKey {
        case id
        case fullName = "full_name"
        case headline, city, country
        case photoURL = "photo_url"
        case isVerified = "is_verified"
        case bio, qualifications, specialties
        case priceInfo = "price_info"
    }
}
