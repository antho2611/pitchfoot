import Foundation
import Supabase

/// Même projet Supabase que le site web (src/integrations/supabase/client.ts) —
/// c'est ce qui permet à l'app native et au site de partager les mêmes comptes et données.
enum SupabaseConfig {
    static let url = URL(string: "https://xjnvxipdnhqnyvxqvohz.supabase.co")!
    static let publishableKey = "sb_publishable_5QdZaNPDSn7N6h9fmpcEog_g3J-B8BH"
}

let supabase = SupabaseClient(
    supabaseURL: SupabaseConfig.url,
    supabaseKey: SupabaseConfig.publishableKey
)
