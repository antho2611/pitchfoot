import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Check, MessageSquare, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { openConversation } from "@/lib/messaging";
import { reservationStatusLabel, respondReservation } from "@/lib/reservations";
import { formatSessionDate } from "@/lib/coaches";

type Row = {
  id: string;
  status: string;
  created_at: string;
  player_id: string;
  coach_annonces: {
    title: string;
    session_date: string;
    start_time: string | null;
    end_time: string | null;
    capacity: number | null;
    reserved_count: number | null;
  } | null;
};

export function CoachReservations({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);

  const { data, refetch } = useQuery({
    queryKey: ["coach-reservations", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("coach_reservations")
        .select(
          "id, status, created_at, player_id, coach_annonces(title, session_date, start_time, end_time, capacity, reserved_count)",
        )
        .eq("coach_id", userId)
        .order("created_at", { ascending: false });
      const rows = (data ?? []) as unknown as Row[];
      const ids = rows.map((r) => r.player_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
      return rows.map((r) => ({
        ...r,
        playerName:
          profiles?.find((p) => p.id === r.player_id)?.display_name ?? "Joueur",
      }));
    },
  });

  const { data: me } = useQuery({
    queryKey: ["my-coach-name", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("preparateurs")
        .select("full_name")
        .eq("id", userId)
        .maybeSingle();
      return data?.full_name ?? "Le préparateur";
    },
  });

  async function respond(id: string, playerId: string, title: string, accept: boolean) {
    setBusy(id);
    try {
      await respondReservation({
        reservationId: id,
        playerId,
        accept,
        coachName: me ?? "Le préparateur",
        title,
      });
      toast.success(accept ? "Réservation acceptée." : "Réservation refusée.");
      void refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action impossible");
    } finally {
      setBusy(null);
    }
  }

  async function contact(playerId: string) {
    try {
      const id = await openConversation(userId, playerId);
      navigate({ to: "/messages", search: { c: id } });
    } catch {
      toast.error("Impossible d'ouvrir la conversation.");
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-3xl uppercase">Réservations reçues</h2>
      {(data ?? []).length === 0 && (
        <p className="text-sm text-muted-foreground">Aucune demande de réservation.</p>
      )}
      <div className="space-y-3">
        {(data ?? []).map((r) => (
          <article
            key={r.id}
            className="flex flex-col gap-3 border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="font-display text-xl uppercase leading-none">{r.playerName}</p>
              <p className="mt-1 truncate text-xs uppercase tracking-widest text-muted-foreground">
                {r.coach_annonces?.title}
                {r.coach_annonces
                  ? ` · ${formatSessionDate(
                      r.coach_annonces.session_date,
                      r.coach_annonces.start_time,
                      r.coach_annonces.end_time,
                    )}`
                  : ""}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-widest text-foreground/40">
                {reservationStatusLabel(r.status)}
                {r.coach_annonces?.capacity
                  ? ` · ${r.coach_annonces.reserved_count ?? 0}/${r.coach_annonces.capacity} places`
                  : ""}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {r.status === "en_attente" && (
                <>
                  <button
                    disabled={busy === r.id}
                    onClick={() =>
                      void respond(r.id, r.player_id, r.coach_annonces?.title ?? "la séance", true)
                    }
                    className="flex items-center gap-1.5 bg-volt px-4 py-2 font-display text-lg uppercase text-pitch disabled:opacity-50"
                  >
                    <Check className="size-4" /> Accepter
                  </button>
                  <button
                    disabled={busy === r.id}
                    onClick={() =>
                      void respond(r.id, r.player_id, r.coach_annonces?.title ?? "la séance", false)
                    }
                    className="flex items-center gap-1.5 border-2 border-pitch px-4 py-2 font-display text-lg uppercase disabled:opacity-50"
                  >
                    <X className="size-4" /> Refuser
                  </button>
                </>
              )}
              {r.status === "acceptee" && (
                <button
                  onClick={() => void contact(r.player_id)}
                  className="flex items-center gap-1.5 border-2 border-pitch px-4 py-2 font-display text-lg uppercase"
                >
                  <MessageSquare className="size-4" /> Message
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
