import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  COACH_SPECIALTIES,
  RADIUS_OPTIONS,
  SESSION_STATUS,
  SESSION_TYPES,
  formatSessionDate,
  sessionStatusLabel,
} from "@/lib/coaches";
import { CityAutocomplete } from "@/components/CityAutocomplete";
import { CoachReservations } from "@/components/CoachReservations";

const input =
  "w-full border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-pitch";
const labelCls = "label-xs mb-1 block text-foreground/40";

async function uploadPhoto(userId: string, file: File) {
  const path = `${userId}/coach/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
  const { error } = await supabase.storage.from("media").upload(path, file);
  if (error) throw error;
  const { data } = await supabase.storage.from("media").createSignedUrl(path, 60 * 60 * 24 * 365);
  return data?.signedUrl ?? "";
}

export function CoachProfileEditor({ userId }: { userId: string }) {
  return (
    <div className="space-y-12">
      <CoachForm userId={userId} />
      <CoachListings userId={userId} />
      <CoachReservations userId={userId} />
    </div>
  );
}

function CoachForm({ userId }: { userId: string }) {
  const { profileCompleted, refresh } = useAuth();
  const navigate = useNavigate();
  const { data, refetch } = useQuery({
    queryKey: ["my-coach", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("preparateurs")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      return data;
    },
  });

  const [form, setForm] = useState<Record<string, string>>({});
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!data) return;
    setForm({
      full_name: data.full_name ?? "",
      headline: data.headline ?? "",
      bio: data.bio ?? "",
      qualifications: data.qualifications ?? "",
      price_info: data.price_info ?? "",
      city: data.city ?? "",
      country: data.country ?? "France",
      radius_km: String(data.radius_km ?? 30),
      contact_email: data.contact_email ?? "",
      phone: data.phone ?? "",
      website: data.website ?? "",
      photo_url: data.photo_url ?? "",
    });
    setSpecialties(data.specialties ?? []);
  }, [data]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function toggleSpecialty(s: string) {
    setSpecialties((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  async function save() {
    setBusy(true);
    try {
      const latitude = coords?.lat ?? data?.latitude ?? null;
      const longitude = coords?.lon ?? data?.longitude ?? null;
      const { error } = await supabase.from("preparateurs").upsert({
        id: userId,
        full_name: form.full_name?.slice(0, 120) || "",
        headline: form.headline?.slice(0, 200) || null,
        bio: form.bio?.slice(0, 3000) || null,
        qualifications: form.qualifications?.slice(0, 2000) || null,
        specialties,
        price_info: form.price_info?.slice(0, 200) || null,
        city: form.city || null,
        country: form.country || "France",
        latitude,
        longitude,
        radius_km: Number(form.radius_km || 30),
        contact_email: form.contact_email || null,
        phone: form.phone || null,
        website: form.website || null,
        photo_url: form.photo_url || null,
      });
      if (error) throw error;

      const wasIncomplete = !profileCompleted;
      if (wasIncomplete) {
        await supabase.from("profiles").update({ profile_completed: true }).eq("id", userId);
        await refresh();
      }

      toast.success("Fiche enregistrée.");
      void refetch();
      if (wasIncomplete) navigate({ to: "/premium" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Enregistrement impossible");
    } finally {
      setBusy(false);
    }
  }

  async function onPhoto(file?: File | null) {
    if (!file) return;
    try {
      const url = await uploadPhoto(userId, file);
      set("photo_url", url);
      toast.success("Photo importée — pensez à enregistrer.");
    } catch {
      toast.error("Import impossible");
    }
  }

  return (
    <div className="mt-8 space-y-5">
      <h2 className="font-display text-3xl uppercase">Fiche professionnelle</h2>

      <div className="flex items-center gap-4">
        <div className="size-20 overflow-hidden border border-border bg-muted">
          {form.photo_url && (
            <img src={form.photo_url} alt="Photo de profil" className="size-full object-cover" />
          )}
        </div>
        <input type="file" accept="image/*" onChange={(e) => void onPhoto(e.target.files?.[0])} />
      </div>

      <div>
        <label className={labelCls}>Nom complet</label>
        <input
          className={input}
          value={form.full_name ?? ""}
          onChange={(e) => set("full_name", e.target.value)}
        />
      </div>
      <div>
        <label className={labelCls}>Accroche</label>
        <input
          className={input}
          placeholder="Préparateur physique diplômé — reprise et prévention"
          value={form.headline ?? ""}
          onChange={(e) => set("headline", e.target.value)}
        />
      </div>
      <div>
        <label className={labelCls}>Présentation</label>
        <textarea
          className={`${input} min-h-32`}
          value={form.bio ?? ""}
          onChange={(e) => set("bio", e.target.value)}
        />
      </div>
      <div>
        <label className={labelCls}>Qualifications & diplômes</label>
        <textarea
          className={`${input} min-h-24`}
          value={form.qualifications ?? ""}
          onChange={(e) => set("qualifications", e.target.value)}
        />
      </div>
      <div>
        <label className={labelCls}>Spécialités</label>
        <div className="flex flex-wrap gap-2">
          {COACH_SPECIALTIES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleSpecialty(s)}
              className={`border px-3 py-1.5 text-xs uppercase tracking-wide ${
                specialties.includes(s) ? "border-pitch bg-volt text-pitch" : "border-border"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Ville de base</label>
          <CityAutocomplete
            value={form.city ?? ""}
            onChange={(v) => set("city", v)}
            onSelect={(pick) => {
              setCoords(pick ? { lat: pick.lat, lon: pick.lon } : null);
              if (pick) set("city", pick.city);
            }}
          />
        </div>
        <div>
          <label className={labelCls}>Zone d'intervention</label>
          <select
            className={input}
            value={form.radius_km ?? "30"}
            onChange={(e) => set("radius_km", e.target.value)}
          >
            {RADIUS_OPTIONS.map((r) => (
              <option key={r} value={r}>
                Rayon de {r} km
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Tarif indicatif</label>
          <input
            className={input}
            placeholder="35 € la séance individuelle"
            value={form.price_info ?? ""}
            onChange={(e) => set("price_info", e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>Email de contact</label>
          <input
            className={input}
            value={form.contact_email ?? ""}
            onChange={(e) => set("contact_email", e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>Téléphone</label>
          <input
            className={input}
            value={form.phone ?? ""}
            onChange={(e) => set("phone", e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>Site web</label>
          <input
            className={input}
            value={form.website ?? ""}
            onChange={(e) => set("website", e.target.value)}
          />
        </div>
      </div>

      <button
        onClick={() => void save()}
        disabled={busy}
        className="bg-pitch px-6 py-3 font-display text-xl uppercase text-volt disabled:opacity-50"
      >
        {busy ? "Enregistrement…" : "Enregistrer"}
      </button>
    </div>
  );
}

const emptyAd = {
  title: "",
  description: "",
  session_type: "collective",
  session_date: "",
  start_time: "",
  end_time: "",
  city: "",
  location: "",
  price_info: "",
  capacity: "",
  status: "active",
};

function CoachListings({ userId }: { userId: string }) {
  const { data, refetch } = useQuery({
    queryKey: ["my-coach-annonces", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("coach_annonces")
        .select("*")
        .eq("coach_id", userId)
        .order("session_date", { ascending: false });
      return data ?? [];
    },
  });

  const [form, setForm] = useState<Record<string, string>>(emptyAd);
  const [editing, setEditing] = useState<string | null>(null);
  const [adCoords, setAdCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    if (!form.title.trim() || !form.session_date) {
      toast.error("Titre et date sont obligatoires.");
      return;
    }
    setBusy(true);
    try {
      const current = editing ? (data ?? []).find((x) => x.id === editing) : null;
      const latitude = adCoords?.lat ?? current?.latitude ?? null;
      const longitude = adCoords?.lon ?? current?.longitude ?? null;
      const payload = {
        coach_id: userId,
        title: form.title.slice(0, 140),
        description: form.description?.slice(0, 2000) || null,
        session_type: form.session_type as "collective" | "individuelle",
        session_date: form.session_date,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        city: form.city || null,
        location: form.location || null,
        latitude,
        longitude,
        price_info: form.price_info || null,
        capacity: form.capacity ? Number(form.capacity) : null,
        status: form.status as "active" | "complete" | "expiree",
      };
      const { error } = editing
        ? await supabase.from("coach_annonces").update(payload).eq("id", editing)
        : await supabase.from("coach_annonces").insert(payload);
      if (error) throw error;
      toast.success(editing ? "Annonce mise à jour." : "Annonce publiée.");
      setForm(emptyAd);
      setEditing(null);
      void refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Publication impossible");
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(id: string, status: string) {
    const { error } = await supabase
      .from("coach_annonces")
      .update({ status: status as "active" | "complete" | "expiree" })
      .eq("id", id);
    if (error) toast.error(error.message);
    else void refetch();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("coach_annonces").delete().eq("id", id);
    if (error) toast.error(error.message);
    else void refetch();
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-3xl uppercase">Mes séances</h2>

      <div className="space-y-3 border border-border bg-card p-5">
        <p className="label-xs text-foreground/40">
          {editing ? "Modifier l'annonce" : "Nouvelle annonce"}
        </p>
        <input
          className={input}
          placeholder="Titre (ex : Séance de renforcement musculaire)"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
        />
        <textarea
          className={`${input} min-h-24`}
          placeholder="Description"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            className={input}
            value={form.session_type}
            onChange={(e) => set("session_type", e.target.value)}
          >
            {SESSION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            className={input}
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
          >
            {SESSION_STATUS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <input
            className={input}
            type="date"
            value={form.session_date}
            onChange={(e) => set("session_date", e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              className={input}
              type="time"
              value={form.start_time}
              onChange={(e) => set("start_time", e.target.value)}
            />
            <input
              className={input}
              type="time"
              value={form.end_time}
              onChange={(e) => set("end_time", e.target.value)}
            />
          </div>
          <CityAutocomplete
            value={form.city}
            placeholder="Ville de la séance"
            onChange={(v) => set("city", v)}
            onSelect={(pick) => {
              setAdCoords(pick ? { lat: pick.lat, lon: pick.lon } : null);
              if (pick) set("city", pick.city);
            }}
          />
          <input
            className={input}
            placeholder="Lieu précis (stade, salle…)"
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
          />
          <input
            className={input}
            placeholder="Tarif (optionnel)"
            value={form.price_info}
            onChange={(e) => set("price_info", e.target.value)}
          />
          <input
            className={input}
            type="number"
            min={1}
            placeholder="Places (optionnel)"
            value={form.capacity}
            onChange={(e) => set("capacity", e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => void submit()}
            disabled={busy}
            className="bg-pitch px-6 py-2.5 font-display text-lg uppercase text-volt disabled:opacity-50"
          >
            {editing ? "Mettre à jour" : "Publier"}
          </button>
          {editing && (
            <button
              onClick={() => {
                setEditing(null);
                setForm(emptyAd);
              }}
              className="border-2 border-pitch px-6 py-2.5 font-display text-lg uppercase"
            >
              Annuler
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {(data ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">Aucune annonce publiée.</p>
        )}
        {(data ?? []).map((a) => (
          <article key={a.id} className="border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-2xl uppercase leading-none">{a.title}</h3>
              <span className="bg-muted px-2 py-1 text-[11px] uppercase tracking-widest">
                {sessionStatusLabel(a.status)}
              </span>
            </div>
            <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">
              {formatSessionDate(a.session_date, a.start_time, a.end_time)}
              {a.city ? ` · ${a.city}` : ""}
              {` · ${a.reserved_count ?? 0}${a.capacity ? `/${a.capacity}` : ""} place(s) réservée(s)`}
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs uppercase tracking-widest">
              <button
                className="underline"
                onClick={() => {
                  setEditing(a.id);
                  setForm({
                    title: a.title ?? "",
                    description: a.description ?? "",
                    session_type: a.session_type ?? "collective",
                    session_date: a.session_date ?? "",
                    start_time: a.start_time?.slice(0, 5) ?? "",
                    end_time: a.end_time?.slice(0, 5) ?? "",
                    city: a.city ?? "",
                    location: a.location ?? "",
                    price_info: a.price_info ?? "",
                    capacity: a.capacity?.toString() ?? "",
                    status: a.status ?? "active",
                  });
                }}
              >
                Modifier
              </button>
              {a.status === "active" && (
                <>
                  <button className="underline" onClick={() => void changeStatus(a.id, "complete")}>
                    Marquer complète
                  </button>
                  <button className="underline" onClick={() => void changeStatus(a.id, "expiree")}>
                    Clôturer
                  </button>
                </>
              )}
              {a.status !== "active" && (
                <button className="underline" onClick={() => void changeStatus(a.id, "active")}>
                  Réactiver
                </button>
              )}
              <button className="underline" onClick={() => void remove(a.id)}>
                Supprimer
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
