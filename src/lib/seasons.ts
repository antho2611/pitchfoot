/** Saisons "AAAA/AAAA+1" de 2000/2001 à la saison en cours. */
const START_YEAR = 2000;
const CURRENT_YEAR = 2026;

export const SEASONS: string[] = Array.from(
  { length: CURRENT_YEAR - START_YEAR + 1 },
  (_, i) => `${START_YEAR + i}/${START_YEAR + i + 1}`,
);

export const CURRENT_SEASON = SEASONS[SEASONS.length - 1];

/** Saisons les plus récentes en premier — pratique pour les menus déroulants. */
export const SEASONS_DESC = [...SEASONS].reverse();
