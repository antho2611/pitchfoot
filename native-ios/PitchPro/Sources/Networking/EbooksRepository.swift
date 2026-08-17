import Foundation
import Supabase

enum EbooksRepository {
    static func fetchPublished() async throws -> [Ebook] {
        try await supabase
            .from("ebooks")
            .select("id, title, summary, category, price_cents, is_free, cover_url")
            .eq("is_published", value: true)
            .order("is_free", ascending: false)
            .order("created_at", ascending: true)
            .execute()
            .value
    }
}
