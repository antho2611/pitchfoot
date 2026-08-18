import Foundation
import Supabase

enum PreparateursRepository {
    private static let columns =
        "id, full_name, headline, city, country, photo_url, is_verified, bio, qualifications, specialties, price_info"

    static func fetchAll() async throws -> [Preparateur] {
        try await supabase
            .from("preparateurs")
            .select(columns)
            .order("created_at", ascending: false)
            .limit(50)
            .execute()
            .value
    }

    static func fetchOne(id: String) async throws -> Preparateur {
        try await supabase
            .from("preparateurs")
            .select(columns)
            .eq("id", value: id)
            .single()
            .execute()
            .value
    }
}
