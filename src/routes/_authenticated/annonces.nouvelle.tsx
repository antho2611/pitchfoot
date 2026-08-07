import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { PageShell } from "@/components/layout/Shell";
import { AVAILABILITY, LEVELS, POSITIONS } from "@/lib/football";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/annonces/nouvelle")({
  head: () => ({
    meta: [
      { title: "Publier une annonce — PitchPro" },
      { name: "description", content: "Publiez votre besoin de recrutement en quelques secondes." },
      { property: "og:title", content: "Publier une annonce — PitchPro" },
      { property: "og:description", content: "Décrivez le profil recherché et recevez des candidatures." },
    ],
  }),
  component: NewListing,
});

const schema = z.object({
  title: z.string().trim().min(4, "Titre trop court").max(120),
  description: z.string().trim().max(2000).optional(),
});

const input = "w-full border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-pitch";

function NewListing() {
  const { user, accountType } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    position: "",
    level: "",
    championship: "",
    city: "",
    season: "2025/2026",
    min_age: "",
    max_age: "",
    availability_required: "",
    description: "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  if (accountType !== "club") {
    return (
      <PageShell>
        <p className="mx-auto max-w-3xl px-6 py-24 text-center text-sm text-muted-foreground">
          Seuls les comptes club peuvent publier une annonce.
        </p>
      </PageShell>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    const { data, error } = await supabase
      .from("listings")
      .insert({
        club_id: user!.id,
        title: parsed.data.title,
        description: parsed.data.description || null,
        position: form.position || null,
        level: form.level || null,
        championship: form.championship || null,
        city: form.city || null,
        season: form.season || null,
        min_age: form.min_age ? Number(form.min_age) : null,
        max_age: form.max_age ? Number(form.max_age) : null,
        availability_required: (form.availability_required || null) as "ouvert" | null,
      })
      .select("id")
      .single();

    if (error || !data) return toast.error("Publication impossible.");
    toast.success("Annonce publiée !");
    navigate({ to: "/annonces/$id", params: { id: data.id } });
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-5xl uppercase">Publier une annonce</h1>
        <form onSubmit={submit} className="mt-8 space-y-4 border border-border bg-card p-6">
          <input
            className={input}
            placeholder="Titre de l'annonce"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            maxLength={120}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <select className={input} value={form.position} onChange={(e) => set("position", e.target.value)}>
              <option value="">Poste recherché</option>
              {POSITIONS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <select className={input} value={form.level} onChange={(e) => set("level", e.target.value)}>
              <option value="">Niveau</option>
              {LEVELS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
            <input className={input} placeholder="Championnat" value={form.championship} onChange={(e) => set("championship", e.target.value)} maxLength={80} />
            <input className={input} placeholder="Ville" value={form.city} onChange={(e) => set("city", e.target.value)} maxLength={60} />
            <input className={input} placeholder="Saison" value={form.season} onChange={(e) => set("season", e.target.value)} maxLength={20} />
            <select
              className={input}
              value={form.availability_required}
              onChange={(e) => set("availability_required", e.target.value)}
            >
              <option value="">Disponibilité souhaitée</option>
              {AVAILABILITY.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
            <input className={input} type="number" placeholder="Âge min" value={form.min_age} onChange={(e) => set("min_age", e.target.value)} />
            <input className={input} type="number" placeholder="Âge max" value={form.max_age} onChange={(e) => set("max_age", e.target.value)} />
          </div>
          <textarea
            className={input}
            rows={6}
            placeholder="Description du profil recherché, conditions, contact…"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            maxLength={2000}
          />
          <button type="submit" className="w-full bg-pitch py-3 font-display text-xl uppercase text-volt">
            Publier l'annonce
          </button>
        </form>
      </section>
    </PageShell>
  );
}
