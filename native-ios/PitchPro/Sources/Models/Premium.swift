import Foundation

/// Miroir de src/lib/premium.ts — mêmes 3 plans, mêmes tarifs.
struct PremiumPlan {
    let id: String
    let audience: String
    let name: String
    let priceLabel: String
    let amountCents: Int
    let features: [String]
}

enum PremiumPlans {
    static let all: [PremiumPlan] = [
        PremiumPlan(
            id: "player_premium",
            audience: "player",
            name: "Premium Joueur",
            priceLabel: "5 € / mois",
            amountCents: 500,
            features: [
                "Profil mis en avant en tête des recherches",
                "Badge Premium sur votre fiche",
                "Statistiques de vues détaillées",
                "Candidatures illimitées aux annonces",
            ]
        ),
        PremiumPlan(
            id: "club_premium",
            audience: "club",
            name: "Premium Club",
            priceLabel: "450 € / mois",
            amountCents: 45000,
            features: [
                "Recherches de joueurs illimitées",
                "Filtres avancés (âge, taille, pied fort, expérience)",
                "Export des profils au format CSV",
                "Annonces mises en avant et badge club vérifié",
            ]
        ),
        PremiumPlan(
            id: "coach_premium",
            audience: "coach",
            name: "Premium Préparateur",
            priceLabel: "19 € / mois",
            amountCents: 1900,
            features: [
                "Fiche mise en avant dans la recherche de préparateurs",
                "Annonces de séances illimitées",
                "Badge Premium sur votre fiche professionnelle",
                "Statistiques de vues et de contacts",
            ]
        ),
    ]

    static func forAccountType(_ accountType: String?) -> String {
        switch accountType {
        case "club": return "club_premium"
        case "coach": return "coach_premium"
        default: return "player_premium"
        }
    }
}

struct Subscription: Decodable {
    let plan: String
    let status: String
    let currentPeriodEnd: String?

    enum CodingKeys: String, CodingKey {
        case plan, status
        case currentPeriodEnd = "current_period_end"
    }

    var isActive: Bool {
        guard status == "active" || status == "trialing" else { return false }
        guard let currentPeriodEnd else { return true }
        let withFractional = ISO8601DateFormatter()
        withFractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let plain = ISO8601DateFormatter()
        plain.formatOptions = [.withInternetDateTime]
        guard let end = withFractional.date(from: currentPeriodEnd) ?? plain.date(from: currentPeriodEnd) else {
            return true
        }
        return end > Date()
    }
}
