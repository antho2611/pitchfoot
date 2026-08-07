import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { openConversation } from "@/lib/messaging";
import { SessionCard } from "@/components/SessionCard";
import { CoachReviews } from "@/components/CoachReviews";

export const Route = createFileRoute("/preparateurs/$id")({
  head: () => ({
    meta: [
      { title: "Fiche préparateur physique — PitchPro" },
      {
        name: "description",
        content:
          "Qualifications, spécialités, zone d'intervention et séances proposées par ce préparateur physique.",
      },
      { property: "og:title", content: "Fiche préparateur physique — PitchPro" },
      {
        property: "og:description",
        content: "Découvrez le profil complet et les séances de ce préparateur physique.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CoachDetail,
});

function CoachDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["preparateur", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("preparateurs")
        .select(
          "id, full_name, headline, bio, qualifications, specialties, price_info, photo_url, city, country, latitude, longitude, radius_km, website, is_premium, is_verified, views_count, created_at, updated_at",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Coordonnées réservées aux membres connectés.
  const { data: contactInfo } = useQuery({
    queryKey: ["preparateur-contact", id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("preparateurs")
        .select("contact_email, phone")
        .eq("id", id)
        .maybeSingle();
      return data;
    },
  });

  const { data: ads } = useQuery({
    queryKey: ["preparateur-annonces", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coach_annonces")
        .select("*")
        .eq("coach_id", id)
        .eq("status", "active")
        .order("session_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  async function contact() {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    try {
      await openConversation(user.id, id);
      navigate({ to: "/messages" });
    } catch {
      toast.error("Impossible d'ouvrir la conversation.");
    }
  }

  if (isLoading) {
    return (
      <PageShell>
        <p className="mx-auto max-w-7xl px-4 py-20 text-muted-foreground sm:px-6">Chargement…</p>
      </PageShell>
    );
  }

  if (!data) {
    return (
      <PageShell>
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <h1 className="font-display text-5xl uppercase">Profil introuvable</h1>
          <Link to="/preparateurs" className="mt-4 inline-block underline">
            Retour à la recherche
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="border-b border-border bg-card/50">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-end">
          <div className="size-32 shrink-0 overflow-hidden border-2 border-pitch bg-muted">
            {data.photo_url && (
              <img
                src={data.photo_url}
                alt={`Photo de ${data.full_name}`}
                className="size-full object-cover"
              />
            )}
          </div>
          <div className="flex-1">
            <p className="label-xs text-muted-foreground">Préparateur physique</p>
            <h1 className="font-display text-5xl uppercase leading-none">
              {data.full_name || "Préparateur"}
            </h1>
            <p className="mt-2 text-sm uppercase tracking-widest text-muted-foreground">
              {data.city ?? "Ville non renseignée"} · Rayon {data.radius_km} km
            </p>
            {data.headline && <p className="mt-3 max-w-2xl">{data.headline}</p>}
          </div>
          <button
            onClick={() => void contact()}
            className="bg-pitch px-6 py-3 font-display text-xl uppercase text-volt"
          >
            Contacter
          </button>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {data.bio && (
            <div>
              <h2 className="font-display text-3xl uppercase">Présentation</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{data.bio}</p>
            </div>
          )}
          {data.qualifications && (
            <div>
              <h2 className="font-display text-3xl uppercase">Qualifications & diplômes</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">
                {data.qualifications}
              </p>
            </div>
          )}
          <div>
            <h2 className="font-display text-3xl uppercase">Séances actives</h2>
            <div className="mt-4 space-y-3">
              {(ads ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">Aucune séance publiée actuellement.</p>
              )}
              {(ads ?? []).map((a) => (
                <SessionCard
                  key={a.id}
                  ad={a}
                  coach={{
                    id: data.id,
                    full_name: data.full_name,
                    photo_url: data.photo_url,
                    specialties: data.specialties,
                  }}
                  showCoachLink={false}
                />
              ))}
            </div>
          </div>

          <CoachReviews coachId={data.id} coachName={data.full_name || "ce préparateur"} />
        </div>


        <aside className="space-y-6">
          <div className="border border-border bg-card p-5">
            <p className="label-xs text-muted-foreground">Spécialités</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {(data.specialties ?? []).length === 0 && (
                <span className="text-sm text-muted-foreground">Non renseignées</span>
              )}
              {(data.specialties ?? []).map((s: string) => (
                <span key={s} className="bg-muted px-2 py-1 text-[11px] uppercase tracking-wide">
                  {s}
                </span>
              ))}
            </div>
          </div>
          {data.price_info && (
            <div className="border border-border bg-card p-5">
              <p className="label-xs text-muted-foreground">Tarif indicatif</p>
              <p className="mt-2 text-sm">{data.price_info}</p>
            </div>
          )}
          <div className="border border-border bg-card p-5 text-sm">
            <p className="label-xs text-muted-foreground">Contact</p>
            {contactInfo?.contact_email && (
              <p className="mt-2 break-all">{contactInfo.contact_email}</p>
            )}
            {contactInfo?.phone && <p className="mt-1">{contactInfo.phone}</p>}
            {!user && (
              <p className="label-xs mt-2 text-foreground/40">
                Connectez-vous pour voir les coordonnées.
              </p>
            )}
            {data.website && (
              <a href={data.website} className="mt-1 block break-all underline" rel="noreferrer">
                {data.website}
              </a>
            )}
          </div>
        </aside>
      </section>
    </PageShell>
  );
}
