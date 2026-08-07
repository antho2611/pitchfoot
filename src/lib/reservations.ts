import { supabase } from "@/integrations/supabase/client";
import { notify } from "@/lib/messaging";

export type ReservationStatus = "en_attente" | "acceptee" | "refusee" | "annulee";

export const reservationStatusLabel = (s?: string | null) =>
  s === "acceptee"
    ? "Acceptée"
    : s === "refusee"
      ? "Refusée"
      : s === "annulee"
        ? "Annulée"
        : "En attente";

/** Un joueur réserve une séance : crée une candidature en attente et prévient le préparateur. */
export async function reserveSession(params: {
  annonceId: string;
  playerId: string;
  coachId: string;
  playerName: string;
  title: string;
}) {
  const { error } = await supabase.from("coach_reservations").insert({
    annonce_id: params.annonceId,
    player_id: params.playerId,
    coach_id: params.coachId,
  });
  if (error) {
    if (error.code === "23505") throw new Error("Vous avez déjà réservé cette séance.");
    throw error;
  }
  await notify(
    params.coachId,
    "reservation",
    "Nouvelle demande de réservation",
    `${params.playerName} souhaite participer à « ${params.title} ».`,
    "/tableau-de-bord",
  );
}

/** Le préparateur accepte ou refuse une candidature et notifie le joueur. */
export async function respondReservation(params: {
  reservationId: string;
  playerId: string;
  accept: boolean;
  coachName: string;
  title: string;
}) {
  const { error } = await supabase
    .from("coach_reservations")
    .update({ status: params.accept ? "acceptee" : "refusee" })
    .eq("id", params.reservationId);
  if (error) throw error;

  if (params.accept) {
    await notify(
      params.playerId,
      "reservation_acceptee",
      "Réservation acceptée",
      `${params.coachName} a accepté votre réservation pour « ${params.title} ». Ouvrez la conversation pour organiser la séance.`,
      "/messages",
    );
  } else {
    await notify(
      params.playerId,
      "reservation_refusee",
      "Réservation refusée",
      `${params.coachName} n'a pas pu retenir votre demande pour « ${params.title} ».`,
    );
  }
}
