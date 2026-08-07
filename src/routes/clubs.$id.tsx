import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Globe, Mail, MapPin, Phone } from "lucide-react";
import { PageShell } from "@/components/layout/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/clubs/$id")({
  head: () => ({
    meta: [
      { title: "Fiche club — PitchPro" },
      { name: "description", content: "Présentation du club, niveau, stade et annonces en cours." },
      { property: "og:title", content: "Fiche club — PitchPro" },
      { property: "og:description", content: "Découvrez ce club et ses recrutements ouverts." },
    ],
  }),
  component: ClubDetail,
  errorComponent: () => (
    <PageShell>
      <p className="mx-auto max-w-3xl px-6 py-24 text-center">Club indisponible.</p>
    </PageShell>
  ),
  notFoundComponent: () => (
    <PageShell>
      <p className="mx-auto max-w-3xl px-6 py-24 text-center">Ce club n'existe pas.</p>
    </PageShell>
  ),
});

const CLUB_PUBLIC_COLUMNS =
  "id, name, logo_url, description, stadium, championship, level, city, country, website, social_links, history, is_verified, is_premium, created_at";

function ClubDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["club", id],
    queryFn: async () => {
      const [{ data: club, error }, { data: listings }] = await Promise.all([
        supabase.from("clubs").select(CLUB_PUBLIC_COLUMNS).eq("id", id).maybeSingle(),
        supabase
          .from("listings")
          .select("*")
          .eq("club_id", id)
          .eq("is_open", true)
          .order("created_at", { ascending: false }),
      ]);
      if (error) throw error;
      if (!club) throw notFound();
      return { club, listings: listings ?? [] };
    },
  });

  // Coordonnées réservées aux membres connectés.
  const { data: contact } = useQuery({
    queryKey: ["club-contact", id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("clubs")
        .select("contact_email, phone")
        .eq("id", id)
        .maybeSingle();
      return data;
    },
  });

  if (!data) {
    return (
      <PageShell>
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="h-72 animate-pulse bg-secondary" />
        </div>
      </PageShell>
    );
  }

  const { club, listings } = data;

  return (
    <PageShell>
      <section className="bg-pitch text-white">
        <div className="mx-auto grid max-w-5xl grid-cols-[auto_minmax(0,1fr)] items-center gap-6 px-4 py-12 sm:px-6">
          <div className="grid size-24 shrink-0 place-items-center bg-field">
            {club.logo_url ? (
              <img src={club.logo_url} alt={club.name} className="size-24 object-cover" />
            ) : (
              <span className="font-display text-4xl text-white/25">{club.name[0]}</span>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 font-display text-5xl uppercase leading-none">
              <span className="truncate">{club.name}</span>
              {club.is_verified && <BadgeCheck className="size-6 shrink-0 text-volt" />}
            </h1>
            <p className="mt-2 text-sm text-white/60">
              {[club.level, club.championship, club.city].filter(Boolean).join(" • ") ||
                "Informations à compléter"}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-8">
          <div>
            <h2 className="font-display text-4xl uppercase">Le club</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {club.description || "Aucune présentation renseignée."}
            </p>
          </div>
          {club.history && (
            <div>
              <h2 className="font-display text-4xl uppercase">Historique</h2>
              <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">
                {club.history}
              </p>
            </div>
          )}
          <div>
            <h2 className="font-display text-4xl uppercase">Annonces en cours</h2>
            {listings.length > 0 ? (
              <div className="mt-4 space-y-3">
                {listings.map((l) => (
                  <Link
                    key={l.id}
                    to="/annonces/$id"
                    params={{ id: l.id }}
                    className="block border border-border bg-card p-4 transition-colors hover:border-pitch"
                  >
                    <h3 className="font-display text-2xl uppercase">{l.title}</h3>
                    <p className="label-xs text-foreground/40">
                      {[l.position, l.level, l.city].filter(Boolean).join(" • ")}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Aucune annonce ouverte.</p>
            )}
          </div>
        </div>

        <aside className="space-y-3 border border-border bg-card p-5 text-sm">
          <h3 className="font-display text-2xl uppercase">Contact</h3>
          {club.stadium && (
            <p className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="size-4" /> {club.stadium}
            </p>
          )}
          {contact?.contact_email && (
            <p className="flex items-center gap-2 break-all text-muted-foreground">
              <Mail className="size-4 shrink-0" /> {contact.contact_email}
            </p>
          )}
          {contact?.phone && (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Phone className="size-4" /> {contact.phone}
            </p>
          )}
          {!user && (
            <p className="label-xs text-foreground/40">
              Connectez-vous pour voir les coordonnées du club.
            </p>
          )}
          {club.website && (
            <a
              href={club.website}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 break-all underline underline-offset-4"
            >
              <Globe className="size-4 shrink-0" /> {club.website}
            </a>
          )}
        </aside>
      </section>
    </PageShell>
  );
}
