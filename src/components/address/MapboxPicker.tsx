"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

export interface AddressDetails {
  city?: string;
  district?: string;
  street?: string;
  postcode?: string;
  fullAddress?: string;
  // Saudi National Address fields
  shortAddress?: string;
  buildingNumber?: string;
  additionalNumber?: string;
}

interface Props {
  ar: boolean;
  onSelect: (lat: number, lng: number, address: string, details?: AddressDetails) => void;
}

export default function MapboxPicker({ ar, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<mapboxgl.Map | null>(null);
  const markerRef    = useRef<mapboxgl.Marker | null>(null);

  const [status, setStatus]     = useState<"idle" | "loading" | "error">("idle");
  const [address, setAddress]     = useState("");
  const [shortAddr, setShortAddr] = useState("");
  const [coords, setCoords]       = useState<{ lat: number; lng: number } | null>(null);

  const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_KEY ?? "";
  const onSelectRef = useRef(onSelect);
  const geocodeRef  = useRef<(lat: number, lng: number) => void>(() => {});
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  // Reverse geocode — Saudi National Address API first, fallback to Mapbox
  const geocode = useCallback(async (lat: number, lng: number) => {
    try {
      const lang = ar ? "A" : "E";

      // Try Saudi National Address API
      const naRes = await fetch(`/api/na/geocode?lat=${lat}&long=${lng}&lang=${lang}`);

      if (naRes.ok) {
        const naData = await naRes.json() as {
          Addresses?: Array<{
            BuildingNumber?: string;
            Street?: string;
            District?: string;
            City?: string;
            RegionName?: string;
            ZipCode?: string;
            AdditionalNumber?: string;
            ShortAddress?: string;
          }>;
        };

        const addr = naData?.Addresses?.[0];
        if (addr) {
          const parts = [
            addr.BuildingNumber,
            addr.Street,
            addr.District,
            addr.City,
            addr.RegionName,
          ].filter(Boolean);
          const full = parts.join("، ") || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

          const details: AddressDetails = {
            street:      addr.Street,
            district:    addr.District,
            city:        addr.City,
            postcode:    addr.ZipCode,
            shortAddress: addr.ShortAddress,
            buildingNumber: addr.BuildingNumber,
            additionalNumber: addr.AdditionalNumber,
            fullAddress: full,
          };

          setAddress(full);
          setShortAddr(addr.ShortAddress ?? "");
          setCoords({ lat, lng });
          onSelectRef.current(lat, lng, full, details);
          return;
        }
      }

      // Fallback: Mapbox geocoding
      const mbRes = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?language=${ar ? "ar" : "en"}&types=address,place,neighborhood&access_token=${TOKEN}`
      );
      const mbData = await mbRes.json() as {
        features: Array<{ place_name: string; text?: string; context?: Array<{ id: string; text: string }> }>;
      };
      const feat = mbData.features?.[0];
      const full = feat?.place_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      const ctx  = feat?.context ?? [];
      const get  = (t: string) => ctx.find(c => c.id.startsWith(t))?.text;

      const details: AddressDetails = {
        street: feat?.text, district: get("neighborhood"), city: get("place"),
        postcode: get("postcode"), fullAddress: full,
      };
      setAddress(full);
      setCoords({ lat, lng });
      onSelectRef.current(lat, lng, full, details);
    } catch {
      const fb = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setAddress(fb); setCoords({ lat, lng });
      onSelectRef.current(lat, lng, fb);
    }
  }, [ar, TOKEN]);

  // Keep geocodeRef up to date
  useEffect(() => { geocodeRef.current = geocode; }, [geocode]);

  // Init map — runs ONCE only (no geocode in deps)
  useEffect(() => {
    if (!TOKEN || !containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = TOKEN;

    const RIYADH: [number, number] = [46.6753, 24.7136];

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: {
        version: 8 as const,
        sources: {
          "stadia-dark": {
            type: "raster" as const,
            tiles: [
              "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution: "© Stadia Maps © OpenStreetMap contributors",
          },
        },
        layers: [{ id: "stadia-dark", type: "raster" as const, source: "stadia-dark" }],
      },
      center: RIYADH,
      zoom: 11,
    });

    // Gold marker
    const el = document.createElement("div");
    el.style.cssText = `
      width:34px;height:34px;
      background:linear-gradient(135deg,#C9A24B,#EBCB7C);
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:3px solid #fff;
      box-shadow:0 4px 14px rgba(201,162,75,0.55);
      cursor:grab;
    `;

    const marker = new mapboxgl.Marker({ element: el, draggable: true })
      .setLngLat(RIYADH)
      .addTo(map);

    // Use refs for geocode so no stale closure issues
    const geocodeStable = (lat: number, lng: number) => geocodeRef.current(lat, lng);

    map.on("click", (e) => {
      const { lat, lng } = e.lngLat;
      marker.setLngLat([lng, lat]);
      geocodeStable(lat, lng);
    });

    marker.on("dragend", () => {
      const { lat, lng } = marker.getLngLat();
      geocodeStable(lat, lng);
    });

    mapRef.current    = map;
    markerRef.current = marker;

    return () => { map.remove(); mapRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [TOKEN]); // Only run once — geocode accessed via ref

  const locateMe = () => {
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      ({ coords: c }) => {
        setStatus("idle");
        const { latitude: lat, longitude: lng } = c;
        mapRef.current?.flyTo({ center: [lng, lat], zoom: 16 });
        markerRef.current?.setLngLat([lng, lat]);
        geocode(lat, lng);
      },
      () => setStatus("error"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (!TOKEN) return (
    <div style={{ padding: "1.5rem", textAlign: "center", border: "1px solid rgba(201,162,75,0.2)", borderRadius: 12, color: "#888", fontSize: "0.85rem" }}>
      ⚠️ أضف <code style={{ color: "#C9A24B" }}>NEXT_PUBLIC_MAPBOX_KEY</code> في ملف .env
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {/* Map */}
      <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", border: "1.5px solid rgba(201,162,75,0.3)" }}>
        <div ref={containerRef} style={{ height: 340, width: "100%" }} />
        <button onClick={locateMe} disabled={status === "loading"} style={{
          position: "absolute", bottom: 12, [ar ? "right" : "left"]: 12, zIndex: 10,
          display: "flex", alignItems: "center", gap: "0.5rem",
          padding: "0.6rem 1.1rem", borderRadius: 999, border: "none",
          background: status === "loading" ? "rgba(201,162,75,0.4)" : "linear-gradient(135deg,#C9A24B,#EBCB7C)",
          color: "#2C1E15", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer",
          boxShadow: "0 4px 14px rgba(0,0,0,0.35)", fontFamily: "Tajawal, Cairo, sans-serif",
        }}>
          {status === "loading" ? "⏳" : "📍"}
          {status === "loading" ? (ar ? "جاري التحديد..." : "Locating...") : (ar ? "موقعي الحالي" : "My Location")}
        </button>
      </div>

      {/* Hint */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1rem", borderRadius: 10, background: "rgba(201,162,75,0.06)", border: "1px solid rgba(201,162,75,0.12)" }}>
        <span>💡</span>
        <span style={{ fontSize: "0.78rem", color: "#999" }}>
          {ar ? "اضغط على الخريطة أو اسحب الدبوس الذهبي لتحديد موقعك" : "Click the map or drag the gold pin to set your location"}
        </span>
      </div>

      {/* Selected */}
      {address && (
        <div style={{ padding: "0.9rem 1rem", borderRadius: 12, background: "rgba(201,162,75,0.08)", border: "1.5px solid rgba(201,162,75,0.3)" }}>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <span style={{ fontSize: "1.2rem", marginTop: 2 }}>📌</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.72rem", color: "#C9A24B", fontWeight: 700, marginBottom: "0.2rem" }}>
                {ar ? "الموقع المحدد" : "Selected Location"}
              </div>
              <div style={{ fontSize: "0.83rem", color: "#ccc", lineHeight: 1.6 }}>{address}</div>
              {coords && <div style={{ fontSize: "0.68rem", color: "#555", marginTop: "0.2rem", direction: "ltr" }}>{coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}</div>}
            </div>
          </div>
          {/* Saudi National Short Address */}
          {shortAddr && (
            <div style={{
              marginTop: "0.75rem", padding: "0.5rem 0.85rem", borderRadius: 8,
              background: "rgba(201,162,75,0.12)", border: "1px solid rgba(201,162,75,0.3)",
              display: "flex", alignItems: "center", gap: "0.6rem",
            }}>
              <span style={{ fontSize: "0.85rem" }}>🏷️</span>
              <div>
                <div style={{ fontSize: "0.65rem", color: "rgba(201,162,75,0.7)", fontWeight: 700 }}>
                  {ar ? "العنوان الوطني المختصر" : "National Short Address"}
                </div>
                <div style={{ fontSize: "1rem", color: "#EBCB7C", fontWeight: 800, fontFamily: "monospace", letterSpacing: "0.1em" }}>
                  {shortAddr}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {status === "error" && (
        <div style={{ padding: "0.65rem 1rem", borderRadius: 10, background: "rgba(224,85,85,0.1)", border: "1px solid rgba(224,85,85,0.3)", fontSize: "0.8rem", color: "#e08888" }}>
          {ar ? "⚠️ تعذّر الوصول لموقعك. تأكد من منح الصلاحية." : "⚠️ Could not access your location."}
        </div>
      )}
    </div>
  );
}
