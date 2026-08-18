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
    let isPremium: Bool

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
        case isPremium = "is_premium"
    }

    var age: Int? {
        guard let birthDate else { return nil }
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        guard let date = formatter.date(from: birthDate) else { return nil }
        return Calendar.current.dateComponents([.year], from: date, to: Date()).year
    }

    var positionShort: String? {
        Self.positionShortMap[mainPosition ?? ""]
    }

    var availabilityLabel: String {
        PitchProConstants.availabilities.first { $0.value == availability }?.label
            ?? "Ouvert aux propositions"
    }

    private static let positionShortMap: [String: String] = [
        "Gardien": "GB",
        "Latéral droit": "DD",
        "Latéral gauche": "DG",
        "Défenseur central": "DC",
        "Milieu défensif": "MDC",
        "Milieu central": "MC",
        "Milieu offensif": "MOC",
        "Ailier droit": "AD",
        "Ailier gauche": "AG",
        "Attaquant": "BU",
    ]
}
