import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { BookOpen, Sparkles } from "lucide-react";
import { PageShell } from "@/components/layout/Shell";
import { EbookDownloadButton } from "@/components/EbookDownloadButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { coverFor, formatPrice, unlockEbook, useLibrary } from "@/lib/ebooks";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/ebooks/$slug")({
  head: () => ({
    meta: [
      { title: "Ebook football — Guide pratique | PitchPro" },
      {
        name: "description",
        content:
          "Description complète, aperçu et téléchargement de ce guide PitchPro dédié au football amateur et semi-professionnel.",
      },
      { property: "og:title", content: "Ebook football — PitchPro" },
      {
        property: "og:description",
        content: "Découvrez le contenu de ce guide et débloquez-le depuis votre compte.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EbookDetail,
});

function EbookDetail() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["ebook", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ebooks")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: library, refetch } = useLibrary();
  const owned = !!data && (library ?? []).some((p) => p.ebook_id === data.id);

  async function unlock() {
    if (!user || !data) return;
    setBusy(true);
    try {
      await unlockEbook({ ebookId: data.id, userId: user.id, amountCents: data.price_cents });
      await refetch();
      toast.success(
        data.is_free
          ? "Guide ajouté à votre bibliothèque."
          : "Guide débloqué dans votre bibliothèque.",
      );
    } catch {
      toast.error("Impossible de débloquer ce guide.");
    } finally {
      setBusy(false);
      setConfirm(false);
    }
  }

  function handleClick() {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    if (data?.is_free) void unlock();
    else setConfirm(true);
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
          <h1 className="font-display text-5xl uppercase">Ebook introuvable</h1>
          <Link to="/ebooks" className="mt-4 inline-block underline">
            Retour aux ebooks
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div>
          <Link
            to="/ebooks"
            className="label-xs text-muted-foreground underline underline-offset-4"
          >
            ← Tous les ebooks
          </Link>
          <p className="label-xs mt-6 text-muted-foreground">{data.category}</p>
          <h1 className="font-display text-5xl uppercase leading-none">{data.title}</h1>
          {data.is_free && (
            <span className="mt-3 inline-flex items-center gap-1 bg-volt px-2 py-1 text-[11px] font-black uppercase tracking-wide text-pitch">
              <Sparkles className="size-3" /> Gratuit pour les membres
            </span>
          )}
          <p className="mt-4 text-base">{data.summary}</p>
          <p className="mt-6 whitespace-pre-line text-sm leading-relaxed">{data.description}</p>

          {data.preview_text && (
            <div className="mt-8 border-l-2 border-pitch bg-card p-5">
              <p className="label-xs text-muted-foreground">Aperçu</p>
              <p className="mt-2 text-sm italic">{data.preview_text}</p>
            </div>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="aspect-[3/2] overflow-hidden border border-border bg-muted">
            {coverFor(data) ? (
              <img
                src={coverFor(data)!}
                alt={`Couverture de ${data.title}`}
                className="size-full object-cover"
              />
            ) : (
              <div className="grid size-full place-items-center bg-pitch/5">
                <BookOpen className="size-12 text-pitch/40" />
              </div>
            )}
          </div>
          <div className="border border-border bg-card p-5">
            <p className="font-display text-4xl">{formatPrice(data.price_cents)}</p>
            <p className="label-xs mt-1 text-muted-foreground">
              {data.is_free ? "Réservé aux membres inscrits" : "Achat à l'unité, paiement unique"}
            </p>

            {owned ? (
              <div className="mt-4 space-y-3">
                <p className="label-xs text-pitch">Déjà dans votre bibliothèque</p>
                <EbookDownloadButton
                  ebook={data}
                  className="flex w-full items-center justify-center gap-2 bg-pitch px-4 py-3 font-display text-xl uppercase text-volt disabled:opacity-50"
                />
                <Link to="/bibliotheque" className="label-xs block underline underline-offset-4">
                  Ouvrir ma bibliothèque
                </Link>
              </div>
            ) : (
              <button
                onClick={handleClick}
                disabled={busy}
                className="mt-4 w-full bg-volt px-4 py-3 font-display text-xl uppercase text-pitch disabled:opacity-50"
              >
                {data.is_free ? "Télécharger gratuitement" : "Acheter — 10 €"}
              </button>
            )}
            {!user && (
              <p className="label-xs mt-3 text-muted-foreground">
                Connexion requise pour accéder aux guides.
              </p>
            )}
          </div>
        </aside>
      </section>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l'achat</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point d'acheter « {data.title} » pour {formatPrice(data.price_cents)}
              . Le guide sera ajouté à votre bibliothèque.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => void unlock()} disabled={busy}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
