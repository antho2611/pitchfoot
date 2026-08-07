export const POSITIONS = [
  "Gardien",
  "Latéral droit",
  "Latéral gauche",
  "Défenseur central",
  "Milieu défensif",
  "Milieu central",
  "Milieu offensif",
  "Ailier droit",
  "Ailier gauche",
  "Attaquant",
] as const;

export const POSITION_SHORT: Record<string, string> = {
  Gardien: "GB",
  "Latéral droit": "DD",
  "Latéral gauche": "DG",
  "Défenseur central": "DC",
  "Milieu défensif": "MDC",
  "Milieu central": "MC",
  "Milieu offensif": "MOC",
  "Ailier droit": "AD",
  "Ailier gauche": "AG",
  Attaquant: "BU",
};

export const LEVELS = [
  "Ligue 1",
  "Ligue 2",
  "National",
  "National 2",
  "National 3",
  "Régional 1",
  "Régional 2",
  "Régional 3",
  "Départemental",
] as const;

export const FEET = ["Droit", "Gauche", "Les deux"] as const;

export const AVAILABILITY = [
  { value: "recherche_club", label: "Recherche un club" },
  { value: "immediate", label: "Disponible immédiatement" },
  { value: "fin_saison", label: "Disponible en fin de saison" },
  { value: "essai", label: "Recherche un essai" },
  { value: "ouvert", label: "Ouvert aux propositions" },
] as const;

export const availabilityLabel = (v?: string | null) =>
  AVAILABILITY.find((a) => a.value === v)?.label ?? "Ouvert aux propositions";

export type StatField = { key: string; label: string };

const COMMON: StatField[] = [
  { key: "matches", label: "Matchs" },
  { key: "minutes", label: "Minutes" },
];

export function statFieldsFor(position?: string | null): StatField[] {
  if (position === "Gardien") {
    return [
      ...COMMON,
      { key: "clean_sheets", label: "Clean sheets" },
      { key: "saves", label: "Arrêts" },
    ];
  }
  if (position?.startsWith("Défenseur") || position?.startsWith("Latéral")) {
    return [
      ...COMMON,
      { key: "interceptions", label: "Interceptions" },
      { key: "duels_won", label: "Duels gagnés" },
      { key: "tackles", label: "Tacles" },
    ];
  }
  if (position?.startsWith("Milieu")) {
    return [
      ...COMMON,
      { key: "assists", label: "Passes décisives" },
      { key: "pass_accuracy", label: "Précision passes (%)" },
      { key: "recoveries", label: "Récupérations" },
    ];
  }
  return [
    ...COMMON,
    { key: "goals", label: "Buts" },
    { key: "assists", label: "Passes décisives" },
    { key: "shots_on_target", label: "Tirs cadrés" },
  ];
}

export function ageFrom(birthDate?: string | null): number | null {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}
