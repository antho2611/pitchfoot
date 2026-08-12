import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { PageShell } from "@/components/layout/Shell";
import { AVAILABILITY, FEET, LEVELS, POSITIONS, statFieldsFor } from "@/lib/football";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CoachProfileEditor } from "@/components/CoachProfileEditor";
import { CountrySelect } from "@/components/CountrySelect";
import { CityAutocomplete } from "@/components/CityAutocomplete";
import { ClubSelect } from "@/components/ClubSelect";
import { CURRENT_SEASON, SEASONS_DESC } from "@/lib/seasons";
import { deleteMyAccount } from "@/lib/account.functions";

export const Route = createFileRoute("/_authenticated/profil")({
  head: () => ({
    meta: [
      { title: "Mon profil — PitchPro" },
      { name: "description", content: "Complétez votre profil sportif ou la fiche de votre club." },
      { property: "og:title", content: "Mon profil — PitchPro" },
      { property: "og:description", content: "Éditez vos informations PitchPro." },
    ],
  }),
  component: ProfilePage,
});

const input =
  "w-full border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-pitch";
const labelCls = "label-xs mb-1 block text-foreground/40";

function ProfilePage() {
  const { user, accountType } = useAuth();
  return (
    <PageShell>
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-5xl uppercase">Mon profil</h1>
        {accountType === "club" ? (
          <ClubForm userId={user!.id} />
        ) : accountType === "player" ? (
          <PlayerForm userId={user!.id} />
        ) : accountType === "coach" ? (
          <CoachProfileEditor userId={user!.id} />
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">
            Compte administrateur : aucun profil public à éditer.
          </p>
        )}
        {accountType !== "admin" && <DangerZone />}
      </section>
    </PageShell>
  );
}

function DangerZone() {
  const navigate = useNavigate();
  const deleteAccount = useServerFn(deleteMyAccount);
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    const confirmed = window.confirm(
      "Supprimer définitivement votre compte ? Votre profil, vos statistiques, vos messages et tous vos fichiers seront effacés. Cette action est irréversible.",
    );
    if (!confirmed) return;
    setBusy(true);
    try {
      await deleteAccount();
      await supabase.auth.signOut();
      toast.success("Votre compte a été supprimé.");
      navigate({ to: "/", replace: true });
    } catch {
      toast.error("Suppression impossible pour le moment.");
      setBusy(false);
    }
  }

  return (
    <div className="mt-16 border-2 border-destructive/30 p-6">
      <h2 className="font-display text-2xl uppercase text-destructive">Zone dangereuse</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Supprime définitivement votre compte et toutes les données associées (profil, statistiques,
        parcours, messages, fichiers). Cette action est irréversible.
      </p>
      <button
        type="button"
        onClick={() => void onDelete()}
        disabled={busy}
        className="mt-4 border-2 border-destructive px-5 py-2.5 font-display text-lg uppercase text-destructive disabled:opacity-50"
      >
        {busy ? "Suppression…" : "Supprimer mon compte"}
      </button>
    </div>
  );
}

async function uploadFile(userId: string, file: File, folder: string) {
  const path = `${userId}/${folder}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
  const { error } = await supabase.storage.from("media").upload(path, file);
  if (error) throw error;
  const { data } = await supabase.storage.from("media").createSignedUrl(path, 60 * 60 * 24 * 365);
  return data?.signedUrl ?? "";
}

function PlayerForm({ userId }: { userId: string }) {
  const { profileCompleted, refresh } = useAuth();
  const navigate = useNavigate();
  const { data, refetch } = useQuery({
    queryKey: ["my-player", userId],
    queryFn: async () => {
      const [p, s, h] = await Promise.all([
        supabase.from("players").select("*").eq("id", userId).maybeSingle(),
        supabase
          .from("player_stats")
          .select("*")
          .eq("player_id", userId)
          .order("season", { ascending: false }),
        supabase
          .from("player_club_history")
          .select("*")
          .eq("player_id", userId)
          .order("season_start", { ascending: false }),
      ]);
      return { player: p.data, stats: s.data ?? [], clubHistory: h.data ?? [] };
    },
  });

  const [form, setForm] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [season, setSeason] = useState(CURRENT_SEASON);
  const [statValues, setStatValues] = useState<Record<string, string>>({});
  const [historyEntry, setHistoryEntry] = useState({
    season_start: "",
    season_end: "",
    club_name: "",
  });
  const [historyBusy, setHistoryBusy] = useState(false);

  useEffect(() => {
    if (!data?.player) return;
    const p = data.player;
    setForm({
      first_name: p.first_name ?? "",
      last_name: p.last_name ?? "",
      birth_date: p.birth_date ?? "",
      nationality: p.nationality ?? "",
      city: p.city ?? "",
      country: p.country ?? "",
      main_position: p.main_position ?? "",
      strong_foot: p.strong_foot ?? "",
      height_cm: p.height_cm?.toString() ?? "",
      weight_kg: p.weight_kg?.toString() ?? "",
      current_club: p.current_club ?? "",
      level: p.level ?? "",
      championship: p.championship ?? "",
      availability: p.availability ?? "ouvert",
      experience_years: p.experience_years?.toString() ?? "0",
      bio: p.bio ?? "",
      trophies: p.trophies ?? "",
      agent: p.agent ?? "",
    });
  }, [data?.player]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setBusy(true);
    const { error } = await supabase
      .from("players")
      .update({
        first_name: form.first_name?.slice(0, 60) || "",
        last_name: form.last_name?.slice(0, 60) || "",
        birth_date: form.birth_date || null,
        nationality: form.nationality || null,
        city: form.city || null,
        country: form.country || null,
        main_position: form.main_position || null,
        strong_foot: form.strong_foot || null,
        height_cm: form.height_cm ? Number(form.height_cm) : null,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        current_club: form.current_club || null,
        level: form.level || null,
        championship: form.championship || null,
        availability: (form.availability || "ouvert") as "ouvert",
        experience_years: Number(form.experience_years || 0),
        bio: form.bio?.slice(0, 2000) || null,
        trophies: form.trophies?.slice(0, 1000) || null,
        agent: form.agent || null,
      })
      .eq("id", userId);

    const wasIncomplete = !error && !profileCompleted;
    if (wasIncomplete) {
      await supabase.from("profiles").update({ profile_completed: true }).eq("id", userId);
      await refresh();
    }

    setBusy(false);
    toast[error ? "error" : "success"](error ? "Enregistrement impossible." : "Profil enregistré.");
    if (!error) {
      void refetch();
      if (wasIncomplete) navigate({ to: "/premium" });
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>, kind: "photo" | "cv" | "video") {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile(userId, file, kind);
      if (kind === "photo")
        await supabase.from("players").update({ photo_url: url }).eq("id", userId);
      if (kind === "cv") await supabase.from("players").update({ cv_url: url }).eq("id", userId);
      if (kind === "video")
        await supabase
          .from("players")
          .update({ video_urls: [...(data?.player?.video_urls ?? []), url] })
          .eq("id", userId);
      toast.success("Fichier envoyé.");
      void refetch();
    } catch {
      toast.error("Envoi impossible.");
    }
  }

  async function saveStats() {
    const payload: Record<string, number | string> = { player_id: userId, season };
    for (const f of statFieldsFor(form.main_position)) {
      payload[f.key] = Number(statValues[f.key] ?? 0);
    }
    const { error } = await supabase
      .from("player_stats")
      .upsert(payload as never, { onConflict: "player_id,season" });
    toast[error ? "error" : "success"](
      error ? "Échec de l'enregistrement." : "Statistiques enregistrées.",
    );
    if (!error) void refetch();
  }

  async function addClubHistory() {
    if (
      !historyEntry.club_name.trim() ||
      !historyEntry.season_start.trim() ||
      !historyEntry.season_end.trim()
    ) {
      toast.error("Club et saisons obligatoires.");
      return;
    }
    setHistoryBusy(true);
    const { error } = await supabase.from("player_club_history").insert({
      player_id: userId,
      club_name: historyEntry.club_name.slice(0, 100),
      season_start: historyEntry.season_start.slice(0, 20),
      season_end: historyEntry.season_end.slice(0, 20),
    });
    setHistoryBusy(false);
    if (error) {
      toast.error("Ajout impossible.");
      return;
    }
    setHistoryEntry({ season_start: "", season_end: "", club_name: "" });
    void refetch();
  }

  async function removeClubHistory(id: string) {
    const { error } = await supabase.from("player_club_history").delete().eq("id", id);
    if (error) toast.error("Suppression impossible.");
    else void refetch();
  }

  return (
    <div className="mt-8 space-y-10">
      <Block title="Identité">
        <Field label="Prénom">
          <input
            className={input}
            value={form.first_name ?? ""}
            onChange={(e) => set("first_name", e.target.value)}
            maxLength={60}
          />
        </Field>
        <Field label="Nom">
          <input
            className={input}
            value={form.last_name ?? ""}
            onChange={(e) => set("last_name", e.target.value)}
            maxLength={60}
          />
        </Field>
        <Field label="Date de naissance">
          <input
            type="date"
            className={input}
            value={form.birth_date ?? ""}
            onChange={(e) => set("birth_date", e.target.value)}
          />
        </Field>
        <Field label="Nationalité">
          <CountrySelect value={form.nationality ?? ""} onChange={(v) => set("nationality", v)} />
        </Field>
        <Field label="Ville">
          <CityAutocomplete
            value={form.city ?? ""}
            onChange={(v) => set("city", v)}
            onSelect={(pick) => pick && set("city", pick.city)}
          />
        </Field>
        <Field label="Pays">
          <CountrySelect value={form.country ?? ""} onChange={(v) => set("country", v)} />
        </Field>
      </Block>

      <Block title="Profil sportif">
        <Field label="Poste principal">
          <select
            className={input}
            value={form.main_position ?? ""}
            onChange={(e) => set("main_position", e.target.value)}
          >
            <option value="">—</option>
            {POSITIONS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Field>
        <Field label="Pied fort">
          <select
            className={input}
            value={form.strong_foot ?? ""}
            onChange={(e) => set("strong_foot", e.target.value)}
          >
            <option value="">—</option>
            {FEET.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </Field>
        <Field label="Taille (cm)">
          <input
            type="number"
            className={input}
            value={form.height_cm ?? ""}
            onChange={(e) => set("height_cm", e.target.value)}
          />
        </Field>
        <Field label="Poids (kg)">
          <input
            type="number"
            className={input}
            value={form.weight_kg ?? ""}
            onChange={(e) => set("weight_kg", e.target.value)}
          />
        </Field>
        <Field label="Club actuel">
          <ClubSelect value={form.current_club ?? ""} onChange={(v) => set("current_club", v)} />
        </Field>
        <Field label="Niveau">
          <select
            className={input}
            value={form.level ?? ""}
            onChange={(e) => set("level", e.target.value)}
          >
            <option value="">—</option>
            {LEVELS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </Field>
        <Field label="Championnat">
          <input
            className={input}
            value={form.championship ?? ""}
            onChange={(e) => set("championship", e.target.value)}
            maxLength={80}
          />
        </Field>
        <Field label="Disponibilité">
          <select
            className={input}
            value={form.availability ?? ""}
            onChange={(e) => set("availability", e.target.value)}
          >
            {AVAILABILITY.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Années d'expérience">
          <input
            type="number"
            className={input}
            value={form.experience_years ?? ""}
            onChange={(e) => set("experience_years", e.target.value)}
          />
        </Field>
        <Field label="Agent (optionnel)">
          <input
            className={input}
            value={form.agent ?? ""}
            onChange={(e) => set("agent", e.target.value)}
            maxLength={80}
          />
        </Field>
      </Block>

      <Block title="Présentation" cols={1}>
        <Field label="Bio">
          <textarea
            rows={5}
            className={input}
            value={form.bio ?? ""}
            onChange={(e) => set("bio", e.target.value)}
            maxLength={2000}
          />
        </Field>
        <Field label="Palmarès">
          <textarea
            rows={3}
            className={input}
            value={form.trophies ?? ""}
            onChange={(e) => set("trophies", e.target.value)}
            maxLength={1000}
          />
        </Field>
      </Block>

      <button
        onClick={save}
        disabled={busy}
        className="w-full bg-pitch py-3 font-display text-xl uppercase text-volt disabled:opacity-50"
      >
        Enregistrer mon profil
      </button>

      <Block title="Parcours" cols={1}>
        <div className="space-y-2">
          {(data?.clubHistory ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun club renseigné pour l'instant.</p>
          )}
          {(data?.clubHistory ?? []).map((h) => (
            <div
              key={h.id}
              className="flex items-center justify-between gap-3 border border-border bg-card px-4 py-3"
            >
              <div className="text-sm">
                <span className="font-display text-lg uppercase">{h.club_name}</span>
                <span className="ml-2 text-xs uppercase tracking-widest text-muted-foreground">
                  {h.season_start} — {h.season_end}
                </span>
              </div>
              <button
                type="button"
                onClick={() => void removeClubHistory(h.id)}
                className="text-xs uppercase tracking-widest underline"
              >
                Retirer
              </button>
            </div>
          ))}
        </div>

        <div className="grid gap-3 border border-dashed border-border p-4 sm:grid-cols-[1fr_1fr_2fr_auto]">
          <select
            className={input}
            value={historyEntry.season_start}
            onChange={(e) => setHistoryEntry((h) => ({ ...h, season_start: e.target.value }))}
          >
            <option value="">De —</option>
            {SEASONS_DESC.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            className={input}
            value={historyEntry.season_end}
            onChange={(e) => setHistoryEntry((h) => ({ ...h, season_end: e.target.value }))}
          >
            <option value="">À —</option>
            {SEASONS_DESC.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <ClubSelect
            value={historyEntry.club_name}
            onChange={(v) => setHistoryEntry((h) => ({ ...h, club_name: v }))}
          />
          <button
            type="button"
            onClick={() => void addClubHistory()}
            disabled={historyBusy}
            className="bg-pitch px-4 font-display text-2xl text-volt disabled:opacity-50"
            aria-label="Ajouter ce club"
          >
            +
          </button>
        </div>
      </Block>

      <Block title="Médias" cols={1}>
        <Field label="Photo de profil">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onFile(e, "photo")}
            className="text-sm"
          />
        </Field>
        <Field label="Vidéo (highlights)">
          <input
            type="file"
            accept="video/*"
            onChange={(e) => onFile(e, "video")}
            className="text-sm"
          />
        </Field>
        <Field label="CV sportif (PDF)">
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => onFile(e, "cv")}
            className="text-sm"
          />
        </Field>
      </Block>

      <Block title="Statistiques par saison" cols={1}>
        <Field label="Saison">
          <select className={input} value={season} onChange={(e) => setSeason(e.target.value)}>
            {SEASONS_DESC.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          {statFieldsFor(form.main_position).map((f) => (
            <div key={f.key}>
              <label className={labelCls}>{f.label}</label>
              <input
                type="number"
                className={input}
                value={statValues[f.key] ?? ""}
                onChange={(e) => setStatValues((s) => ({ ...s, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <button
          onClick={saveStats}
          className="bg-volt px-5 py-2.5 font-display text-lg uppercase text-pitch"
        >
          Enregistrer la saison
        </button>
        {data?.stats.length ? (
          <p className="label-xs text-foreground/40">
            Saisons enregistrées : {data.stats.map((s) => s.season).join(", ")}
          </p>
        ) : null}
      </Block>
    </div>
  );
}

function ClubForm({ userId }: { userId: string }) {
  const { profileCompleted, refresh } = useAuth();
  const navigate = useNavigate();
  const { data, refetch } = useQuery({
    queryKey: ["my-club", userId],
    queryFn: async () =>
      (await supabase.from("clubs").select("*").eq("id", userId).maybeSingle()).data,
  });
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!data) return;
    setForm({
      name: data.name ?? "",
      level: data.level ?? "",
      championship: data.championship ?? "",
      city: data.city ?? "",
      country: data.country ?? "",
      stadium: data.stadium ?? "",
      description: data.description ?? "",
      history: data.history ?? "",
      contact_email: data.contact_email ?? "",
      phone: data.phone ?? "",
      website: data.website ?? "",
      social_links: data.social_links ?? "",
    });
  }, [data]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    const { error } = await supabase
      .from("clubs")
      .update({
        name: form.name?.slice(0, 100) || "Club",
        level: form.level || null,
        championship: form.championship || null,
        city: form.city || null,
        country: form.country || null,
        stadium: form.stadium || null,
        description: form.description?.slice(0, 2000) || null,
        history: form.history?.slice(0, 2000) || null,
        contact_email: form.contact_email || null,
        phone: form.phone || null,
        website: form.website || null,
        social_links: form.social_links || null,
      })
      .eq("id", userId);

    const wasIncomplete = !error && !profileCompleted;
    if (wasIncomplete) {
      await supabase.from("profiles").update({ profile_completed: true }).eq("id", userId);
      await refresh();
    }

    toast[error ? "error" : "success"](
      error ? "Enregistrement impossible." : "Fiche club enregistrée.",
    );
    if (!error && wasIncomplete) navigate({ to: "/premium" });
  }

  async function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile(userId, file, "logo");
      await supabase.from("clubs").update({ logo_url: url }).eq("id", userId);
      toast.success("Logo mis à jour.");
      void refetch();
    } catch {
      toast.error("Envoi impossible.");
    }
  }

  return (
    <div className="mt-8 space-y-10">
      <Block title="Identité du club">
        <Field label="Nom">
          <input
            className={input}
            value={form.name ?? ""}
            onChange={(e) => set("name", e.target.value)}
            maxLength={100}
          />
        </Field>
        <Field label="Niveau">
          <select
            className={input}
            value={form.level ?? ""}
            onChange={(e) => set("level", e.target.value)}
          >
            <option value="">—</option>
            {LEVELS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </Field>
        <Field label="Championnat">
          <input
            className={input}
            value={form.championship ?? ""}
            onChange={(e) => set("championship", e.target.value)}
            maxLength={80}
          />
        </Field>
        <Field label="Ville">
          <input
            className={input}
            value={form.city ?? ""}
            onChange={(e) => set("city", e.target.value)}
            maxLength={60}
          />
        </Field>
        <Field label="Pays">
          <input
            className={input}
            value={form.country ?? ""}
            onChange={(e) => set("country", e.target.value)}
            maxLength={60}
          />
        </Field>
        <Field label="Stade">
          <input
            className={input}
            value={form.stadium ?? ""}
            onChange={(e) => set("stadium", e.target.value)}
            maxLength={100}
          />
        </Field>
      </Block>

      <Block title="Présentation" cols={1}>
        <Field label="Description">
          <textarea
            rows={5}
            className={input}
            value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
            maxLength={2000}
          />
        </Field>
        <Field label="Historique">
          <textarea
            rows={4}
            className={input}
            value={form.history ?? ""}
            onChange={(e) => set("history", e.target.value)}
            maxLength={2000}
          />
        </Field>
        <Field label="Logo">
          <input type="file" accept="image/*" onChange={onLogo} className="text-sm" />
        </Field>
      </Block>

      <Block title="Contact">
        <Field label="Email">
          <input
            className={input}
            value={form.contact_email ?? ""}
            onChange={(e) => set("contact_email", e.target.value)}
            maxLength={255}
          />
        </Field>
        <Field label="Téléphone">
          <input
            className={input}
            value={form.phone ?? ""}
            onChange={(e) => set("phone", e.target.value)}
            maxLength={30}
          />
        </Field>
        <Field label="Site web">
          <input
            className={input}
            value={form.website ?? ""}
            onChange={(e) => set("website", e.target.value)}
            maxLength={200}
          />
        </Field>
        <Field label="Réseaux sociaux">
          <input
            className={input}
            value={form.social_links ?? ""}
            onChange={(e) => set("social_links", e.target.value)}
            maxLength={300}
          />
        </Field>
      </Block>

      <button
        onClick={save}
        className="w-full bg-pitch py-3 font-display text-xl uppercase text-volt"
      >
        Enregistrer la fiche club
      </button>
    </div>
  );
}

function Block({
  title,
  children,
  cols = 2,
}: {
  title: string;
  children: React.ReactNode;
  cols?: number;
}) {
  return (
    <div className="border border-border bg-card p-6">
      <h2 className="mb-5 font-display text-3xl uppercase">{title}</h2>
      <div className={cols === 1 ? "space-y-4" : "grid gap-4 sm:grid-cols-2"}>{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}
