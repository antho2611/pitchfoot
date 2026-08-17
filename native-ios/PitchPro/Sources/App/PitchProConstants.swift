import Foundation

/// Mêmes listes que src/lib/football.ts sur le site web.
enum PitchProConstants {
    static let positions = [
        "Gardien", "Latéral droit", "Latéral gauche", "Défenseur central",
        "Milieu défensif", "Milieu central", "Milieu offensif",
        "Ailier droit", "Ailier gauche", "Attaquant",
    ]

    static let levels = [
        "Ligue 1", "Ligue 2", "National", "National 2", "National 3",
        "Régional 1", "Régional 2", "Régional 3", "Départemental",
    ]

    static let availabilities: [(value: String, label: String)] = [
        ("recherche_club", "Recherche un club"),
        ("immediate", "Disponible immédiatement"),
        ("fin_saison", "Disponible en fin de saison"),
        ("essai", "Recherche un essai"),
        ("ouvert", "Ouvert aux propositions"),
    ]

    static let maxAges = [18, 21, 23, 25, 30, 35]
}
