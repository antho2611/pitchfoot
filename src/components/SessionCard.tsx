import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarDays, Clock, MapPin, Users, Tag, Ticket, CheckCircle2 } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatSessionDate, sessionTypeLabel } from "@/lib/coaches";
import { reservationStatusLabel, reserveSession } from "@/lib/reservations";

export type SessionAd = {
  id: string;
  title: string;
  description?: string | null;
  session_type: string;
  session_date: string;
  start_time?: string | null;
  end_time?: string | null;
  city?: string | null;
  location?: string | null;
  price_info?: string | null;
  capacity?: number | null;
  reserved_count?: number | null;
  status?: string | null;
  coach_id: string;
};

export type SessionCoach = {
  id: string;
  full_name?: string | null;
  photo_url?: string | null;
  specialties?: string[] | null;
} | null;

export function SessionCard({
  ad,
  coach,
  dist,
  showCoachLink = true,
}: {
  ad: SessionAd;
  coach?: SessionCoach;
  dist?: number | null;
  showCoachLink?: boolean;
}) {
  const { user, displayName } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data: mine } = useQuery({
    queryKey: ["my-reservation", ad.id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("coach_reservations")
        .select("id, status")
        .eq("annonce_id", ad.id)
        .eq("player_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const taken = ad.reserved_count ?? 0;
  const capacity = ad.capacity ?? null;
  const full = capacity != null ? taken >= capacity : ad.status === "complete";
  const coachName = coach?.full_name || "le préparateur";

  async function submit() {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    setBusy(true);
    try {
      await reserveSession({
        annonceId: ad.id,
        playerId: user.id,
        coachId: ad.coach_id,
        playerName: displayName || "Un joueur",
        title: ad.title,
      });
      toast.success("Demande envoyée — en attente de validation du préparateur.");
      void qc.invalidateQueries({ queryKey: ["my-reservation", ad.id, user.id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Réservation impossible");
    } finally {
      setBusy(false);
      setConfirm(false);
    }
  }

  return (
    <article className="flex flex-col gap-4 border border-border bg-card p-5 md:flex-row">
      <div className="flex items-start gap-3 md:w-52 md:shrink-0 md:flex-col">
        <div className="size-16 shrink-0 overflow-hidden border-2 border-pitch bg-muted md:size-20">
          {coach?.photo_url ? (
            <img
              src={coach.photo_url}
              alt={`Photo de ${coachName}`}
              loading="lazy"
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center font-display text-2xl uppercase text-muted-foreground">
              {(coach?.full_name ?? "P").slice(0, 1)}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="label-xs text-muted-foreground">Préparateur</p>
          {showCoachLink && coach ? (
            <Link
              to="/preparateurs/$id"
              params={{ id: coach.id }}
              className="block truncate font-display text-xl uppercase leading-none hover:underline"
            >
              {coachName}
            </Link>
          ) : (
            <p className="truncate font-display text-xl uppercase leading-none">{coachName}</p>
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-2xl uppercase leading-none">{ad.title}</h3>
          <span className="bg-volt px-2 py-1 text-[11px] uppercase tracking-widest text-pitch">
            {sessionTypeLabel(ad.session_type)}
          </span>
          {full && (
            <span className="bg-muted px-2 py-1 text-[11px] uppercase tracking-widest">Complet</span>
          )}
        </div>

        <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
            <span>{formatSessionDate(ad.session_date, ad.start_time, ad.end_time)}</span>
          </div>
          {(ad.city || ad.location) && (
            <div className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">
                {[ad.location, ad.city].filter(Boolean).join(" · ")}
                {dist != null ? ` (${dist} km)` : ""}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Users className="size-4 shrink-0 text-muted-foreground" />
            <span>
              {capacity != null
                ? `${taken} joueur${taken > 1 ? "s" : ""} sur ${capacity} place${capacity > 1 ? "s" : ""}`
                : `${taken} joueur(s) inscrit(s)`}
            </span>
          </div>
          {ad.price_info && (
            <div className="flex items-center gap-2">
              <Tag className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{ad.price_info}</span>
            </div>
          )}
        </dl>

        {(coach?.specialties ?? []).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {(coach?.specialties ?? []).slice(0, 3).map((s) => (
              <span
                key={s}
                className="border border-border px-2 py-1 text-[11px] uppercase tracking-wide text-muted-foreground"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {ad.description && (
          <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {ad.description}
          </p>
        )}
      </div>

      <div className="flex flex-col items-stretch justify-center gap-2 md:w-48 md:shrink-0">
        {mine ? (
          <div className="flex items-center justify-center gap-2 border-2 border-pitch px-4 py-3 text-center font-display text-lg uppercase">
            <CheckCircle2 className="size-4" />
            {reservationStatusLabel(mine.status)}
          </div>
        ) : full ? (
          <span className="border-2 border-border px-4 py-3 text-center font-display text-lg uppercase text-muted-foreground">
            Complet
          </span>
        ) : (
          <button
            type="button"
            onClick={() => (user ? setConfirm(true) : navigate({ to: "/auth" }))}
            className="flex items-center justify-center gap-2 bg-volt px-5 py-3 font-display text-xl uppercase text-pitch transition-transform hover:-translate-y-0.5"
          >
            <Ticket className="size-5" />
            Je réserve
          </button>
        )}
        {ad.start_time && (
          <p className="flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-foreground">
            <Clock className="size-3.5" />
            {ad.start_time.slice(0, 5)}
          </p>
        )}
      </div>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-3xl uppercase">
              Confirmer la réservation
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir réserver « {ad.title} » avec {coachName} ? Votre demande sera
              envoyée au préparateur pour validation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={() => void submit()}>
              {busy ? "Envoi…" : "Je confirme"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}
