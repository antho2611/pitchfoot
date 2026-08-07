import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { PageShell } from "@/components/layout/Shell";
import { EbookDownloadButton } from "@/components/EbookDownloadButton";
import { coverFor, formatPrice, useLibrary } from "@/lib/ebooks";

export const Route = createFileRoute("/_authenticated/bibliotheque")({
  head: () => ({
    meta: [
      { title: "Ma bibliothèque — Mes ebooks | PitchPro" },
      {
        name: "description",
        content: "Retrouvez tous les ebooks PitchPro que vous avez achetés ou téléchargés.",
      },
      { property: "og:title", content: "Ma bibliothèque — PitchPro" },
      { property: "og:description", content: "Vos guides PitchPro, disponibles à tout moment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const { data, isLoading } = useLibrary();

  return (
    <PageShell>
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <p className="label-xs text-muted-foreground">Mon compte</p>
        <h1 className="font-display text-5xl uppercase leading-none">Ma bibliothèque</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Vos guides restent accessibles ici à tout moment.
        </p>

        {isLoading ? (
          <p className="mt-10 text-sm text-muted-foreground">Chargement…</p>
        ) : (data ?? []).length === 0 ? (
          <div className="mt-10 border border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">Votre bibliothèque est vide.</p>
            <Link
              to="/ebooks"
              className="mt-4 inline-block bg-pitch px-5 py-3 font-display text-xl uppercase text-volt"
            >
              Découvrir les ebooks
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {(data ?? []).map((p) => {
              const e = p.ebook;
              if (!e) return null;
              return (
                <div
                  key={p.id}
                  className="grid grid-cols-[80px_minmax(0,1fr)] gap-4 border border-border bg-card p-4 sm:grid-cols-[120px_minmax(0,1fr)_auto] sm:items-center"
                >
                  <div className="aspect-[3/4] overflow-hidden bg-muted sm:aspect-[3/2]">
                    {coverFor(e) ? (
                      <img
                        src={coverFor(e)!}
                        alt={`Couverture de ${e.title}`}
                        loading="lazy"
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="grid size-full place-items-center bg-pitch/5">
                        <BookOpen className="size-6 text-pitch/40" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="label-xs text-muted-foreground">{e.category}</span>
                    <Link
                      to="/ebooks/$slug"
                      params={{ slug: e.slug }}
                      className="mt-1 block font-display text-2xl uppercase leading-tight"
                    >
                      {e.title}
                    </Link>
                    <p className="label-xs mt-1 text-muted-foreground">
                      {formatPrice(p.amount_cents)} ·{" "}
                      {new Date(p.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <EbookDownloadButton
                      ebook={e}
                      className="inline-flex items-center gap-2 bg-pitch px-4 py-2 font-display text-lg uppercase text-volt disabled:opacity-50"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </PageShell>
  );
}
