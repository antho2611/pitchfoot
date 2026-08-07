import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

export type CityPick = {
  city: string;
  postcode?: string;
  lat: number;
  lon: number;
  label: string;
};

type Feature = {
  properties: { city?: string; name: string; postcode?: string; label: string };
  geometry: { coordinates: [number, number] };
};

const inputCls =
  "w-full border border-border bg-card px-3 py-2.5 text-sm outline-none transition-colors focus:border-pitch";

/** Champ ville avec autocomplétion (API Adresse — data.gouv.fr) et récupération des coordonnées GPS. */
export function CityAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Ville (ex : Mandelieu)",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (pick: CityPick | null) => void;
  placeholder?: string;
  className?: string;
}) {
  const [items, setItems] = useState<CityPick[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const skip = useRef(false);

  useEffect(() => {
    if (skip.current) {
      skip.current = false;
      return;
    }
    const q = value.trim();
    if (q.length < 2) {
      setItems([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&type=municipality&limit=6`,
          { signal: ctrl.signal },
        );
        const json = (await res.json()) as { features?: Feature[] };
        setItems(
          (json.features ?? []).map((f) => ({
            city: f.properties.city ?? f.properties.name,
            postcode: f.properties.postcode,
            lon: f.geometry.coordinates[0],
            lat: f.geometry.coordinates[1],
            label: f.properties.label,
          })),
        );
        setOpen(true);
      } catch {
        /* requête annulée ou réseau indisponible */
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [value]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pick(item: CityPick) {
    skip.current = true;
    onChange(item.city);
    onSelect(item);
    setOpen(false);
  }

  return (
    <div ref={box} className={`relative ${className ?? ""}`}>
      <input
        className={inputCls}
        placeholder={placeholder}
        value={value}
        autoComplete="off"
        onFocus={() => items.length && setOpen(true)}
        onChange={(e) => {
          onChange(e.target.value);
          onSelect(null);
        }}
      />
      {open && items.length > 0 && (
        <ul className="absolute z-30 mt-1 max-h-64 w-full overflow-auto border border-border bg-card shadow-lg">
          {items.map((it) => (
            <li key={it.label}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(it)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{it.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {loading && (
        <span className="pointer-events-none absolute right-3 top-3 text-[11px] uppercase tracking-widest text-muted-foreground">
          …
        </span>
      )}
    </div>
  );
}
