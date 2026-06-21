import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const WFS_BASE = import.meta.env.DEV
  ? "/api/wfs"
  : "https://api.giscaleingenieria.com/wfs";

const WFS_URL = `${WFS_BASE}?service=WFS&version=2.0.0&request=GetFeature&typeNames=secop:departamentos&outputFormat=application/json&srsName=EPSG:4326`;

const API_BASE = import.meta.env.DEV
  ? "/api/secop"
  : "https://www.datos.gov.co/resource/p6dx-8zbt.json";

const STATUS_COLORS = {
  "Activo":      "#22c55e",
  "Adjudicado":  "#3b82f6",
  "Cerrado":     "#ef4444",
  "Publicado":   "#eab308",
  "Desierto":    "#94a3b8",
  "Cancelado":   "#f97316",
};
const STATUS_FALLBACK = "#6b7280";

function normalizar(str) {
  if (!str) return "";
  return str.toUpperCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/\bD\.C\.\b|\bDISTRITO CAPITAL\b/g, "BOGOTA")
    .trim();
}

function getBbox(geometry) {
  const coords = [];
  const collect = (c) => {
    if (typeof c[0] === "number") coords.push(c);
    else c.forEach(collect);
  };
  collect(geometry.coordinates);
  const lngs = coords.map(c => c[0]);
  const lats = coords.map(c => c[1]);
  return [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)];
}

function buildCountUrl(pubDesde) {
  const p = new URLSearchParams();
  p.set("$select", "departamento_entidad,count(referencia_del_proceso) as total");
  p.set("$group", "departamento_entidad");
  p.set("$limit", "200");
  if (pubDesde) p.set("$where", `fecha_de_publicacion_del >= '${pubDesde}T00:00:00'`);
  return `${API_BASE}?${p.toString()}`;
}

function StatusBar({ statuses, total }) {
  if (!statuses || total === 0) return null;
  const entries = Object.entries(statuses)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  return (
    <div style={{ marginTop: 6 }}>
      {entries.map(([estado, count]) => {
        const pct = Math.round((count / total) * 100);
        const color = STATUS_COLORS[estado] || STATUS_FALLBACK;
        return (
          <div key={estado} style={{ marginBottom: 3 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8", marginBottom: 1 }}>
              <span>{estado}</span>
              <span>{pct}%</span>
            </div>
            <div style={{ background: "#1e293b", borderRadius: 2, height: 5, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function GeovisorSecop({ onSelectDepartamento, onClose }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const geojsonRef = useRef(null);
  const statusMapRef = useRef({});   // { NOMBRE_DPT_normalizado: { estado: count } }
  const featuresRef = useRef([]);    // para búsqueda

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [tooltip, setTooltip] = useState(null);
  const [maxContratos, setMaxContratos] = useState(1);

  // Filtros de fecha
  const [pubDesde, setPubDesde] = useState("");

  // Búsqueda
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);

  // ── Actualiza la capa con nuevos datos de conteos ──
  const updateChoropleth = useCallback((contratosMap) => {
    if (!mapRef.current || !geojsonRef.current) return;
    const max = Math.max(...Object.values(contratosMap), 1);
    setMaxContratos(max);

    const updated = {
      ...geojsonRef.current,
      features: geojsonRef.current.features.map(f => ({
        ...f,
        properties: {
          ...f.properties,
          contratos: contratosMap[normalizar(f.properties.NOMBRE_DPT)] || 0,
        },
      })),
    };
    mapRef.current.getSource("departamentos")?.setData(updated);

    // Actualiza el estilo de la coropleta con el nuevo máximo
    mapRef.current.setPaintProperty("departamentos-fill", "fill-color", [
      "case",
      ["==", ["get", "contratos"], 0], "#334155",
      [
        "interpolate", ["linear"], ["get", "contratos"],
        1, "#0c4a6e",
        Math.max(2, Math.round(max * 0.25)), "#0369a1",
        Math.max(3, Math.round(max * 0.5)), "#0ea5e9",
        Math.max(4, Math.round(max * 0.75)), "#38bdf8",
        Math.max(5, max), "#bae6fd",
      ]
    ]);
  }, []);

  // ── Carga o recarga datos SECOP ──
  const fetchSecop = useCallback(async (pubDesde) => {
    try {
      const raw = await fetch(buildCountUrl(pubDesde));
      const data = await raw.json();
      if (!Array.isArray(data)) return;
      const map = {};
      data.forEach(row => {
        if (!row.departamento_entidad) return;
        const key = normalizar(row.departamento_entidad);
        map[key] = (map[key] || 0) + (parseInt(row.total) || 0);
      });
      updateChoropleth(map);
    } catch (e) {
      console.error("[Geovisor] fetchSecop error:", e);
    }
  }, [updateChoropleth]);

  // ── Init mapa ──
  useEffect(() => {
    if (mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "osm-tiles": {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm-tiles" }],
        glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
      },
      center: [-74.0, 4.5],
      zoom: 5,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", async () => {
      try {
        const [geoRes, secopRes, statusRes] = await Promise.all([
          fetch(WFS_URL),
          fetch(buildCountUrl("")),
          fetch(`${API_BASE}?$select=departamento_entidad,estado_del_procedimiento,count(*) as total&$group=departamento_entidad,estado_del_procedimiento&$limit=1000`),
        ]);

        const geojson = await geoRes.json();
        const secopRaw = await secopRes.json();
        const secopData = Array.isArray(secopRaw) ? secopRaw : [];

        // Pre-procesar distribución de estados
        const statusRaw = await statusRes.json();
        if (Array.isArray(statusRaw)) {
          statusRaw.forEach(row => {
            if (!row.departamento_entidad || !row.estado_del_procedimiento) return;
            const key = normalizar(row.departamento_entidad);
            if (!statusMapRef.current[key]) statusMapRef.current[key] = {};
            statusMapRef.current[key][row.estado_del_procedimiento] =
              (statusMapRef.current[key][row.estado_del_procedimiento] || 0) + (parseInt(row.total) || 0);
          });
        }

        // Conteos iniciales
        const contratosMap = {};
        secopData.forEach(row => {
          if (!row.departamento_entidad) return;
          const key = normalizar(row.departamento_entidad);
          contratosMap[key] = (contratosMap[key] || 0) + (parseInt(row.total) || 0);
        });
        const max = Math.max(...Object.values(contratosMap), 1);
        setMaxContratos(max);

        // Enriquecer features
        geojson.features = geojson.features.map(f => ({
          ...f,
          properties: {
            ...f.properties,
            contratos: contratosMap[normalizar(f.properties.NOMBRE_DPT)] || 0,
          },
        }));

        geojsonRef.current = { ...geojson };
        featuresRef.current = geojson.features;

        map.addSource("departamentos", { type: "geojson", data: geojson });

        map.addLayer({
          id: "departamentos-fill",
          type: "fill",
          source: "departamentos",
          paint: {
            "fill-color": [
              "case",
              ["==", ["get", "contratos"], 0], "#334155",
              [
                "interpolate", ["linear"], ["get", "contratos"],
                1, "#0c4a6e",
                Math.max(2, Math.round(max * 0.25)), "#0369a1",
                Math.max(3, Math.round(max * 0.5)), "#0ea5e9",
                Math.max(4, Math.round(max * 0.75)), "#38bdf8",
                Math.max(5, max), "#bae6fd",
              ]
            ],
            "fill-opacity": 0.8,
          },
        });

        map.addLayer({
          id: "departamentos-border",
          type: "line",
          source: "departamentos",
          paint: { "line-color": "#334155", "line-width": 1 },
        });

        map.addLayer({
          id: "departamentos-hover",
          type: "fill",
          source: "departamentos",
          paint: { "fill-color": "#f59e0b", "fill-opacity": 0.35 },
          filter: ["==", "NOMBRE_DPT", ""],
        });

        map.addLayer({
          id: "departamentos-labels",
          type: "symbol",
          source: "departamentos",
          layout: {
            "text-field": [
              "format",
              ["get", "NOMBRE_DPT"], { "font-scale": 1.0 },
              "\n", {},
              ["to-string", ["get", "contratos"]], { "font-scale": 0.75 },
            ],
            "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
            "text-size": ["interpolate", ["linear"], ["zoom"], 4, 8, 7, 12],
            "text-max-width": 8,
            "symbol-placement": "point",
          },
          paint: {
            "text-color": "#f1f5f9",
            "text-halo-color": "#0f172a",
            "text-halo-width": 1.5,
            "text-opacity": ["interpolate", ["linear"], ["zoom"], 4, 0.7, 6, 1],
          },
        });

        // Hover
        map.on("mousemove", "departamentos-fill", (e) => {
          if (!e.features.length) return;
          const f = e.features[0];
          const nombre = f.properties.NOMBRE_DPT;
          const contratos = f.properties.contratos;
          const statuses = statusMapRef.current[normalizar(nombre)] || {};
          const statusTotal = Object.values(statuses).reduce((a, b) => a + b, 0);
          map.setFilter("departamentos-hover", ["==", "NOMBRE_DPT", nombre]);
          map.getCanvas().style.cursor = "pointer";
          setTooltip({ nombre, contratos, statuses, statusTotal, x: e.point.x, y: e.point.y });
        });

        map.on("mouseleave", "departamentos-fill", () => {
          map.setFilter("departamentos-hover", ["==", "NOMBRE_DPT", ""]);
          map.getCanvas().style.cursor = "";
          setTooltip(null);
        });

        map.on("click", "departamentos-fill", (e) => {
          if (!e.features.length) return;
          onSelectDepartamento?.(e.features[0].properties.NOMBRE_DPT);
        });

        setLoading(false);
      } catch (err) {
        console.error("Error cargando geovisor:", err);
        setLoading(false);
      }
    });

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // ── Aplicar filtro de fecha ──
  const handleFiltrar = async () => {
    setUpdating(true);
    await fetchSecop(pubDesde);
    setUpdating(false);
  };

  // ── Búsqueda de departamento ──
  const handleSearch = (text) => {
    setSearch(text);
    if (!text.trim()) { setSearchResults([]); setSearchOpen(false); return; }
    const results = featuresRef.current.filter(f =>
      f.properties.NOMBRE_DPT.toLowerCase().includes(text.toLowerCase())
    );
    setSearchResults(results.slice(0, 6));
    setSearchOpen(true);
  };

  const zoomTo = (feature) => {
    const bbox = getBbox(feature.geometry);
    mapRef.current?.fitBounds(
      [[bbox[0], bbox[1]], [bbox[2], bbox[3]]],
      { padding: 60, duration: 800 }
    );
    setSearch(feature.properties.NOMBRE_DPT);
    setSearchOpen(false);
    setSearchResults([]);
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />

      {/* Loading */}
      {loading && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center",
          justifyContent: "center", background: "rgba(15,23,42,0.85)", color: "#e2e8f0", fontSize: 14,
        }}>
          Cargando mapa y datos SECOP…
        </div>
      )}

      {/* Barra superior: búsqueda + filtro fecha */}
      {!loading && (
        <div style={{
          position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
          display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap",
          background: "#0f172a", border: "1px solid #334155", borderRadius: 10,
          padding: "8px 12px", zIndex: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
          maxWidth: "calc(100% - 160px)",
        }}>
          {/* Búsqueda */}
          <div style={{ position: "relative" }}>
            <input
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="🔍 Buscar departamento…"
              style={{
                background: "#1e293b", border: "1px solid #334155", borderRadius: 6,
                color: "#e2e8f0", padding: "5px 10px", fontSize: 12, width: 190, outline: "none",
              }}
            />
            {searchOpen && searchResults.length > 0 && (
              <div style={{
                position: "absolute", top: "100%", left: 0, marginTop: 4,
                background: "#1e293b", border: "1px solid #334155", borderRadius: 8,
                overflow: "hidden", zIndex: 20, minWidth: 190,
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              }}>
                {searchResults.map(f => (
                  <div
                    key={f.properties.NOMBRE_DPT}
                    onClick={() => zoomTo(f)}
                    style={{
                      padding: "8px 12px", cursor: "pointer", fontSize: 12, color: "#e2e8f0",
                      borderBottom: "1px solid #334155",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#334155"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    {f.properties.NOMBRE_DPT}
                    <span style={{ color: "#38bdf8", marginLeft: 8, fontSize: 11 }}>
                      {(f.properties.contratos || 0).toLocaleString("es-CO")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Separador */}
          <div style={{ width: 1, height: 24, background: "#334155" }} />

          {/* Filtro publicado desde */}
          <span style={{ fontSize: 11, color: "#64748b" }}>Publicado desde</span>
          <input
            type="date" value={pubDesde} onChange={e => setPubDesde(e.target.value)}
            style={{
              background: "#1e293b", border: "1px solid #334155", borderRadius: 6,
              color: "#e2e8f0", padding: "5px 8px", fontSize: 12, outline: "none",
            }}
          />
          <button
            onClick={handleFiltrar}
            disabled={updating}
            style={{
              background: updating ? "#1e293b" : "#0369a1", border: "none", borderRadius: 6,
              color: "#fff", padding: "5px 12px", fontSize: 12, cursor: updating ? "default" : "pointer",
              display: "flex", alignItems: "center", gap: 4,
            }}
          >
            {updating
              ? <><span style={{ width: 10, height: 10, borderRadius: "50%", border: "2px solid #334155", borderTop: "2px solid #38bdf8", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> Actualizando…</>
              : "Aplicar"}
          </button>
          {pubDesde && (
            <button
              onClick={() => { setPubDesde(""); fetchSecop(""); }}
              style={{ background: "transparent", border: "1px solid #475569", borderRadius: 6, color: "#94a3b8", padding: "5px 10px", fontSize: 12, cursor: "pointer" }}
            >✕ Limpiar</button>
          )}
        </div>
      )}

      {/* Tooltip hover */}
      {tooltip && (
        <div style={{
          position: "absolute",
          left: Math.min(tooltip.x + 14, window.innerWidth - 210),
          top: Math.max(tooltip.y - 20, 8),
          background: "#1e293b", border: "1px solid #334155", borderRadius: 10,
          padding: "10px 14px", pointerEvents: "none", fontSize: 13,
          color: "#e2e8f0", zIndex: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
          minWidth: 190,
        }}>
          <div style={{ fontWeight: 700, color: "#38bdf8", fontSize: 13 }}>{tooltip.nombre}</div>
          <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>
            {tooltip.contratos.toLocaleString("es-CO")} contratos
            {pubDesde && <span style={{ color: "#475569", fontSize: 10, marginLeft: 4 }}>(filtrado)</span>}
          </div>
          <StatusBar statuses={tooltip.statuses} total={tooltip.statusTotal} />
          <div style={{ color: "#475569", fontSize: 10, marginTop: 6 }}>Clic para filtrar tabla</div>
        </div>
      )}

      {/* Leyenda */}
      {!loading && (
        <div style={{
          position: "absolute", bottom: 32, left: 12,
          background: "#0f172a", border: "1px solid #334155",
          borderRadius: 8, padding: "10px 14px", fontSize: 11, color: "#94a3b8",
          zIndex: 5,
        }}>
          <div style={{ fontWeight: 600, color: "#e2e8f0", marginBottom: 6 }}>
            Contratos SECOP{pubDesde ? " (filtrado)" : ""}
          </div>
          {[
            { color: "#334155", label: "Sin contratos" },
            { color: "#0c4a6e", label: "Pocos" },
            { color: "#0369a1", label: "Medio" },
            { color: "#38bdf8", label: "Alto" },
            { color: "#bae6fd", label: `Máximo (${maxContratos.toLocaleString("es-CO")})` },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, background: color, flexShrink: 0 }} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Botón volver */}
      <button
        onClick={onClose}
        style={{
          position: "absolute", top: 12, left: 12,
          background: "#1e293b", border: "1px solid #334155",
          borderRadius: 8, color: "#e2e8f0", padding: "8px 14px",
          fontSize: 13, cursor: "pointer", zIndex: 10,
        }}
      >← Volver a tabla</button>
    </div>
  );
}
