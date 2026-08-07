import { useEffect, useMemo, useRef, useState } from "react";
import { Shield } from "lucide-react";
import type { FffClub, FffDistrict } from "@/lib/clubs-fff-data";

const inputCls =
  "w-full border border-border bg-card px-3 py-2.5 text-sm outline-none transition-colors focus:border-pitch";

const MAX_RESULTS = 40;

type Group = { district: FffDistrict; clubs: FffClub[] };

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Champ club affilié FFF : recherche libre, résultats groupés par district. */
export function ClubSelect({
  value,
  onChange,
  placeholder = "Rechercher un club (ex : OM, Racing…)",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<{ clubs: FffClub[]; districts: FffDistrict[] } | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => setQuery(value), [value]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function ensureLoaded() {
    if (data) return;
    void import("@/lib/clubs-fff-data").then((m) =>
      setData({ clubs: m.FFF_CLUBS, districts: m.FFF_DISTRICTS }),
    );
  }

  const groups: Group[] = useMemo(() => {
    if (!data) return [];
    const q = normalize(query.trim());
    if (q.length < 2) return [];
    const byDistrict = new Map<number, FffClub[]>();
    let count = 0;
    for (const club of data.clubs) {
      if (count >= MAX_RESULTS) break;
      const [nom, commune] = club;
      if (!normalize(nom).includes(q) && !normalize(commune).includes(q)) continue;
      const di = club[2];
      if (!byDistrict.has(di)) byDistrict.set(di, []);
      byDistrict.get(di)!.push(club);
      count++;
    }
    return [...byDistrict.entries()]
      .map(([di, clubs]) => ({ district: data.districts[di], clubs }))
      .sort((a, b) => a.district.name.localeCompare(b.district.name, "fr"));
  }, [data, query]);

  function pick(club: FffClub) {
    const [nom, commune] = club;
    const label = commune ? `${nom} — ${commune}` : nom;
    onChange(label.slice(0, 100));
    setQuery(label);
    setOpen(false);
  }

  return (
    <div ref={box} className={`relative ${className ?? ""}`}>
      <input
        className={inputCls}
        placeholder={placeholder}
        value={query}
        autoComplete="off"
        onFocus={() => {
          ensureLoaded();
          setOpen(true);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value.slice(0, 100));
          setOpen(true);
        }}
      />
      {open && query.trim().length >= 2 && (
        <div className="absolute z-30 mt-1 max-h-72 w-full overflow-auto border border-border bg-card shadow-lg">
          {!data ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">Chargement des clubs…</p>
          ) : groups.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">Aucun club trouvé.</p>
          ) : (
            groups.map((g) => (
              <div key={g.district.id}>
                <p className="sticky top-0 bg-muted px-3 py-1 text-[11px] uppercase tracking-widest text-muted-foreground">
                  {g.district.name}
                </p>
                {g.clubs.map((club) => (
                  <button
                    key={`${club[0]}-${club[1]}`}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(club)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <Shield className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">
                      {club[0]}
                      {club[1] ? <span className="text-muted-foreground"> — {club[1]}</span> : null}
                    </span>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
