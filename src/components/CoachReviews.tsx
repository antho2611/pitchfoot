import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={i <= Math.round(value) ? "fill-volt text-volt" : "text-foreground/20"}
        />
      ))}
    </span>
  );
}

export function CoachReviews({ coachId, coachName }: { coachId: string; coachName: string }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const { data: reviews, refetch } = useQuery({
    queryKey: ["coach-reviews", coachId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coach_reviews")
        .select("*")
        .eq("coach_id", coachId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const authorIds = [...new Set((reviews ?? []).map((r) => r.author_id))];
  const { data: authors } = useQuery({
    queryKey: ["coach-review-authors", coachId, authorIds.join(",")],
    enabled: authorIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", authorIds);
      return Object.fromEntries((data ?? []).map((p) => [p.id, p.display_name])) as Record<
        string,
        string
      >;
    },
  });

  const { data: canReview } = useQuery({
    queryKey: ["can-review-coach", coachId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from("coach_reservations")
        .select("id", { count: "exact", head: true })
        .eq("coach_id", coachId)
        .eq("player_id", user!.id)
        .eq("status", "acceptee");
      return (count ?? 0) > 0;
    },
  });

  const list = reviews ?? [];
  const average = list.length
    ? Math.round((list.reduce((s, r) => s + r.rating, 0) / list.length) * 10) / 10
    : 0;
  const mine = user ? list.find((r) => r.author_id === user.id) : undefined;
  const showForm = !!user && canReview && (!mine || editing);

  async function submit() {
    if (!user || rating < 1) {
      toast.error("Sélectionnez une note.");
      return;
    }
    setSaving(true);
    const payload = { rating, comment: comment.trim() || null };
    const { error } = mine
      ? await supabase.from("coach_reviews").update(payload).eq("id", mine.id)
      : await supabase
          .from("coach_reviews")
          .insert({ ...payload, coach_id: coachId, author_id: user.id });
    setSaving(false);
    if (error) {
      toast.error("Impossible d'enregistrer votre avis.");
      return;
    }
    toast.success("Merci pour votre avis !");
    setEditing(false);
    setRating(0);
    setComment("");
    void refetch();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-3xl uppercase">Avis</h2>
        {list.length > 0 && (
          <div className="flex items-center gap-2">
            <Stars value={average} />
            <span className="text-sm font-semibold">
              {average.toFixed(1).replace(".", ",")} — {list.length} avis
            </span>
          </div>
        )}
      </div>

      {list.length === 0 && (
        <p className="mt-3 text-sm text-muted-foreground">
          Aucun avis pour le moment sur {coachName}.
        </p>
      )}

      <div className="mt-4 space-y-3">
        {list.map((r) => (
          <div key={r.id} className="border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Stars value={r.rating} size={14} />
                <span className="text-sm font-semibold">
                  {authors?.[r.author_id] ?? "Membre PitchPro"}
                </span>
              </div>
              <span className="label-xs text-foreground/40">
                {new Date(r.created_at).toLocaleDateString("fr-FR")}
              </span>
            </div>
            {r.comment && <p className="mt-2 text-sm leading-relaxed">{r.comment}</p>}
            {user?.id === r.author_id && !editing && (
              <button
                className="label-xs mt-2 underline underline-offset-4"
                onClick={() => {
                  setRating(r.rating);
                  setComment(r.comment ?? "");
                  setEditing(true);
                }}
              >
                Modifier mon avis
              </button>
            )}
          </div>
        ))}
      </div>

      {showForm && (
        <div className="mt-6 border border-pitch bg-card p-5">
          <p className="label-xs text-muted-foreground">
            {mine ? "Modifier votre avis" : "Laisser un avis"}
          </p>
          <div className="mt-2 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setRating(i)}
                aria-label={`Note ${i} sur 5`}
              >
                <Star
                  className={`size-7 ${i <= rating ? "fill-volt text-volt" : "text-foreground/20"}`}
                />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Votre commentaire (optionnel)"
            className="mt-3 w-full border border-border bg-background p-3 text-sm"
          />
          <div className="mt-3 flex gap-3">
            <button
              onClick={() => void submit()}
              disabled={saving}
              className="bg-pitch px-5 py-2 font-display text-lg uppercase text-volt disabled:opacity-50"
            >
              {mine ? "Mettre à jour" : "Publier mon avis"}
            </button>
            {editing && (
              <button className="label-xs underline" onClick={() => setEditing(false)}>
                Annuler
              </button>
            )}
          </div>
        </div>
      )}

      {!!user && canReview === false && !mine && (
        <p className="label-xs mt-4 text-muted-foreground">
          Seuls les joueurs ayant participé à une séance avec ce préparateur peuvent laisser un
          avis.
        </p>
      )}
    </div>
  );
}
