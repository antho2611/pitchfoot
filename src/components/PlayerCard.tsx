import { Link } from "@tanstack/react-router";
import { ageFrom, availabilityLabel, POSITION_SHORT } from "@/lib/football";
import type { Tables } from "@/integrations/supabase/types";

export type PlayerRow = Tables<"players">;

export function PlayerCard({
  player,
  stats,
}: {
  player: PlayerRow;
  stats?: Tables<"player_stats"> | null;
}) {
  const age = ageFrom(player.birth_date);
  const isKeeper = player.main_position === "Gardien";
  const metrics = isKeeper
    ? [
        { label: "Matchs", value: stats?.matches ?? 0 },
        { label: "Clean sheets", value: stats?.clean_sheets ?? 0 },
        { label: "Arrêts", value: stats?.saves ?? 0 },
      ]
    : [
        { label: "Buts", value: stats?.goals ?? 0 },
        { label: "Passes D.", value: stats?.assists ?? 0 },
        { label: "Matchs", value: stats?.matches ?? 0 },
      ];

  return (
    <Link
      to="/joueurs/$id"
      params={{ id: player.id }}
      className="group relative block overflow-hidden border border-pitch/5 bg-card p-4 transition-all hover:shadow-xl hover:shadow-pitch/5"
    >
      <div className="relative mb-4 h-64 w-full overflow-hidden bg-secondary">
        {player.photo_url ? (
          <img
            src={player.photo_url}
            alt={`${player.first_name} ${player.last_name}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center">
            <span className="font-display text-6xl text-pitch/15">
              {(player.first_name?.[0] ?? "?") + (player.last_name?.[0] ?? "")}
            </span>
          </div>
        )}
        <div className="absolute right-2 top-2 bg-pitch px-2 py-1 font-display text-sm text-volt">
          {availabilityLabel(player.availability).toUpperCase()}
        </div>
        {player.is_premium && (
          <div className="absolute left-2 top-2 bg-volt px-2 py-1 text-[10px] font-black uppercase text-pitch">
            Premium
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="truncate font-display text-2xl uppercase leading-tight">
            {player.first_name} {player.last_name}
          </h4>
          <p className="label-xs truncate text-foreground/40">
            {player.current_club || "Sans club"}
            {age ? ` • ${age} ans` : ""}
          </p>
        </div>
        <div className="shrink-0 bg-volt px-2 py-1 text-[10px] font-black tracking-tighter text-pitch">
          {POSITION_SHORT[player.main_position ?? ""] ?? "—"}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 border-t border-pitch/5 pt-4 text-center">
        {metrics.map((m) => (
          <div key={m.label}>
            <p className="label-xs text-foreground/40">{m.label}</p>
            <p className="stat-value">{m.value}</p>
          </div>
        ))}
      </div>
    </Link>
  );
}
