import Foundation
import Supabase

private struct NewReservation: Encodable {
    let annonce_id: String
    let coach_id: String
    let player_id: String
    let message: String?
}

/// Le site web n'a jamais construit l'écran pour ça, mais la table et les
/// règles existent déjà côté base (public.coach_reservations) — on s'en sert.
enum CoachReservationsRepository {
    static func reserve(annonceId: String, coachId: String, playerId: String, message: String) async throws {
        let trimmed = message.trimmingCharacters(in: .whitespacesAndNewlines)
        let payload = NewReservation(
            annonce_id: annonceId,
            coach_id: coachId,
            player_id: playerId,
            message: trimmed.isEmpty ? nil : String(trimmed.prefix(1000))
        )
        try await supabase
            .from("coach_reservations")
            .insert(payload)
            .execute()
    }

    static func hasReservation(annonceId: String, playerId: String) async throws -> Bool {
        let rows: [ReservationId] = try await supabase
            .from("coach_reservations")
            .select("id")
            .eq("annonce_id", value: annonceId)
            .eq("player_id", value: playerId)
            .execute()
            .value
        return !rows.isEmpty
    }
}

private struct ReservationId: Decodable {
    let id: String
}
