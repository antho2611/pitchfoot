import Foundation
import Supabase

enum PlayersRepository {
    private static let listColumns =
        "id, first_name, last_name, main_position, city, country, current_club, photo_url, availability, birth_date, is_premium"
    private static let detailColumns = listColumns + ", bio, height_cm, weight_kg, level, championship"

    static func fetchAll(filters: PlayerFilters = PlayerFilters()) async throws -> [Player] {
        var query = supabase
            .from("players")
            .select(listColumns)

        let q = filters.query.trimmingCharacters(in: .whitespacesAndNewlines)
        if !q.isEmpty {
            let term = "%\(q)%"
            query = query.or("first_name.ilike.\(term),last_name.ilike.\(term),current_club.ilike.\(term)")
        }
        if !filters.position.isEmpty {
            query = query.eq("main_position", value: filters.position)
        }
        if !filters.level.isEmpty {
            query = query.eq("level", value: filters.level)
        }
        let city = filters.city.trimmingCharacters(in: .whitespacesAndNewlines)
        if !city.isEmpty {
            query = query.ilike("city", pattern: "%\(city)%")
        }
        if !filters.availability.isEmpty {
            query = query.eq("availability", value: filters.availability)
        }
        if let maxAge = Int(filters.maxAge) {
            let calendar = Calendar(identifier: .gregorian)
            let minBirthDate = calendar.date(byAdding: .year, value: -maxAge, to: Date()) ?? Date()
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd"
            query = query.gte("birth_date", value: formatter.string(from: minBirthDate))
        }

        return try await query
            .order("created_at", ascending: false)
            .limit(60)
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
