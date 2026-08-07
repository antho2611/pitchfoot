import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { getEbookDownloadUrl } from "@/lib/ebooks.functions";

type Props = {
  ebook: { id: string; content_path?: string | null; content_url?: string | null };
  className?: string;
};

/** Téléchargement sécurisé : lien signé temporaire généré après vérification de l'achat. */
export function EbookDownloadButton({ ebook, className }: Props) {
  const getUrl = useServerFn(getEbookDownloadUrl);
  const [busy, setBusy] = useState(false);

  const cls =
    className ??
    "inline-flex items-center justify-center gap-2 bg-pitch px-4 py-3 font-display text-xl uppercase text-volt disabled:opacity-50";

  if (!ebook.content_path && !ebook.content_url) {
    return <span className="label-xs text-muted-foreground">Fichier bientôt disponible.</span>;
  }

  if (!ebook.content_path && ebook.content_url) {
    return (
      <a href={ebook.content_url} target="_blank" rel="noreferrer" className={cls}>
        <Download className="size-4" /> Télécharger
      </a>
    );
  }

  async function download() {
    setBusy(true);
    try {
      const res = await getUrl({ data: { ebookId: ebook.id } });
      window.open(res.url, "_blank", "noopener");
    } catch {
      toast.error("Téléchargement impossible pour le moment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button onClick={() => void download()} disabled={busy} className={cls}>
      <Download className="size-4" /> {busy ? "Préparation…" : "Télécharger"}
    </button>
  );
}
