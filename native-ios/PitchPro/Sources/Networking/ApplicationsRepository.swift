import Foundation
import Supabase

private struct NewApplication: Encodable {
    let listing_id: String
    let club_id: String
    let player_id: String
    let message: String?
}

enum ApplicationsRepository {
    /// Même logique que apply() dans src/routes/annonces.$id.tsx.
    static func apply(listingId: String, clubId: String, playerId: String, message: String) async throws {
        let trimmed = message.trimmingCharacters(in: .whitespacesAndNewlines)
        let payload = NewApplication(
            listing_id: listingId,
            club_id: clubId,
            player_id: playerId,
            message: trimmed.isEmpty ? nil : String(trimmed.prefix(1000))
        )
        try await supabase
            .from("applications")
            .insert(payload)
            .execute()
    }
}
