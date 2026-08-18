import { describe, expect, it } from "vitest";
import { CURRENT_SEASON, SEASONS, SEASONS_DESC } from "./seasons";

describe("SEASONS", () => {
  it("starts at 2000/2001", () => {
    expect(SEASONS[0]).toBe("2000/2001");
  });

  it("has consecutive, correctly formatted seasons", () => {
    for (const season of SEASONS) {
      const match = season.match(/^(\d{4})\/(\d{4})$/);
      expect(match).not.toBeNull();
      const [, start, end] = match!;
      expect(Number(end)).toBe(Number(start) + 1);
    }
  });

  it("ends on the current season, exposed as CURRENT_SEASON", () => {
    expect(SEASONS[SEASONS.length - 1]).toBe(CURRENT_SEASON);
  });
});

describe("SEASONS_DESC", () => {
  it("is SEASONS reversed (most recent first) without mutating SEASONS", () => {
    expect(SEASONS_DESC[0]).toBe(CURRENT_SEASON);
    expect(SEASONS_DESC[SEASONS_DESC.length - 1]).toBe(SEASONS[0]);
    expect(SEASONS[0]).toBe("2000/2001");
  });
});
