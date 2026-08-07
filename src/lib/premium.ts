import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type PlanId = "player_premium" | "club_premium" | "coach_premium";

export const FREE_SEARCH_QUOTA = 5;

export const PLANS: Record<
  PlanId,
  {
    id: PlanId;
    audience: "player" | "club" | "coach";
    name: string;
    priceLabel: string;
    amountCents: number;
    features: string[];
  }
> = {
  player_premium: {
    id: "player_premium",
    audience: "player",
    name: "Premium Joueur",
    priceLabel: "5 € / mois",
    amountCents: 500,
    features: [
      "Profil mis en avant en tête des recherches",
      "Badge Premium sur votre fiche",
      "Statistiques de vues détaillées",
      "Candidatures illimitées aux annonces",
    ],
  },
  club_premium: {
    id: "club_premium",
    audience: "club",
    name: "Premium Club",
    priceLabel: "450 € / mois",
    amountCents: 45000,
    features: [
      "Recherches de joueurs illimitées",
      "Filtres avancés (âge, taille, pied fort, expérience)",
      "Export des profils au format CSV",
      "Annonces mises en avant et badge club vérifié",
    ],
  },
  coach_premium: {
    id: "coach_premium",
    audience: "coach",
    name: "Premium Préparateur",
    priceLabel: "19 € / mois",
    amountCents: 1900,
    features: [
      "Fiche mise en avant dans la recherche de préparateurs",
      "Annonces de séances illimitées",
      "Badge Premium sur votre fiche professionnelle",
      "Statistiques de vues et de contacts",
    ],
  },
};

export function planForAccount(accountType?: string | null): PlanId {
  if (accountType === "club") return "club_premium";
  if (accountType === "coach") return "coach_premium";
  return "player_premium";
}

export function useSubscription() {
  const { user, accountType } = useAuth();

  const query = useQuery({
    queryKey: ["subscription", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const sub = query.data;
  const isPremium =
    !!sub &&
    (sub.status === "active" || sub.status === "trialing") &&
    (!sub.current_period_end || new Date(sub.current_period_end) > new Date());

  return {
    subscription: sub ?? null,
    isPremium,
    isLoading: query.isLoading,
    plan: PLANS[planForAccount(accountType)],
    accountType,
    refetch: query.refetch,
  };
}

export function useSearchUsage() {
  const { user } = useAuth();
  const period = new Date();
  const periodKey = `${period.getUTCFullYear()}-${String(period.getUTCMonth() + 1).padStart(2, "0")}-01`;

  return useQuery({
    queryKey: ["search-usage", user?.id, periodKey],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("search_usage")
        .select("search_count")
        .eq("user_id", user!.id)
        .eq("period", periodKey)
        .maybeSingle();
      if (error) throw error;
      return data?.search_count ?? 0;
    },
  });
}

export async function registerSearch() {
  const { data, error } = await supabase.rpc("register_search");
  if (error) throw error;
  return data as number;
}

export function toCsv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) =>
    `"${String(v ?? "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
