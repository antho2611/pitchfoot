import Foundation
import Supabase

enum ClubsRepository {
    private static let columns =
        "id, name, city, country, championship, level, logo_url, is_verified, description, stadium"

    static func fetchAll() async throws -> [Club] {
        try await supabase
            .from("clubs")
            .select(columns)
            .order("created_at", ascending: false)
            .limit(50)
            .execute()
            .value
    }

    static func fetchMany(ids: [String]) async throws -> [Club] {
        guard !ids.isEmpty else { return [] }
        return try await supabase
            .from("clubs")
            .select(columns)
            .in("id", values: ids)
            .execute()
            .value
    }

    static func fetchOne(id: String) async throws -> Club {
        try await supabase
            .from("clubs")
            .select(columns)
            .eq("id", value: id)
            .single()
            .execute()
            .value
    }
}
