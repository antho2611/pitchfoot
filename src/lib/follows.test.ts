import { describe, expect, it } from "vitest";
import { isPermissionError } from "./follows";

describe("isPermissionError", () => {
  it("recognizes a Postgres row-level security error", () => {
    expect(isPermissionError(new Error('new row violates row-level security policy for table "conversations"'))).toBe(
      true,
    );
  });

  it("is case-insensitive", () => {
    expect(isPermissionError(new Error("ROW-LEVEL SECURITY violation"))).toBe(true);
  });

  it("recognizes a plain Supabase error object (not an Error instance)", () => {
    expect(isPermissionError({ message: "row-level security policy violated" })).toBe(true);
  });

  it("returns false for unrelated errors", () => {
    expect(isPermissionError(new Error("Network request failed"))).toBe(false);
    expect(isPermissionError(new Error("duplicate key value violates unique constraint"))).toBe(false);
  });

  it("returns false for null/undefined/no message", () => {
    expect(isPermissionError(null)).toBe(false);
    expect(isPermissionError(undefined)).toBe(false);
    expect(isPermissionError({})).toBe(false);
  });
});
