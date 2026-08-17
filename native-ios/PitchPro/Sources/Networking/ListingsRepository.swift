import Foundation
import Supabase

enum ListingsRepository {
    static func fetchOpen() async throws -> [Listing] {
        try await supabase
            .from("listings")
            .select("id, title, position, city, championship, level, is_open")
            .eq("is_open", value: true)
            .order("created_at", ascending: false)
            .limit(50)
            .execute()
            .value
    }
}
