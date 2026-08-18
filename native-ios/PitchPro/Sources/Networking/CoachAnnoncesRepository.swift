import Foundation
import Supabase

enum CoachAnnoncesRepository {
    private static let columns =
        "id, title, city, location, session_date, start_time, end_time, status, description, price_info, capacity, reserved_count, coach_id"

    static func fetchAll() async throws -> [CoachAnnonce] {
        try await supabase
            .from("coach_annonces")
            .select(columns)
            .order("session_date", ascending: true)
            .limit(50)
            .execute()
            .value
    }

    static func fetchForCoach(coachId: String) async throws -> [CoachAnnonce] {
        try await supabase
            .from("coach_annonces")
            .select(columns)
            .eq("coach_id", value: coachId)
            .eq("status", value: "active")
            .order("session_date", ascending: true)
            .execute()
            .value
    }
}
