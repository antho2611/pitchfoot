import Foundation
import Supabase

enum ClubsRepository {
    static func fetchAll() async throws -> [Club] {
        try await supabase
            .from("clubs")
            .select("id, name, city, country, championship, level, logo_url, is_verified")
            .order("created_at", ascending: false)
            .limit(50)
            .execute()
            .value
    }
}
