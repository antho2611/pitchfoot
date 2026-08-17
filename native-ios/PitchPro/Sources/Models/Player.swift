import Foundation

/// Miroir de la table public.players (voir supabase/migrations et src/integrations/supabase/types.ts).
struct Player: Identifiable, Codable {
    let id: String
    let firstName: String
    let lastName: String
    let mainPosition: String?
    let city: String?
    let country: String?
    let currentClub: String?
    let photoURL: String?
    let availability: String
    let bio: String?
    let heightCm: Int?
    let weightKg: Int?
    let level: String?
    let championship: String?
    let birthDate: String?

    enum CodingKeys: String, CodingKey {
        case id
        case firstName = "first_name"
        case lastName = "last_name"
        case mainPosition = "main_position"
        case city
        case country
        case currentClub = "current_club"
        case photoURL = "photo_url"
        case availability
        case bio
        case heightCm = "height_cm"
        case weightKg = "weight_kg"
        case level
        case championship
        case birthDate = "birth_date"
    }
}
