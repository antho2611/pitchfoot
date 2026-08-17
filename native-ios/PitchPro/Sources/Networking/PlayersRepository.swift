import Foundation
import Supabase

enum PlayersRepository {
    static func fetchAll() async throws -> [Player] {
        try await supabase
            .from("players")
            .select("id, first_name, last_name, main_position, city, country, current_club, photo_url, availability")
            .order("created_at", ascending: false)
            .limit(50)
            .execute()
            .value
    }
}
