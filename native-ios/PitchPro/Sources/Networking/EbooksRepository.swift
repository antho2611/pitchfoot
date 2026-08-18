import Foundation
import Supabase

enum EbooksRepository {
    private static let columns =
        "id, title, summary, category, price_cents, is_free, cover_url, preview_text, content_url"

    static func fetchPublished() async throws -> [Ebook] {
        try await supabase
            .from("ebooks")
            .select(columns)
            .eq("is_published", value: true)
            .order("is_free", ascending: false)
            .order("created_at", ascending: true)
            .execute()
            .value
    }
}
