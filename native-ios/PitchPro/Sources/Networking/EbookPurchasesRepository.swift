import Foundation
import Supabase

private struct NewPurchase: Encodable {
    let ebook_id: String
    let user_id: String
    let amount_cents: Int
    let status: String
    let provider: String
}

private struct PurchaseId: Decodable {
    let id: String
}

/// Même logique que unlockEbook() dans src/lib/ebooks.ts : pas de vrai paiement
/// en ligne pour l'instant, le déblocage insère directement un achat "payé".
enum EbookPurchasesRepository {
    static func isOwned(ebookId: String, userId: String) async throws -> Bool {
        let rows: [PurchaseId] = try await supabase
            .from("ebook_purchases")
            .select("id")
            .eq("ebook_id", value: ebookId)
            .eq("user_id", value: userId)
            .eq("status", value: "paid")
            .execute()
            .value
        return !rows.isEmpty
    }

    static func unlock(ebookId: String, userId: String, amountCents: Int) async throws {
        let payload = NewPurchase(
            ebook_id: ebookId,
            user_id: userId,
            amount_cents: amountCents,
            status: "paid",
            provider: amountCents == 0 ? "gratuit" : "manuel"
        )
        try await supabase
            .from("ebook_purchases")
            .insert(payload)
            .execute()
    }
}
