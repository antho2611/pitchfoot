import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { notify } from "@/lib/messaging";

export const Route = createFileRoute("/annonces/$id")({
  head: () => ({
    meta: [
      { title: "Annonce de recrutement — PitchPro" },
      { name: "description", content: "Détail de l'annonce et candidature en un clic." },
      { property: "og:title", content: "Annonce de recrutement — PitchPro" },
      { property: "og:description", content: "Postulez directement auprès du club." },
    ],
  }),
  component: ListingDetail,
  errorComponent: () => (
    <PageShell>
      <p className="mx-auto max-w-3xl px-6 py-24 text-center">Annonce indisponible.</p>
    </PageShell>
  ),
  notFoundComponent: () => (
    <PageShell>
      <p className="mx-auto max-w-3xl px-6 py-24 text-center">Cette annonce n'existe pas.</p>
    </PageShell>
  ),
});

function ListingDetail() {
  const { id } = Route.useParams();
  const { user, accountType } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const { data } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*, clubs(id, name, logo_url, city, level)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  if (!data) {
    return (
      <PageShell>
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="h-72 animate-pulse bg-secondary" />
        </div>
      </PageShell>
    );
  }

  async function apply() {
    if (!user) return navigate({ to: "/auth" });
    const { error } = await supabase.from("applications").insert({
      listing_id: data!.id,
      club_id: data!.club_id,
      player_id: user.id,
      message: message.trim().slice(0, 1000) || null,
    });
    if (error) {
      toast.error("Candidature impossible (déjà envoyée ?).");
      return;
    }
    await notify(
      data!.club_id,
      "application",
      "Nouvelle candidature",
      `Un joueur a postulé à « ${data!.title} ».`,
      "/tableau-de-bord",
    );
    setSent(true);
    toast.success("Candidature envoyée !");
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <Link to="/annonces" className="label-xs underline underline-offset-4">
          ← Toutes les annonces
        </Link>
        <h1 className="mt-4 font-display text-6xl uppercase leading-none">{data.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          <Link
            to="/clubs/$id"
            params={{ id: data.club_id }}
            className="underline underline-offset-4"
          >
            {data.clubs?.name ?? "Club"}
          </Link>{" "}
          • {[data.level, data.championship, data.city].filter(Boolean).join(" • ")}
        </p>

        <div className="mt-8 grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
          {[
            { l: "Poste", v: data.position ?? "—" },
            { l: "Âge", v: `${data.min_age ?? "—"} - ${data.max_age ?? "—"}` },
            { l: "Saison", v: data.season ?? "—" },
            { l: "Statut", v: data.is_open ? "Ouverte" : "Fermée" },
          ].map((i) => (
            <div key={i.l} className="bg-card p-4">
              <p className="label-xs text-foreground/40">{i.l}</p>
              <p className="font-display text-xl uppercase">{i.v}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {data.description || "Aucune description fournie."}
        </p>

        {data.is_open && accountType !== "club" && (
          <div className="mt-10 border border-pitch/10 bg-card p-6">
            <h2 className="font-display text-3xl uppercase">Postuler</h2>
            {sent ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Votre candidature a bien été transmise au club.
              </p>
            ) : (
              <>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder="Message de motivation (optionnel)"
                  className="mt-3 w-full border border-border bg-background p-3 text-sm outline-none focus:border-pitch"
                />
                <button
                  onClick={apply}
                  className="mt-3 bg-pitch px-6 py-3 font-display text-xl uppercase text-volt"
                >
                  Envoyer ma candidature
                </button>
              </>
            )}
          </div>
        )}
      </section>
    </PageShell>
  );
}
