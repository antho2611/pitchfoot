import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

export type MapClub = {
  id: string;
  name: string;
  logo_url: string | null;
  city: string | null;
  level: string | null;
  latitude: number | null;
  longitude: number | null;
  dist: number | null;
};

type Props = {
  clubs: MapClub[];
  center: { lat: number; lon: number } | null;
  radiusKm: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onViewProfile: (id: string) => void;
  onMoved: (center: { lat: number; lon: number }) => void;
};

const pin = (active: boolean) =>
  L.divIcon({
    className: "",
    html: `<span style="display:grid;place-items:center;width:34px;height:34px;border-radius:9999px;
      background:${active ? "var(--color-volt, #c8ff00)" : "#0d2b1d"};
      color:${active ? "#0d2b1d" : "#ffffff"};
      box-shadow:0 6px 16px rgba(0,0,0,.28);font:700 12px/1 Inter,sans-serif;
      border:2px solid #fff;transition:transform .15s ease;transform:scale(${active ? 1.15 : 1})">⚽</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -16],
  });

/** Carte interactive Leaflet + OpenStreetMap (100 % gratuit, sans clé d'API). */
export default function ClubsMap({
  clubs,
  center,
  radiusKm,
  selectedId,
  onSelect,
  onViewProfile,
  onMoved,
}: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const cluster = useRef<L.MarkerClusterGroup | null>(null);
  const circle = useRef<L.Circle | null>(null);
  const markers = useRef<Record<string, L.Marker>>({});
  const cb = useRef({ onSelect, onViewProfile, onMoved });
  cb.current = { onSelect, onViewProfile, onMoved };

  // Initialisation
  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, { zoomControl: true, scrollWheelZoom: true }).setView(
      [center?.lat ?? 46.6, center?.lon ?? 2.4],
      center ? 10 : 5,
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(m);
    const cg = L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 48 });
    m.addLayer(cg);
    m.on("moveend", () => {
      const c = m.getCenter();
      cb.current.onMoved({ lat: c.lat, lon: c.lng });
    });
    map.current = m;
    cluster.current = cg;
    return () => {
      m.remove();
      map.current = null;
      cluster.current = null;
      markers.current = {};
    };
  }, []);

  // Marqueurs
  useEffect(() => {
    const m = map.current;
    const cg = cluster.current;
    if (!m || !cg) return;
    cg.clearLayers();
    markers.current = {};
    const points: L.LatLngExpression[] = [];

    for (const club of clubs) {
      if (club.latitude == null || club.longitude == null) continue;
      const marker = L.marker([club.latitude, club.longitude], { icon: pin(false) });
      const node = document.createElement("div");
      node.style.minWidth = "210px";
      node.innerHTML = `
        <div style="display:flex;gap:10px;align-items:center">
          ${
            club.logo_url
              ? `<img src="${club.logo_url}" alt="" style="width:44px;height:44px;object-fit:cover;border-radius:6px" />`
              : `<div style="width:44px;height:44px;display:grid;place-items:center;background:#eef2ee;border-radius:6px;font:700 18px/1 Inter,sans-serif">${(club.name[0] ?? "?").toUpperCase()}</div>`
          }
          <div>
            <p style="margin:0;font:700 15px/1.2 Inter,sans-serif">${club.name}</p>
            <p style="margin:2px 0 0;font:400 12px/1.3 Inter,sans-serif;color:#5b6b60">
              ${[club.city, club.level].filter(Boolean).join(" • ") || "Niveau non renseigné"}
              ${club.dist != null ? ` · ${club.dist} km` : ""}
            </p>
          </div>
        </div>`;
      const btn = document.createElement("button");
      btn.textContent = "Voir le profil";
      btn.setAttribute(
        "style",
        "margin-top:10px;width:100%;padding:8px;border:0;background:#0d2b1d;color:#fff;font:700 12px/1 Inter,sans-serif;text-transform:uppercase;letter-spacing:.08em;cursor:pointer",
      );
      btn.onclick = () => cb.current.onViewProfile(club.id);
      node.appendChild(btn);
      marker.bindPopup(node, { closeButton: true });
      marker.on("click", () => cb.current.onSelect(club.id));
      cg.addLayer(marker);
      markers.current[club.id] = marker;
      points.push([club.latitude, club.longitude]);
    }

    if (points.length > 1) m.fitBounds(L.latLngBounds(points).pad(0.2), { animate: true });
    else if (points.length === 1) m.setView(points[0]!, 12, { animate: true });
  }, [clubs]);

  // Cercle du rayon de recherche
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    circle.current?.remove();
    circle.current = null;
    if (!center) return;
    circle.current = L.circle([center.lat, center.lon], {
      radius: radiusKm * 1000,
      color: "#0d2b1d",
      weight: 1,
      fillColor: "#0d2b1d",
      fillOpacity: 0.06,
    }).addTo(m);
  }, [center, radiusKm]);

  // Sélection synchronisée avec la liste
  useEffect(() => {
    const m = map.current;
    const cg = cluster.current;
    if (!m || !cg) return;
    for (const [id, marker] of Object.entries(markers.current)) {
      marker.setIcon(pin(id === selectedId));
    }
    if (!selectedId) return;
    const marker = markers.current[selectedId];
    if (!marker) return;
    m.setView(marker.getLatLng(), Math.max(m.getZoom(), 12), { animate: true });
    cg.zoomToShowLayer(marker, () => marker.openPopup());
  }, [selectedId]);

  return <div ref={el} className="size-full" aria-label="Carte des clubs" />;
}
