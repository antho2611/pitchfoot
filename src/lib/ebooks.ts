import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import reprise from "@/assets/ebook-reprise.jpg";
import prevention from "@/assets/ebook-prevention.jpg";
import mental from "@/assets/ebook-mental.jpg";
import gardien from "@/assets/ebook-gardien.jpg";
import lateral from "@/assets/ebook-lateral.jpg";
import carriere from "@/assets/ebook-carriere.jpg";

export const EBOOK_CATEGORIES = [
  "Préparation physique",
  "Préparation mentale",
  "Technique par poste",
  "Carrière",
] as const;

export const formatPrice = (cents: number) =>
  cents === 0 ? "Gratuit" : `${(cents / 100).toFixed(2).replace(".", ",")} €`;

/** Ebooks déjà débloqués par l'utilisateur (achat ou téléchargement gratuit). */
export function useLibrary() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["ebook-library", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ebook_purchases")
        .select("*, ebook:ebooks(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Débloque un ebook pour l'utilisateur courant (gratuit ou payant). */
export async function unlockEbook(params: {
  ebookId: string;
  userId: string;
  amountCents: number;
}) {
  const { error } = await supabase.from("ebook_purchases").insert({
    ebook_id: params.ebookId,
    user_id: params.userId,
    amount_cents: params.amountCents,
    status: "paid",
    provider: params.amountCents === 0 ? "gratuit" : "manuel",
  });
  if (error && error.code !== "23505") throw error;
}

const COVERS: Record<string, string> = {
  "reprise-athletique-4-semaines": reprise,
  "prevention-blessures-footballeur": prevention,
  "preparation-mentale-jouer-sans-pression": mental,
  "guide-gardien-moderne": gardien,
  "lateral-moderne": lateral,
  "bien-demarrer-recherche-club": carriere,
};

/** Couverture stockée en base, sinon visuel par défaut du catalogue. */
export const coverFor = (e: { slug: string; cover_url?: string | null }) =>
  e.cover_url || COVERS[e.slug] || null;
