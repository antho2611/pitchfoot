import Foundation
import Supabase

enum CoachAnnoncesRepository {
    static func fetchAll() async throws -> [CoachAnnonce] {
        try await supabase
            .from("coach_annonces")
            .select("id, title, city, location, session_date, start_time, status")
            .order("session_date", ascending: true)
            .limit(50)
            .execute()
            .value
    }
}
