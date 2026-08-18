import Foundation
import Supabase

private struct StatusUpdate: Encodable { let status: String }

enum ProfileRepository {
    static func fetchMine(userId: String) async throws -> AccountProfile {
        try await supabase
            .from("profiles")
            .select("account_type, display_name")
            .eq("id", value: userId)
            .single()
            .execute()
            .value
    }
}

/// Requêtes propres au tableau de bord — équivalent de tableau-de-bord.tsx.
/// Les jointures (nom de club, titre d'annonce...) se font côté client par
/// des requêtes séparées + correspondance par id, comme MessagingRepository,
/// plutôt que par des embeds Postgrest.
enum DashboardRepository {
    static func applicationsForPlayer(playerId: String) async throws -> [Application] {
        try await supabase
            .from("applications")
            .select("*")
            .eq("player_id", value: playerId)
            .order("created_at", ascending: false)
            .execute()
            .value
    }

    static func applicationsForClub(clubId: String) async throws -> [Application] {
        try await supabase
            .from("applications")
            .select("*")
            .eq("club_id", value: clubId)
            .order("created_at", ascending: false)
            .execute()
            .value
    }

    static func listingsForClub(clubId: String) async throws -> [Listing] {
        try await supabase
            .from("listings")
            .select("id, title, position, city, championship, level, is_open, club_id, description, season, min_age, max_age")
            .eq("club_id", value: clubId)
            .order("created_at", ascending: false)
            .execute()
            .value
    }

    static func savedPlayersForClub(clubId: String) async throws -> [SavedPlayer] {
        try await supabase
            .from("saved_players")
            .select("id, club_id, player_id")
            .eq("club_id", value: clubId)
            .execute()
            .value
    }

    static func profileViewsCount(playerId: String) async throws -> Int {
        let count = try await supabase
            .from("profile_views")
            .select("id", head: true, count: .exact)
            .eq("player_id", value: playerId)
            .execute()
            .count
        return count ?? 0
    }

    static func savedCountForPlayer(playerId: String) async throws -> Int {
        let count = try await supabase
            .from("saved_players")
            .select("id", head: true, count: .exact)
            .eq("player_id", value: playerId)
            .execute()
            .count
        return count ?? 0
    }

    static func setApplicationStatus(id: String, status: String) async throws {
        try await supabase
            .from("applications")
            .update(StatusUpdate(status: status))
            .eq("id", value: id)
            .execute()
    }
}
