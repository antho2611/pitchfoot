import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileText, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EBOOK_CATEGORIES, formatPrice } from "@/lib/ebooks";

type EbookRow = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  category: string;
  cover_url: string | null;
  content_url: string | null;
  content_path: string | null;
  preview_text: string | null;
  price_cents: number;
  is_free: boolean;
  is_published: boolean;
};

const input = "w-full border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-pitch";
const labelCls = "label-xs mb-1 block text-foreground/40";

const slugify = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const emptyForm = (): EbookRow => ({
  id: "",
  title: "",
  slug: "",
  summary: "",
  description: "",
  category: EBOOK_CATEGORIES[0],
  cover_url: null,
  content_url: null,
  content_path: null,
  preview_text: "",
  price_cents: 1000,
  is_free: false,
  is_published: true,
});

export function EbookAdmin({ adminId }: { adminId: string }) {
  const [form, setForm] = useState<EbookRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"pdf" | "cover" | null>(null);

  const { data, refetch } = useQuery({
    queryKey: ["admin-ebooks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ebooks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as EbookRow[];
    },
  });

  function patch(v: Partial<EbookRow>) {
    setForm((f) => (f ? { ...f, ...v } : f));
  }

  async function uploadPdf(file: File) {
    if (!form) return;
    setUploading("pdf");
    try {
      const slug = form.slug || slugify(form.title) || crypto.randomUUID();
      const path = `${slug}/${Date.now()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
      const { error } = await supabase.storage
        .from("ebooks-private")
        .upload(path, file, { contentType: file.type || "application/pdf", upsert: true });
      if (error) throw error;
      patch({ content_path: path, content_url: null });
      toast.success("PDF téléversé.");
    } catch {
      toast.error("Téléversement du PDF impossible.");
    } finally {
      setUploading(null);
    }
  }

  async function uploadCover(file: File) {
    setUploading("cover");
    try {
      const path = `${adminId}/ebook-covers/${Date.now()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
      const { error } = await supabase.storage.from("media").upload(path, file);
      if (error) throw error;
      const { data } = await supabase.storage
        .from("media")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      patch({ cover_url: data?.signedUrl ?? null });
      toast.success("Couverture téléversée.");
    } catch {
      toast.error("Téléversement de la couverture impossible.");
    } finally {
      setUploading(null);
    }
  }

  async function save() {
    if (!form) return;
    if (!form.title.trim()) {
      toast.error("Le titre est obligatoire.");
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      slug: (form.slug || slugify(form.title)).trim(),
      summary: form.summary.trim(),
      description: form.description.trim(),
      category: form.category,
      cover_url: form.cover_url,
      content_url: form.content_url,
      content_path: form.content_path,
      preview_text: form.preview_text,
      price_cents: form.is_free ? 0 : form.price_cents,
      is_free: form.is_free,
      is_published: form.is_published,
    };
    const { error } = form.id
      ? await supabase.from("ebooks").update(payload).eq("id", form.id)
      : await supabase.from("ebooks").insert(payload);
    setSaving(false);
    if (error) {
      toast.error("Enregistrement impossible.");
      return;
    }
    toast.success("Ebook enregistré.");
    setForm(null);
    void refetch();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("ebooks").delete().eq("id", id);
    toast[error ? "error" : "success"](error ? "Suppression impossible." : "Ebook supprimé.");
    void refetch();
  }

  return (
    <div className="mt-4 space-y-4">
      {!form && (
        <button
          onClick={() => setForm(emptyForm())}
          className="inline-flex items-center gap-2 bg-pitch px-4 py-2 font-display text-lg uppercase text-volt"
        >
          <Plus className="size-4" /> Nouvel ebook
        </button>
      )}

      {form && (
        <div className="space-y-4 border border-border bg-card p-5">
          <p className="font-display text-2xl uppercase">
            {form.id ? "Modifier l'ebook" : "Nouvel ebook"}
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Titre</label>
              <input
                className={input}
                value={form.title}
                onChange={(e) => patch({ title: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>Slug (URL)</label>
              <input
                className={input}
                value={form.slug}
                placeholder={slugify(form.title)}
                onChange={(e) => patch({ slug: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>Catégorie</label>
              <select
                className={input}
                value={form.category}
                onChange={(e) => patch({ category: e.target.value })}
              >
                {EBOOK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Prix (centimes)</label>
              <input
                type="number"
                min={0}
                className={input}
                disabled={form.is_free}
                value={form.price_cents}
                onChange={(e) => patch({ price_cents: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Description courte</label>
            <input
              className={input}
              value={form.summary}
              onChange={(e) => patch({ summary: e.target.value })}
            />
          </div>

          <div>
            <label className={labelCls}>Description complète</label>
            <textarea
              rows={5}
              className={input}
              value={form.description}
              onChange={(e) => patch({ description: e.target.value })}
            />
          </div>

          <div>
            <label className={labelCls}>Texte d'aperçu</label>
            <textarea
              rows={3}
              className={input}
              value={form.preview_text ?? ""}
              onChange={(e) => patch({ preview_text: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Couverture (image)</label>
              <input
                type="file"
                accept="image/*"
                className="text-xs"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadCover(f);
                }}
              />
              {form.cover_url && (
                <img
                  src={form.cover_url}
                  alt="Aperçu de la couverture"
                  className="mt-2 h-24 w-auto border border-border object-cover"
                />
              )}
            </div>
            <div>
              <label className={labelCls}>Fichier PDF (stockage privé)</label>
              <input
                type="file"
                accept="application/pdf"
                className="text-xs"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadPdf(f);
                }}
              />
              {form.content_path && (
                <p className="label-xs mt-2 inline-flex items-center gap-1 text-pitch">
                  <FileText className="size-3" /> {form.content_path}
                </p>
              )}
              <p className="label-xs mt-1 text-muted-foreground">
                Accessible uniquement via un lien signé temporaire, après achat.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_free}
                onChange={(e) => patch({ is_free: e.target.checked })}
              />
              Ebook gratuit
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) => patch({ is_published: e.target.checked })}
              />
              Publié
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => void save()}
              disabled={saving || !!uploading}
              className="bg-volt px-5 py-2.5 font-display text-lg uppercase text-pitch disabled:opacity-50"
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button
              onClick={() => setForm(null)}
              className="border border-border px-5 py-2.5 font-display text-lg uppercase"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {(data ?? []).map((e) => (
          <div
            key={e.id}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border border-border bg-card p-3"
          >
            <div className="min-w-0">
              <p className="truncate font-display text-lg uppercase">{e.title}</p>
              <p className="label-xs text-muted-foreground">
                {e.category} · {formatPrice(e.price_cents)} ·{" "}
                {e.content_path ? "PDF en ligne" : "PDF manquant"} ·{" "}
                {e.is_published ? "publié" : "brouillon"}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => setForm({ ...emptyForm(), ...e, preview_text: e.preview_text ?? "" })}
                className="label-xs border border-border px-3 py-1.5"
              >
                Modifier
              </button>
              <button
                onClick={() => void remove(e.id)}
                aria-label={`Supprimer ${e.title}`}
                className="label-xs border border-border px-3 py-1.5"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
