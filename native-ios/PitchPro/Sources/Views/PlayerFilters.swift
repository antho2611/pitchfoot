import Foundation

/// Mêmes filtres que la recherche joueurs du site (hors filtres avancés Premium :
/// pied fort, taille min., expérience min. — non repris ici pour l'instant).
struct PlayerFilters: Hashable {
    var query = ""
    var position = ""
    var level = ""
    var city = ""
    var availability = ""
    var maxAge = ""

    var isActive: Bool {
        self != PlayerFilters()
    }
}
