import Foundation
import Supabase

private struct ReadUpdate: Encodable { let is_read: Bool }

/// La RLS (notif_read_own) restreint déjà tout aux notifications de
/// l'utilisateur connecté — pas besoin de filtrer par user_id ici.
enum NotificationsRepository {
    static func fetchAll() async throws -> [AppNotification] {
        try await supabase
            .from("notifications")
            .select("*")
            .order("created_at", ascending: false)
            .limit(100)
            .execute()
            .value
    }

    static func unreadCount() async throws -> Int {
        let count = try await supabase
            .from("notifications")
            .select("id", head: true, count: .exact)
            .eq("is_read", value: false)
            .execute()
            .count
        return count ?? 0
    }

    static func markRead(id: String) async throws {
        try await supabase
            .from("notifications")
            .update(ReadUpdate(is_read: true))
            .eq("id", value: id)
            .execute()
    }

    static func markAllRead() async throws {
        try await supabase
            .from("notifications")
            .update(ReadUpdate(is_read: true))
            .eq("is_read", value: false)
            .execute()
    }
}
