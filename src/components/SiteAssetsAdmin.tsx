import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageIcon, RotateCcw, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getSiteAsset } from "@/lib/site-assets.functions";
import defaultHero from "@/assets/hero-player.jpg";

const HERO_KEY = "home_hero";
const DEFAULT_ALT = "Joueur de football amateur en pleine accélération sur un terrain éclairé";

export function SiteAssetsAdmin({ adminId }: { adminId: string }) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [alt, setAlt] = useState("");

  const { data: asset } = useQuery({
    queryKey: ["site-asset", HERO_KEY],
    queryFn: () => getSiteAsset({ data: { key: HERO_KEY } }),
  });

  useEffect(() => {
    if (asset) setAlt(asset.alt ?? "");
  }, [asset]);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["site-asset", HERO_KEY] });
  }

  async function upload(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Choisis un fichier image (JPG, PNG ou WebP).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image trop lourde (8 Mo maximum).");
      return;
    }
    setUploading(true);
    try {
      const path = `${adminId}/site/${HERO_KEY}-${Date.now()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("media").upload(path, file, {
        contentType: file.type,
      });
      if (upErr) throw upErr;

      const { error } = await supabase.from("site_assets").upsert({
        key: HERO_KEY,
        storage_path: path,
        alt_text: alt.trim() || DEFAULT_ALT,
      });
      if (error) throw error;

      await refresh();
      toast.success("Photo de la page d'accueil mise à jour.");
    } catch {
      toast.error("Téléversement impossible.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function saveAlt() {
    const { error } = await supabase
      .from("site_assets")
      .upsert({ key: HERO_KEY, alt_text: alt.trim() || DEFAULT_ALT });
    if (error) {
      toast.error("Enregistrement impossible.");
      return;
    }
    await refresh();
    toast.success("Texte alternatif enregistré.");
  }

  async function reset() {
    const { error } = await supabase.from("site_assets").delete().eq("key", HERO_KEY);
    if (error) {
      toast.error("Réinitialisation impossible.");
      return;
    }
    setAlt("");
    await refresh();
    toast.success("Image par défaut rétablie.");
  }

  const preview = asset?.url ?? defaultHero;

  return (
    <div className="mt-12 border border-border bg-card p-5">
      <h2 className="flex items-center gap-2 font-display text-3xl uppercase">
        <ImageIcon className="size-5" /> Illustrations
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Photo affichée dans le bandeau de la page d'accueil.
      </p>

      <div className="mt-5 grid gap-5 md:grid-cols-[280px_1fr]">
        <img
          src={preview}
          alt={asset?.alt ?? DEFAULT_ALT}
          className="h-44 w-full border border-border object-cover"
        />

        <div className="space-y-3">
          <div>
            <label className="label-xs text-muted-foreground" htmlFor="hero-alt">
              Texte alternatif
            </label>
            <input
              id="hero-alt"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder={DEFAULT_ALT}
              maxLength={160}
              className="mt-1 w-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-pitch"
            />
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
            }}
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 bg-pitch px-4 py-2 font-display text-lg uppercase text-volt disabled:opacity-50"
            >
              <Upload className="size-4" />
              {uploading ? "Envoi…" : "Changer la photo"}
            </button>
            <button
              type="button"
              onClick={() => void saveAlt()}
              className="border-2 border-pitch px-4 py-2 font-display text-lg uppercase"
            >
              Enregistrer le texte
            </button>
            <button
              type="button"
              onClick={() => void reset()}
              className="inline-flex items-center gap-2 border border-border px-4 py-2 font-display text-lg uppercase text-muted-foreground"
            >
              <RotateCcw className="size-4" /> Image par défaut
            </button>
          </div>

          <p className="label-xs text-foreground/40">JPG, PNG ou WebP — 8 Mo maximum.</p>
        </div>
      </div>
    </div>
  );
}
