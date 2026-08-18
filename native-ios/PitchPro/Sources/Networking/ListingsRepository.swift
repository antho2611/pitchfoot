import Foundation
import Supabase

enum ListingsRepository {
    private static let columns =
        "id, title, position, city, championship, level, is_open, club_id, description, season, min_age, max_age"

    static func fetchOpen() async throws -> [Listing] {
        try await supabase
            .from("listings")
            .select(columns)
            .eq("is_open", value: true)
            .order("created_at", ascending: false)
            .limit(50)
            .execute()
            .value
    }

    static func fetchOne(id: String) async throws -> Listing {
        try await supabase
            .from("listings")
            .select(columns)
            .eq("id", value: id)
            .single()
            .execute()
            .value
    }

    static func fetchOpenForClub(clubId: String) async throws -> [Listing] {
        try await supabase
            .from("listings")
            .select(columns)
            .eq("club_id", value: clubId)
            .eq("is_open", value: true)
            .order("created_at", ascending: false)
            .execute()
            .value
    }
}
