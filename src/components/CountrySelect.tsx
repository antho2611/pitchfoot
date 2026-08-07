import { COUNTRIES, flagEmoji } from "@/lib/countries";

const inputCls =
  "w-full border border-border bg-card px-3 py-2.5 text-sm outline-none transition-colors focus:border-pitch";

/** Country/nationality picker — stores the French country name (not the ISO code), each option prefixed with its flag. */
export function CountrySelect({
  value,
  onChange,
  placeholder = "—",
  className,
}: {
  value: string;
  onChange: (name: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <select
      className={`${inputCls} ${className ?? ""}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {COUNTRIES.map((c) => (
        <option key={c.code} value={c.name}>
          {flagEmoji(c.code)} {c.name}
        </option>
      ))}
    </select>
  );
}
