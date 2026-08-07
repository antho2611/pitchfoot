import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BookOpen, Sparkles } from "lucide-react";
import { PageShell } from "@/components/layout/Shell";
import { supabase } from "@/integrations/supabase/client";
import { EBOOK_CATEGORIES, coverFor, formatPrice, useLibrary } from "@/lib/ebooks";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/ebooks/")({
  head: () => ({
    meta: [
      { title: "Ebooks football — Préparation, mental, technique | PitchPro" },
      {
        name: "description",
        content:
          "Guides pratiques pour joueurs et coachs : préparation physique, préparation mentale, technique par poste. 10 € l'unité, un guide offert.",
      },
      { property: "og:title", content: "Ebooks football — PitchPro" },
      {
        property: "og:description",
        content: "Guides pratiques pour progresser : physique, mental, technique par poste.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EbooksPage,
});

function EbooksPage() {
  const { user } = useAuth();
  const [category, setCategory] = useState<string>("");
  const { data: library } = useLibrary();
  const owned = new Set((library ?? []).map((p) => p.ebook_id));

  const { data, isLoading } = useQuery({
    queryKey: ["ebooks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ebooks")
        .select("*")
        .eq("is_published", true)
        .order("is_free", { ascending: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const items = (data ?? []).filter((e) => !category || e.category === category);

  return (
    <PageShell>
      <section className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <p className="label-xs text-muted-foreground">Ressources</p>
          <h1 className="font-display text-5xl uppercase leading-none sm:text-6xl">Ebooks</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Des guides courts et actionnables écrits pour le football amateur et semi-pro. 10 € le
            guide, achat à l'unité — et un guide offert à tous les membres.
          </p>
          {user && (
            <Link
              to="/bibliotheque"
              className="label-xs mt-4 inline-flex items-center gap-2 underline underline-offset-4"
            >
              <BookOpen className="size-4" /> Ma bibliothèque
            </Link>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategory("")}
            className={`label-xs border px-3 py-2 ${!category ? "border-pitch bg-pitch text-volt" : "border-border bg-card"}`}
          >
            Tous les thèmes
          </button>
          {EBOOK_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`label-xs border px-3 py-2 ${category === c ? "border-pitch bg-pitch text-volt" : "border-border bg-card"}`}
            >
              {c}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="mt-10 text-sm text-muted-foreground">Chargement…</p>
        ) : items.length === 0 ? (
          <p className="mt-10 border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Aucun ebook dans ce thème pour le moment.
          </p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((e) => (
              <Link
                key={e.id}
                to="/ebooks/$slug"
                params={{ slug: e.slug }}
                className={`group flex flex-col border bg-card transition-colors ${e.is_free ? "border-pitch" : "border-border hover:border-pitch"}`}
              >
                <div className="relative aspect-[3/2] overflow-hidden bg-muted">
                  {coverFor(e) ? (
                    <img
                      src={coverFor(e)!}
                      alt={`Couverture de ${e.title}`}
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="grid size-full place-items-center bg-pitch/5">
                      <BookOpen className="size-10 text-pitch/40" />
                    </div>
                  )}
                  {e.is_free && (
                    <span className="absolute left-0 top-0 inline-flex items-center gap-1 bg-volt px-2 py-1 text-[11px] font-black uppercase tracking-wide text-pitch">
                      <Sparkles className="size-3" /> Gratuit
                    </span>
                  )}
                  {owned.has(e.id) && (
                    <span className="absolute right-0 top-0 bg-pitch px-2 py-1 text-[11px] font-black uppercase tracking-wide text-volt">
                      Dans ma bibliothèque
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <span className="label-xs text-muted-foreground">{e.category}</span>
                  <h2 className="mt-1 font-display text-2xl uppercase leading-tight">{e.title}</h2>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{e.summary}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-display text-2xl">{formatPrice(e.price_cents)}</span>
                    <span className="label-xs underline underline-offset-4">Voir le guide</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
