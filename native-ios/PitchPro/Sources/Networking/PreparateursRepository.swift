import Foundation
import Supabase

enum PreparateursRepository {
    static func fetchAll() async throws -> [Preparateur] {
        try await supabase
            .from("preparateurs")
            .select("id, full_name, headline, city, country, photo_url, is_verified")
            .order("created_at", ascending: false)
            .limit(50)
            .execute()
            .value
    }
}
