import { describe, expect, it } from "vitest";
import { planForAccount, toCsv, PLANS } from "./premium";

describe("planForAccount", () => {
  it("maps each account type to its matching plan", () => {
    expect(planForAccount("club")).toBe("club_premium");
    expect(planForAccount("coach")).toBe("coach_premium");
    expect(planForAccount("player")).toBe("player_premium");
  });

  it("defaults to the player plan for admin or unknown/missing account types", () => {
    expect(planForAccount("admin")).toBe("player_premium");
    expect(planForAccount(undefined)).toBe("player_premium");
    expect(planForAccount(null)).toBe("player_premium");
  });

  it("every plan id returned actually exists in PLANS", () => {
    for (const accountType of ["player", "club", "coach", "admin", undefined]) {
      expect(PLANS[planForAccount(accountType)]).toBeDefined();
    }
  });
});

describe("toCsv", () => {
  it("returns an empty string for no rows", () => {
    expect(toCsv([])).toBe("");
  });

  it("builds a header row from the first row's keys", () => {
    const csv = toCsv([{ name: "Alice", city: "Paris" }]);
    expect(csv.split("\n")[0]).toBe("name,city");
  });

  it("quotes values and escapes embedded quotes and newlines", () => {
    const csv = toCsv([{ note: 'He said "hi"\nagain' }]);
    const dataLine = csv.split("\n")[1];
    expect(dataLine).toBe('"He said ""hi"" again"');
  });
});
