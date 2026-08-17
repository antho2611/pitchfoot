import Foundation
import Supabase

enum PlayersRepository {
    private static let listColumns =
        "id, first_name, last_name, main_position, city, country, current_club, photo_url, availability"
    private static let detailColumns = listColumns + ", bio, height_cm, weight_kg, level, championship, birth_date"

    static func fetchAll() async throws -> [Player] {
        try await supabase
            .from("players")
            .select(listColumns)
            .order("created_at", ascending: false)
            .limit(50)
            .execute()
            .value
    }

    static func fetchOne(id: String) async throws -> Player {
        try await supabase
            .from("players")
            .select(detailColumns)
            .eq("id", value: id)
            .single()
            .execute()
            .value
    }
}
