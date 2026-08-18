import Foundation
import Supabase

private struct SubscriptionUpsert: Encodable {
    let user_id: String
    let plan: String
    let status: String
    let amount_cents: Int
    let currency: String
}

private struct CancelUpdate: Encodable {
    let status: String
    let cancel_at_period_end: Bool
}

/// Pas de paiement en ligne pour l'instant (voir premium.tsx) : "choisir un
/// plan" enregistre juste une demande "pending", activée manuellement par un
/// admin depuis la console (voir setSubStatus dans admin.tsx).
enum SubscriptionRepository {
    static func fetchMine(userId: String) async throws -> Subscription? {
        try await supabase
            .from("subscriptions")
            .select("plan, status, current_period_end")
            .eq("user_id", value: userId)
            .maybeSingle()
            .execute()
            .value
    }

    static func upsert(userId: String, planId: String, amountCents: Int) async throws {
        try await supabase
            .from("subscriptions")
            .upsert(
                SubscriptionUpsert(user_id: userId, plan: planId, status: "pending", amount_cents: amountCents, currency: "EUR"),
                onConflict: "user_id"
            )
            .execute()
    }

    static func cancel(userId: String) async throws {
        try await supabase
            .from("subscriptions")
            .update(CancelUpdate(status: "canceled", cancel_at_period_end: true))
            .eq("user_id", value: userId)
            .execute()
    }
}
