import { describe, expect, it } from "vitest";
import { ageFrom, availabilityLabel, statFieldsFor } from "./football";

describe("availabilityLabel", () => {
  it("maps a known value to its French label", () => {
    expect(availabilityLabel("immediate")).toBe("Disponible immédiatement");
  });

  it("falls back to the default label for null/undefined/unknown values", () => {
    expect(availabilityLabel(null)).toBe("Ouvert aux propositions");
    expect(availabilityLabel(undefined)).toBe("Ouvert aux propositions");
    expect(availabilityLabel("not_a_real_status")).toBe("Ouvert aux propositions");
  });
});

describe("statFieldsFor", () => {
  it("returns the goalkeeper stat set only for 'Gardien'", () => {
    const keys = statFieldsFor("Gardien").map((f) => f.key);
    expect(keys).toContain("clean_sheets");
    expect(keys).toContain("saves");
    expect(keys).not.toContain("goals");
  });

  it("returns the shared outfield stat set for every other position", () => {
    for (const position of ["Attaquant", "Milieu central", "Latéral droit", undefined, null]) {
      const keys = statFieldsFor(position).map((f) => f.key);
      expect(keys).toContain("goals");
      expect(keys).not.toContain("clean_sheets");
    }
  });
});

describe("ageFrom", () => {
  it("returns null when there is no birth date", () => {
    expect(ageFrom(null)).toBeNull();
    expect(ageFrom(undefined)).toBeNull();
  });

  it("returns null for an unparseable date", () => {
    expect(ageFrom("not-a-date")).toBeNull();
  });

  it("computes a plausible age for a known birth date", () => {
    const twentyYearsAgo = new Date();
    twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20);
    const age = ageFrom(twentyYearsAgo.toISOString().slice(0, 10));
    expect(age).toBeGreaterThanOrEqual(19);
    expect(age).toBeLessThanOrEqual(20);
  });
});
