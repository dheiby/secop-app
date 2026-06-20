import React, { useState, useEffect, useCallback, useRef } from "react";
import GeovisorSecop from "./GeovisorSecop";
import { api } from "./api.js";

const API_BASE = import.meta.env.DEV
  ? "/api/secop"
  : "https://www.datos.gov.co/resource/p6dx-8zbt.json";

// ── Pantalla de Login ───────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [regUser, setRegUser] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regPass2, setRegPass2] = useState("");
  const [regError, setRegError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = await api.login(username, password);
      onLogin(user.username, user.role);
    } catch (err) {
      setError(err.message || "Error al iniciar sesión");
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError("");
    if (!regUser.trim()) { setRegError("Ingresa un nombre de usuario"); return; }
    if (regPass.length < 6) { setRegError("La contraseña debe tener al menos 6 caracteres"); return; }
    if (regPass !== regPass2) { setRegError("Las contraseñas no coinciden"); return; }
    try {
      const user = await api.register(regUser.trim(), regPass);
      onLogin(user.username, user.role);
    } catch (err) {
      setRegError(err.message || "Error al registrar");
    }
  };

  const inputStyle = {
    width: "100%", padding: "12px 14px", background: "#1e293b", color: "#e2e8f0",
    border: "1px solid #334155", borderRadius: 8, fontSize: 14, outline: "none",
    boxSizing: "border-box", colorScheme: "dark",
  };
  const btnStyle = {
    width: "100%", padding: "12px", background: "#0369a1", color: "#fff",
    border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600,
    cursor: "pointer", transition: "background 0.2s",
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0f172a",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ width: "100%", maxWidth: 400, padding: "0 24px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.5px" }}>
            <span style={{ color: "#38bdf8" }}>SECOP</span><span style={{ color: "#0ea5e9", fontSize: 20, verticalAlign: "super" }}>II</span>
          </div>
          <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>Explorador de Contratación Pública</div>
        </div>

        {!showRegister ? (
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", color: "#94a3b8", fontSize: 12, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Usuario</label>
              <input style={inputStyle} value={username} onChange={e => setUsername(e.target.value)} autoFocus autoComplete="username" />
            </div>
            <div>
              <label style={{ display: "block", color: "#94a3b8", fontSize: 12, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Contraseña</label>
              <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
            </div>
            {error && <div style={{ color: "#f87171", fontSize: 13, textAlign: "center" }}>{error}</div>}
            <button type="submit" style={{ ...btnStyle, opacity: loading ? 0.7 : 1 }} disabled={loading}>
              {loading ? "Verificando..." : "Ingresar"}
            </button>
            <button type="button" onClick={() => setShowRegister(true)}
              style={{ background: "none", border: "none", color: "#38bdf8", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
              Crear nuevo usuario
            </button>
            <div style={{ color: "#475569", fontSize: 11, textAlign: "center" }}>
              Sistema de usuarios centralizado · PostgreSQL
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ color: "#94a3b8", fontSize: 14, marginBottom: 4 }}>Crear nuevo usuario</div>
            <div>
              <label style={{ display: "block", color: "#94a3b8", fontSize: 12, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Usuario</label>
              <input style={inputStyle} value={regUser} onChange={e => setRegUser(e.target.value)} autoFocus />
            </div>
            <div>
              <label style={{ display: "block", color: "#94a3b8", fontSize: 12, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Contraseña</label>
              <input style={inputStyle} type="password" value={regPass} onChange={e => setRegPass(e.target.value)} />
            </div>
            <div>
              <label style={{ display: "block", color: "#94a3b8", fontSize: 12, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Confirmar contraseña</label>
              <input style={inputStyle} type="password" value={regPass2} onChange={e => setRegPass2(e.target.value)} />
            </div>
            {regError && <div style={{ color: "#f87171", fontSize: 13, textAlign: "center" }}>{regError}</div>}
            <button type="submit" style={btnStyle}>Crear usuario</button>
            <button type="button" onClick={() => setShowRegister(false)}
              style={{ background: "none", border: "none", color: "#64748b", fontSize: 13, cursor: "pointer" }}>
              ← Volver al login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const DEPARTAMENTOS = [
  "Todos", "AMAZONAS", "ANTIOQUIA", "ARAUCA", "ATLANTICO", "BOGOTA D.C.", "BOLIVAR",
  "BOYACA", "CALDAS", "CAQUETA", "CASANARE", "CAUCA", "CESAR", "CHOCO",
  "CORDOBA", "CUNDINAMARCA", "GUAINIA", "GUAVIARE", "HUILA", "LA GUAJIRA",
  "MAGDALENA", "META", "NARIÑO", "NORTE DE SANTANDER", "PUTUMAYO", "QUINDIO",
  "RISARALDA", "SAN ANDRES", "SANTANDER", "SUCRE", "TOLIMA", "VALLE DEL CAUCA",
  "VAUPES", "VICHADA"
];

function formatCOP(val) {
  const n = parseFloat(val);
  if (isNaN(n)) return val || "—";
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

function formatDate(val) {
  if (!val) return "—";
  try {
    const d = new Date(val);
    if (isNaN(d)) return val;
    return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return val; }
}

function detectType(key, val) {
  const k = (key || "").toLowerCase();
  if (k.includes("fecha") || k.includes("date")) return "date";
  if (k.includes("precio") || k.includes("valor") || k.includes("cuantia") || k.includes("monto")) return "money";
  return "text";
}

// Días hasta vencimiento de fecha límite
function getDiasVence(fechaStr) {
  if (!fechaStr) return null;
  const fecha = new Date(fechaStr);
  if (isNaN(fecha)) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));
}

function VenceBadge({ fechaStr }) {
  const dias = getDiasVence(fechaStr);
  if (dias === null || dias < 0) return null;
  if (dias === 0) {
    return <span style={{ background: "#7f1d1d", color: "#fca5a5", padding: "2px 7px", borderRadius: 4, fontSize: 10, fontWeight: 700, marginLeft: 6, whiteSpace: "nowrap" }}>HOY</span>;
  }
  if (dias <= 3) {
    return <span style={{ background: "#7f1d1d", color: "#fca5a5", padding: "2px 7px", borderRadius: 4, fontSize: 10, fontWeight: 700, marginLeft: 6, whiteSpace: "nowrap" }}>🔴 {dias}d</span>;
  }
  if (dias <= 7) {
    return <span style={{ background: "#78350f", color: "#fcd34d", padding: "2px 7px", borderRadius: 4, fontSize: 10, fontWeight: 700, marginLeft: 6, whiteSpace: "nowrap" }}>⚡ {dias}d</span>;
  }
  return null;
}

function StatusBadge({ status }) {
  if (!status) return <span style={{ color: "#94a3b8" }}>—</span>;
  const s = status.toLowerCase();
  let bg = "#334155", fg = "#e2e8f0";
  if (s.includes("activ") || s.includes("publicad") || s.includes("abiert")) { bg = "#064e3b"; fg = "#6ee7b7"; }
  else if (s.includes("cerrad") || s.includes("adjudic")) { bg = "#1e1b4b"; fg = "#a5b4fc"; }
  else if (s.includes("cancel") || s.includes("desiert")) { bg = "#450a0a"; fg = "#fca5a5"; }
  else if (s.includes("borrador") || s.includes("liquid")) { bg = "#422006"; fg = "#fcd34d"; }
  else if (s.includes("selecc") || s.includes("evaluac") || s.includes("aprobad")) { bg = "#1e3a5f"; fg = "#93c5fd"; }
  return (
    <span style={{
      background: bg, color: fg, padding: "3px 10px", borderRadius: "4px",
      fontSize: "11px", fontWeight: 600, letterSpacing: "0.02em", whiteSpace: "nowrap",
      textTransform: "uppercase"
    }}>
      {status}
    </span>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "40px 0", justifyContent: "center" }}>
      <div style={{
        width: 22, height: 22, border: "3px solid #334155",
        borderTop: "3px solid #38bdf8", borderRadius: "50%",
        animation: "spin 0.7s linear infinite"
      }} />
      <span style={{ color: "#94a3b8", fontSize: 14 }}>Consultando API SECOP II…</span>
    </div>
  );
}

const SECTION_MAP = {
  "Identificación": ["id_del_proceso","referencia_del_proceso","ppi","id_del_portafolio","codigo_entidad","nit_entidad"],
  "Proceso": ["nombre_del_procedimiento","descripci_n_del_procedimiento","fase","estado_del_procedimiento","estado_resumen","estado_de_apertura_del_proceso"],
  "Entidad": ["entidad","departamento_entidad","ciudad_entidad","ordenentidad","codigo_pci","nombre_de_la_unidad_de","ciudad_de_la_unidad_de"],
  "Fechas": ["fecha_de_publicacion_del","fecha_de_ultima_publicaci","fecha_de_publicacion_fase_3"],
  "Contratación": ["modalidad_de_contratacion","justificaci_n_modalidad_de","tipo_de_contrato","subtipo_de_contrato","duracion","unidad_de_duracion","categorias_adicionales","codigo_principal_de_categoria"],
  "Valores": ["precio_base","valor_total_adjudicacion"],
  "Proveedor": ["adjudicado","nombre_del_proveedor","nit_del_proveedor_adjudicado","codigoproveedor","departamento_proveedor","ciudad_proveedor","nombre_del_adjudicador","id_adjudicacion"],
  "Participación": ["proveedores_invitados","proveedores_con_invitacion","proveedores_que_manifestaron","respuestas_al_procedimiento","respuestas_externas","conteo_de_respuestas_a_ofertas","proveedores_unicos_con","visualizaciones_del","numero_de_lotes"],
};

const SECTION_ICONS = {
  "Identificación": "🔖", "Proceso": "📋", "Entidad": "🏛️",
  "Fechas": "📅", "Contratación": "📝", "Valores": "💰",
  "Proveedor": "🤝", "Participación": "👥",
};

function RecordModal({ row, colLabel, formatCOP, formatDate, detectType, onClose, isSeguido, onToggleSeguimiento }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const seguido = isSeguido(row);
  const diasVence = getDiasVence(row.fecha_de_ultima_publicaci);

  const printRecord = () => {
    const status = row.estado_del_procedimiento || row.estado_resumen || "";
    const url = row.urlproceso?.url || "";

    const kpis = [
      { label: "Precio base", val: row.precio_base ? formatCOP(row.precio_base) : null, color: "#16a34a" },
      { label: "Valor adjudicado", val: row.valor_total_adjudicacion && row.valor_total_adjudicacion !== "0" ? formatCOP(row.valor_total_adjudicacion) : null, color: "#16a34a" },
      { label: "Publicado", val: row.fecha_de_publicacion_del ? formatDate(row.fecha_de_publicacion_del) : null, color: "#1d4ed8" },
      { label: "Límite postulación", val: row.fecha_de_ultima_publicaci ? formatDate(row.fecha_de_ultima_publicaci) : null, color: "#b45309" },
    ].filter(k => k.val);

    const allMapped = Object.values(SECTION_MAP).flat();
    const extras = Object.keys(row).filter(k => !allMapped.includes(k) && !k.startsWith(":@") && k !== "urlproceso");
    const sections = extras.length ? { ...SECTION_MAP, "Otros": extras } : SECTION_MAP;

    const renderSection = (title, fields) => {
      const items = fields.filter(f => {
        const v = row[f];
        return v != null && v !== "" && v !== "No Definido" && v !== "No definido" && v !== "0";
      });
      if (!items.length) return "";
      return `
        <div class="section">
          <div class="section-title">${SECTION_ICONS[title] || "•"} ${title}</div>
          <div class="grid">
            ${items.map(col => {
              const val = row[col];
              if (!val) return "";
              const type = detectType(col, val);
              const display = type === "money" ? formatCOP(val) : type === "date" ? formatDate(val) : String(val);
              const cls = type === "money" ? "money" : type === "date" ? "date" : "";
              return `<div class="field">
                <span class="field-label">${colLabel(col)}</span>
                <span class="field-val ${cls}">${display}</span>
              </div>`;
            }).join("")}
          </div>
        </div>`;
    };

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>${row.referencia_del_proceso || row.id_del_proceso || "Proceso SECOP II"}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1e293b; background: #fff; padding: 24px 28px; }
    .header { border-bottom: 3px solid #0369a1; padding-bottom: 14px; margin-bottom: 16px; }
    .brand { font-size: 11px; font-weight: 700; color: #0369a1; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 6px; }
    h1 { font-size: 15px; font-weight: 700; color: #0f172a; line-height: 1.5; margin-bottom: 8px; }
    .meta { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
    .badge { background: #dcfce7; color: #15803d; border: 1px solid #16a34a; padding: 2px 10px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
    .meta-text { font-size: 11px; color: #64748b; }
    .kpis { display: flex; gap: 12px; flex-wrap: wrap; margin: 14px 0; }
    .kpi { border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 14px; min-width: 130px; background: #f8fafc; }
    .kpi-label { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 3px; letter-spacing: 0.05em; }
    .kpi-val { font-size: 14px; font-weight: 700; }
    .section { margin-bottom: 16px; }
    .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 10px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px 20px; }
    .field { display: flex; flex-direction: column; gap: 2px; }
    .field-label { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.04em; }
    .field-val { font-size: 12px; color: #1e293b; word-break: break-word; }
    .field-val.money { color: #16a34a; font-weight: 700; }
    .field-val.date { color: #1d4ed8; }
    .desc-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; font-size: 12px; line-height: 1.7; color: #334155; margin-bottom: 16px; }
    .footer { margin-top: 16px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">SECOP II — Explorador de Contratación Pública · Colombia</div>
    <h1>${row.nombre_del_procedimiento || "Sin nombre"}</h1>
    <div class="meta">
      ${status ? `<span class="badge">${status}</span>` : ""}
      ${row.id_del_proceso ? `<span class="meta-text">${row.id_del_proceso}</span>` : ""}
      ${row.entidad ? `<span class="meta-text">· ${row.entidad}</span>` : ""}
    </div>
  </div>
  <div class="kpis">
    ${kpis.map(k => `<div class="kpi">
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-val" style="color:${k.color}">${k.val}</div>
    </div>`).join("")}
  </div>
  ${Object.entries(sections).map(([title, fields]) => renderSection(title, fields)).join("")}
  ${row.descripci_n_del_procedimiento ? `
    <div class="section">
      <div class="section-title">📄 Descripción completa</div>
      <div class="desc-box">${row.descripci_n_del_procedimiento}</div>
    </div>` : ""}
  <div class="footer">
    <span>Generado el ${new Date().toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })}</span>
    ${url ? `<span>${url}</span>` : ""}
  </div>
</body>
</html>`;

    const win = window.open("", "_blank", "width=900,height=700");
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  };

  const getValue = (col) => {
    const val = row[col];
    if (val == null || val === "") return null;
    if (typeof val === "object") return val.url || JSON.stringify(val);
    const type = detectType(col, val);
    if (type === "money") return { display: formatCOP(val), color: "#34d399" };
    if (type === "date") return { display: formatDate(val), color: "#93c5fd" };
    return { display: String(val), color: "#e2e8f0" };
  };

  const allMapped = Object.values(SECTION_MAP).flat();
  const extras = Object.keys(row).filter(k => !allMapped.includes(k) && !k.startsWith(":@") && k !== "urlproceso");
  const sections = extras.length ? { ...SECTION_MAP, "Otros": extras } : SECTION_MAP;

  const url = row.urlproceso?.url;
  const status = row.estado_del_procedimiento || row.estado_resumen;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
        zIndex: 1000, display: "flex", alignItems: "flex-start",
        justifyContent: "center", padding: "24px 16px", overflowY: "auto",
        backdropFilter: "blur(4px)"
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#0f172a", border: "1px solid #1e3a5f",
          borderRadius: 12, width: "100%", maxWidth: 860,
          boxShadow: "0 25px 60px rgba(0,0,0,0.6)", overflow: "hidden",
          animation: "fadeIn 0.18s ease"
        }}
      >
        {/* Header modal */}
        <div style={{
          background: "linear-gradient(135deg, #0f2744 0%, #1e293b 100%)",
          borderBottom: "1px solid #1e3a5f", padding: "20px 24px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: "#38bdf8", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
                {row.id_del_proceso || row.referencia_del_proceso || "Detalle del proceso"}
              </div>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#f1f5f9", lineHeight: 1.5 }}>
                {row.nombre_del_procedimiento || "Sin nombre"}
              </h2>
              <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                {status && (
                  <span style={{
                    background: "#064e3b", color: "#6ee7b7",
                    padding: "3px 10px", borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: "uppercase"
                  }}>{status}</span>
                )}
                {diasVence !== null && diasVence >= 0 && diasVence <= 7 && (
                  <span style={{
                    background: diasVence <= 3 ? "#7f1d1d" : "#78350f",
                    color: diasVence <= 3 ? "#fca5a5" : "#fcd34d",
                    padding: "3px 10px", borderRadius: 4, fontSize: 11, fontWeight: 700
                  }}>
                    {diasVence === 0 ? "⚠️ Vence HOY" : diasVence <= 3 ? `🔴 Vence en ${diasVence} día${diasVence > 1 ? "s" : ""}` : `⚡ Vence en ${diasVence} días`}
                  </span>
                )}
                {row.modalidad_de_contratacion && (
                  <span style={{ color: "#64748b", fontSize: 12 }}>· {row.modalidad_de_contratacion}</span>
                )}
                {row.entidad && (
                  <span style={{ color: "#64748b", fontSize: 12 }}>· {row.entidad}</span>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              {/* Botón seguimiento */}
              <button
                onClick={(e) => { e.stopPropagation(); onToggleSeguimiento(row); }}
                title={seguido ? "Quitar de seguimientos" : "Agregar a seguimientos"}
                style={{
                  background: seguido ? "#78350f" : "#1e293b",
                  border: `1px solid ${seguido ? "#d97706" : "#334155"}`,
                  color: seguido ? "#fcd34d" : "#94a3b8",
                  borderRadius: 6, width: 36, height: 32, cursor: "pointer",
                  fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s"
                }}
              >{seguido ? "★" : "☆"}</button>
              <button onClick={onClose} style={{
                background: "#1e293b", border: "1px solid #334155", color: "#94a3b8",
                borderRadius: 6, width: 32, height: 32, cursor: "pointer",
                fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
              }}>✕</button>
            </div>
          </div>

          {/* KPIs rápidos */}
          <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
            {[
              { label: "Precio base", val: row.precio_base ? formatCOP(row.precio_base) : null, color: "#34d399" },
              { label: "Valor adjudicado", val: row.valor_total_adjudicacion && row.valor_total_adjudicacion !== "0" ? formatCOP(row.valor_total_adjudicacion) : null, color: "#34d399" },
              { label: "Publicado", val: row.fecha_de_publicacion_del ? formatDate(row.fecha_de_publicacion_del) : null, color: "#93c5fd" },
              { label: "Límite postulación", val: row.fecha_de_ultima_publicaci ? formatDate(row.fecha_de_ultima_publicaci) : null, color: "#fbbf24" },
            ].filter(k => k.val).map(({ label, val, color }) => (
              <div key={label} style={{
                background: "#1e293b", border: "1px solid #334155",
                borderRadius: 8, padding: "10px 14px", minWidth: 140
              }}>
                <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Secciones */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
          {Object.entries(sections).map(([section, fields]) => {
            const rows = fields.filter(f => {
              const v = row[f];
              return v != null && v !== "" && v !== "No Definido" && v !== "No definido" && v !== "0";
            });
            if (!rows.length) return null;
            return (
              <div key={section}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: "#475569",
                  textTransform: "uppercase", letterSpacing: "0.08em",
                  marginBottom: 10, display: "flex", alignItems: "center", gap: 6,
                  borderBottom: "1px solid #1e293b", paddingBottom: 6
                }}>
                  <span>{SECTION_ICONS[section] || "•"}</span> {section}
                </div>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: "8px 20px"
                }}>
                  {rows.map(col => {
                    const result = getValue(col);
                    if (!result) return null;
                    const display = typeof result === "string" ? result : result.display;
                    const color = typeof result === "object" ? result.color : "#e2e8f0";
                    return (
                      <div key={col} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          {colLabel(col)}
                        </span>
                        <span style={{ fontSize: 13, color, lineHeight: 1.5, wordBreak: "break-word" }}>
                          {display}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Descripción completa */}
          {row.descripci_n_del_procedimiento && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, borderBottom: "1px solid #1e293b", paddingBottom: 6 }}>
                📄 Descripción completa
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "#cbd5e1", lineHeight: 1.7, background: "#1e293b", padding: "12px 16px", borderRadius: 8, border: "1px solid #334155" }}>
                {row.descripci_n_del_procedimiento}
              </p>
            </div>
          )}

          {/* Acciones */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {url && (
              <a href={url} target="_blank" rel="noopener noreferrer" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "#0369a1", color: "#fff", padding: "10px 20px",
                borderRadius: 8, fontSize: 13, fontWeight: 600,
                textDecoration: "none", transition: "background 0.2s"
              }}
                onMouseEnter={e => e.currentTarget.style.background = "#0284c7"}
                onMouseLeave={e => e.currentTarget.style.background = "#0369a1"}
              >
                🔗 Ver en SECOP II
              </a>
            )}
            <button
              onClick={printRecord}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "#1e293b", color: "#e2e8f0", padding: "10px 20px",
                borderRadius: 8, fontSize: 13, fontWeight: 600,
                border: "1px solid #334155", cursor: "pointer", transition: "background 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#273548"}
              onMouseLeave={e => e.currentTarget.style.background = "#1e293b"}
            >
              🖨️ Descargar PDF
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleSeguimiento(row); }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: seguido ? "#78350f" : "#1e293b",
                color: seguido ? "#fcd34d" : "#94a3b8",
                padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                border: `1px solid ${seguido ? "#d97706" : "#334155"}`,
                cursor: "pointer", transition: "all 0.2s"
              }}
            >
              {seguido ? "★ En seguimientos" : "☆ Agregar a seguimientos"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AppRoot() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState("user");
  const [checking, setChecking] = useState(true);

  // Validar JWT existente al cargar
  useEffect(() => {
    api.me()
      .then(u => { if (u) { setCurrentUser(u.username); setUserRole(u.role); } })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  const handleLogin = (username, role = "user") => { setCurrentUser(username); setUserRole(role); };
  const handleLogout = () => { api.logout(); setCurrentUser(null); setUserRole("user"); };

  if (checking) return (
    <div style={{ minHeight: "100vh", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: 14 }}>
      Verificando sesión…
    </div>
  );
  if (!currentUser) return <LoginScreen onLogin={handleLogin} />;
  return <SecopExplorer currentUser={currentUser} userRole={userRole} onLogout={handleLogout} />;
}

function SecopExplorer({ currentUser, userRole, onLogout }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deptosFiltro, setDeptosFiltro] = useState([]);
  const [deptosOpen, setDeptosOpen] = useState(false);
  const deptosRef = useRef(null);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(100);
  const [offset, setOffset] = useState(0);
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [pubDesde, setPubDesde] = useState("");
  const [apiUsed, setApiUsed] = useState("");
  const [columns, setColumns] = useState([]);
  const [sortCol, setSortCol] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedRow, setSelectedRow] = useState(null);
  const [estadosFiltro, setEstadosFiltro] = useState([]);
  const [estadosOpen, setEstadosOpen] = useState(false);
  const [todosLosEstados, setTodosLosEstados] = useState([]);
  const estadosRef = useRef(null);
  const [fetchTime, setFetchTime] = useState(null);
  const tableRef = useRef(null);

  // Nuevos estados
  const [unspsc, setUnspsc] = useState("");
  const [vistaPanel, setVistaPanel] = useState("todos"); // "todos" | "seguimientos"
  const [vistaGeovisor, setVistaGeovisor] = useState(false);
  const [seguimientos, setSeguimientos] = useState([]);

  // Cargar seguimientos desde la API al iniciar sesión
  useEffect(() => {
    api.getSeguimientos()
      .then(data => setSeguimientos(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [currentUser]);

  const getProcesoId = (row) =>
    row.id_del_proceso || row.referencia_del_proceso || row.nombre_del_procedimiento || row._seguimiento_id;

  const toggleSeguimiento = useCallback(async (row) => {
    const id = getProcesoId(row);
    const existe = seguimientos.some(r => getProcesoId(r) === id);
    if (existe) {
      setSeguimientos(prev => prev.filter(r => getProcesoId(r) !== id));
      api.removeSeguimiento(row).catch(() => {});
    } else {
      setSeguimientos(prev => [...prev, row]);
      api.addSeguimiento(row).catch(() => {});
    }
  }, [seguimientos]);

  const isSeguido = useCallback((row) => {
    const id = getProcesoId(row);
    return seguimientos.some(r => getProcesoId(r) === id);
  }, [seguimientos]);

  const PRIORITY_COLS = [
    "nombre_del_procedimiento", "entidad", "estado_del_procedimiento",
    "fecha_de_publicacion_del", "fecha_de_ultima_publicaci",
    "precio_base", "departamento_entidad", "modalidad_de_contratacion",
    "tipo_de_contrato", "fase", "valor_total_adjudicacion",
    "descripci_n_del_procedimiento", "nit_entidad",
    "id_del_proceso", "referencia_del_proceso", "ciudad_entidad"
  ];

  const COL_LABELS = {
    "nombre_del_procedimiento": "Proceso",
    "entidad": "Entidad",
    "estado_del_procedimiento": "Estado",
    "fecha_de_publicacion_del": "Publicado",
    "fecha_de_ultima_publicaci": "Límite Postulación",
    "fecha_de_publicacion_fase_3": "Fase 3",
    "precio_base": "Precio Base",
    "departamento_entidad": "Departamento",
    "ciudad_entidad": "Ciudad",
    "modalidad_de_contratacion": "Modalidad",
    "tipo_de_contrato": "Tipo Contrato",
    "fase": "Fase",
    "valor_total_adjudicacion": "Valor Adjudicado",
    "descripci_n_del_procedimiento": "Descripción",
    "nit_entidad": "NIT",
    "id_del_proceso": "ID Proceso",
    "referencia_del_proceso": "Referencia",
    "codigo_principal_de_categoria": "UNSPSC",
  };

  const SKIP_COLS = [":@computed_region", "localizaci_n", "ubicacion"];
  const CACHE_TTL = 30 * 60 * 1000; // 30 minutos en memoria
  const LS_CACHE_KEY = "secop_query_cache";
  const LS_CACHE_TTL = 4 * 60 * 60 * 1000; // 4 horas en localStorage

  // Caché en memoria
  const queryCache = useRef(new Map());
  const [refreshing, setRefreshing] = useState(false);

  // Persistir caché en localStorage al guardar
  const saveToLS = useCallback((url, entry) => {
    try {
      const stored = JSON.parse(localStorage.getItem(LS_CACHE_KEY) || "{}");
      stored[url] = entry;
      // Limpiar entradas viejas (> 4h)
      const now = Date.now();
      Object.keys(stored).forEach(k => { if (now - stored[k].ts > LS_CACHE_TTL) delete stored[k]; });
      localStorage.setItem(LS_CACHE_KEY, JSON.stringify(stored));
    } catch (_) {}
  }, []);

  const loadFromLS = useCallback((url) => {
    try {
      const stored = JSON.parse(localStorage.getItem(LS_CACHE_KEY) || "{}");
      const entry = stored[url];
      if (entry && Date.now() - entry.ts < LS_CACHE_TTL) return entry;
    } catch (_) {}
    return null;
  }, []);

  const buildUrl = useCallback(() => {
    let url = `${API_BASE}?$limit=${limit}&$offset=${offset}`;
    const filters = [];
    const sinDepto = deptosFiltro.includes("__SIN_DEPTO__");
    const deptosSolo = deptosFiltro.filter(d => d !== "__SIN_DEPTO__");
    if (sinDepto || deptosSolo.length > 0) {
      const partes = [];
      if (deptosSolo.length === 1) partes.push(`upper(departamento_entidad) like '%${deptosSolo[0].toUpperCase()}%'`);
      else if (deptosSolo.length > 1) partes.push(`(${deptosSolo.map(d => `upper(departamento_entidad) like '%${d.toUpperCase()}%'`).join(" OR ")})`);
      if (sinDepto) partes.push(`(departamento_entidad is null OR upper(departamento_entidad) like '%NO DEFINIDO%' OR departamento_entidad = '')`);
      filters.push(partes.length === 1 ? partes[0] : `(${partes.join(" OR ")})`);
    }
    if (search.trim()) {
      const txt = search.trim().toUpperCase().replace(/'/g, "''");
      filters.push(`(upper(nombre_del_procedimiento) like '%${txt}%' OR upper(entidad) like '%${txt}%' OR upper(descripci_n_del_procedimiento) like '%${txt}%')`);
    }
    if (pubDesde) filters.push(`fecha_de_publicacion_del >= '${pubDesde}T00:00:00.000'`);
    if (fechaDesde) filters.push(`fecha_de_ultima_publicaci >= '${fechaDesde}T00:00:00.000'`);
    if (fechaHasta) filters.push(`fecha_de_ultima_publicaci <= '${fechaHasta}T23:59:59.000'`);
    if (estadosFiltro.length) {
      const vals = estadosFiltro.map(e => `'${e.replace(/'/g, "''")}'`).join(",");
      filters.push(`estado_del_procedimiento in(${vals})`);
    }
    if (unspsc.trim()) {
      const cod = unspsc.trim().replace(/'/g, "''");
      filters.push(`upper(codigo_principal_de_categoria) like '%${cod.toUpperCase()}%'`);
    }
    if (filters.length) url += `&$where=${encodeURIComponent(filters.join(" AND "))}`;
    url += "&$order=fecha_de_publicacion_del DESC";
    return url;
  }, [deptosFiltro, search, limit, offset, pubDesde, fechaDesde, fechaHasta, estadosFiltro, unspsc]);

  const applyJson = useCallback((json) => {
    if (json.length > 0) {
      const allKeys = Object.keys(json[0]);
      const filtered = allKeys.filter(k => !SKIP_COLS.some(s => k.toLowerCase().includes(s)));
      const sortedCols = filtered.sort((a, b) => {
        const ai = PRIORITY_COLS.indexOf(a.toLowerCase());
        const bi = PRIORITY_COLS.indexOf(b.toLowerCase());
        if (ai >= 0 && bi >= 0) return ai - bi;
        if (ai >= 0) return -1;
        if (bi >= 0) return 1;
        return a.localeCompare(b);
      });
      setColumns(sortedCols);
    }
    setData(json);
    const nuevos = json.map(r => r.estado_del_procedimiento).filter(Boolean);
    setTodosLosEstados(prev => [...new Set([...prev, ...nuevos])].sort());
  }, []);

  // Fetch con retry automático
  const fetchWithRetry = useCallback(async (url, retries = 3, delay = 2000) => {
    for (let i = 0; i < retries; i++) {
      const response = await fetch(url);
      if (response.ok) return response.json();
      if (response.status === 503 && i < retries - 1) {
        await new Promise(r => setTimeout(r, delay * (i + 1)));
        continue;
      }
      throw new Error(`HTTP ${response.status}`);
    }
  }, []);

  const fetchData = useCallback(async () => {
    const url = buildUrl();
    const now = Date.now();

    // 1. Caché en memoria (válida)
    const memCached = queryCache.current.get(url);
    if (memCached && (now - memCached.ts) < CACHE_TTL) {
      applyJson(memCached.json);
      setFetchTime(memCached.ms);
      setApiUsed("SECOP II ⚡");
      setError(null);
      // Refrescar en fondo
      setRefreshing(true);
      try {
        const t0 = Date.now();
        const json = await fetchWithRetry(url);
        const ms = Date.now() - t0;
        const entry = { json, ts: Date.now(), ms };
        queryCache.current.set(url, entry);
        saveToLS(url, entry);
        applyJson(json);
        setFetchTime(ms);
        setApiUsed("SECOP II");
      } catch (_) {}
      finally { setRefreshing(false); }
      return;
    }

    // 2. Caché en localStorage (datos del día)
    const lsCached = loadFromLS(url);
    if (lsCached) {
      applyJson(lsCached.json);
      setFetchTime(lsCached.ms);
      setApiUsed("SECOP II 💾");
      setError(null);
      queryCache.current.set(url, lsCached);
      // Intentar actualizar en fondo sin bloquear
      setRefreshing(true);
      fetchWithRetry(url).then(json => {
        const ms = 0;
        const entry = { json, ts: Date.now(), ms };
        queryCache.current.set(url, entry);
        saveToLS(url, entry);
        applyJson(json);
        setApiUsed("SECOP II");
      }).catch(() => {}).finally(() => setRefreshing(false));
      return;
    }

    // 3. Sin caché: carga normal
    setLoading(true);
    setError(null);
    const t0 = Date.now();
    try {
      const json = await fetchWithRetry(url);
      const ms = Date.now() - t0;
      const entry = { json, ts: Date.now(), ms };
      queryCache.current.set(url, entry);
      saveToLS(url, entry);
      applyJson(json);
      setFetchTime(ms);
      setApiUsed("SECOP II");
    } catch (err) {
      // Solo mostrar error si no hay datos visibles
      setData(prev => {
        if (prev.length === 0) setError(`Error consultando SECOP: ${err.message}`);
        return prev;
      });
    } finally {
      setLoading(false);
    }
  }, [buildUrl, applyJson, fetchWithRetry, saveToLS, loadFromLS]);

  useEffect(() => {
    const timer = setTimeout(() => { fetchData(); }, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const sorted = [...data].sort((a, b) => {
    if (!sortCol) return 0;
    const va = (a[sortCol] || "").toString();
    const vb = (b[sortCol] || "").toString();
    const na = parseFloat(va), nb = parseFloat(vb);
    if (!isNaN(na) && !isNaN(nb)) return sortAsc ? na - nb : nb - na;
    return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
  });

  // Datos a mostrar según vista activa
  const displayData = vistaPanel === "seguimientos" ? seguimientos : sorted;

  const FIXED_COLS = [
    "nombre_del_procedimiento", "entidad", "estado_del_procedimiento",
    "fecha_de_publicacion_del", "fecha_de_ultima_publicaci",
    "precio_base", "departamento_entidad", "modalidad_de_contratacion"
  ];
  const visibleCols = FIXED_COLS.filter(c => columns.includes(c) || vistaPanel === "seguimientos");

  const stats = {
    total: data.length,
    deptos: [...new Set(data.map(r => r.departamento || r.departamento_entidad).filter(Boolean))].length,
    entidades: [...new Set(data.map(r => r.entidad || r.nombre_entidad).filter(Boolean))].length,
  };

  // Cerrar dropdowns al clic fuera
  useEffect(() => {
    const handler = (e) => {
      if (estadosRef.current && !estadosRef.current.contains(e.target)) setEstadosOpen(false);
      if (deptosRef.current && !deptosRef.current.contains(e.target)) setDeptosOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const colLabel = (c) => COL_LABELS[c] || c.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

  const cellValue = (row, col) => {
    const val = row[col];
    if (val == null || val === "") return "—";
    const type = detectType(col, val);
    if (type === "money") return formatCOP(val);
    if (type === "date") return formatDate(val);
    const s = String(val);
    return s.length > 60 ? s.slice(0, 57) + "…" : s;
  };

  return (
    <div style={{
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      background: "#0b1120", color: "#e2e8f0", minHeight: "100vh", padding: "0"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { height: 6px; width: 6px; }
        ::-webkit-scrollbar-track { background: #1e293b; }
        ::-webkit-scrollbar-thumb { background: #475569; border-radius: 3px; }
        .star-btn:hover { color: #fcd34d !important; border-color: #d97706 !important; background: #78350f !important; }
      `}</style>

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        borderBottom: "1px solid #1e3a5f", padding: "24px 28px 20px"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
            <h1 style={{
              margin: 0, fontSize: 22, fontWeight: 700, color: "#f1f5f9",
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.03em"
            }}>
              SECOP<span style={{ color: "#38bdf8" }}>II</span>
            </h1>
            <span style={{ color: "#64748b", fontSize: 13, fontWeight: 500 }}>
              Explorador de Contratación Pública — Colombia
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => setVistaGeovisor(v => !v)}
              style={{
                padding: "4px 12px", background: vistaGeovisor ? "#0369a1" : "transparent",
                color: vistaGeovisor ? "#fff" : "#38bdf8",
                border: "1px solid #0369a1", borderRadius: 6, fontSize: 12,
                cursor: "pointer", transition: "all 0.2s",
              }}
            >🗺️ Geovisor</button>
            <span style={{ fontSize: 12, color: "#64748b" }}>👤 <strong style={{ color: "#94a3b8" }}>{currentUser}</strong></span>
            <button onClick={onLogout} style={{
              padding: "4px 12px", background: "transparent", color: "#475569",
              border: "1px solid #334155", borderRadius: 6, fontSize: 12,
              cursor: "pointer", transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.borderColor = "#f87171"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#475569"; e.currentTarget.style.borderColor = "#334155"; }}
            >Cerrar sesión</button>
          </div>
        </div>
        {apiUsed && (
          <div style={{ marginTop: 8, display: "flex", gap: 16, flexWrap: "wrap", fontSize: 11, color: "#64748b" }}>
            <span>API: <span style={{ color: "#38bdf8", fontFamily: "'JetBrains Mono', monospace" }}>{apiUsed}</span></span>
            <span>{stats.total} procesos · {stats.deptos} deptos · {stats.entidades} entidades</span>
            {fetchTime && <span>{fetchTime}ms</span>}
            {refreshing && <span style={{ color: "#38bdf8", display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", border: "2px solid #334155", borderTop: "2px solid #38bdf8", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> actualizando…</span>}
          </div>
        )}
      </div>

      {/* Geovisor */}
      {vistaGeovisor && (
        <div style={{ width: "100%", height: "calc(100vh - 90px)" }}>
          <GeovisorSecop
            onClose={() => setVistaGeovisor(false)}
            onSelectDepartamento={(nombre) => {
              setDeptosFiltro([nombre.toUpperCase()]);
              setVistaGeovisor(false);
            }}
          />
        </div>
      )}

      {/* Main content — oculto cuando el geovisor está activo */}
      {!vistaGeovisor && <>

      {/* Filters */}
      <div style={{
        padding: "16px 28px", background: "#0f172a",
        borderBottom: "1px solid #1e293b",
        display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end"
      }}>
        {/* Departamento */}
        <div style={{ flex: "1 1 200px" }}>
          <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Departamento
          </label>
          <div ref={deptosRef} style={{ position: "relative" }}>
            <button
              onClick={() => setDeptosOpen(o => !o)}
              style={{
                width: "100%", padding: "8px 12px", background: deptosFiltro.length ? "#0c3a5e" : "#1e293b",
                color: deptosFiltro.length ? "#38bdf8" : "#e2e8f0",
                border: `1px solid ${deptosFiltro.length ? "#0369a1" : "#334155"}`,
                borderRadius: 6, fontSize: 13, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8, textAlign: "left"
              }}
            >
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {deptosFiltro.length === 0 ? "Todos los departamentos" : deptosFiltro.length === 1 ? (deptosFiltro[0] === "__SIN_DEPTO__" ? "Sin departamento" : deptosFiltro[0]) : `${deptosFiltro.length} seleccionados`}
              </span>
              <span style={{ fontSize: 10, flexShrink: 0 }}>{deptosOpen ? "▲" : "▼"}</span>
            </button>
            {deptosOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 200,
                background: "#1e293b", border: "1px solid #334155", borderRadius: 8,
                width: "100%", minWidth: 220, maxHeight: 280, overflowY: "auto",
                boxShadow: "0 12px 32px rgba(0,0,0,0.5)"
              }}>
                {deptosFiltro.length > 0 && (
                  <div onClick={() => setDeptosFiltro([])} style={{ padding: "8px 14px", fontSize: 12, color: "#f87171", cursor: "pointer", borderBottom: "1px solid #334155" }}>
                    ✕ Limpiar selección
                  </div>
                )}
                {/* Opción especial: Sin departamento */}
                {(() => {
                  const checked = deptosFiltro.includes("__SIN_DEPTO__");
                  return (
                    <div
                      key="__SIN_DEPTO__"
                      onClick={() => setDeptosFiltro(prev => checked ? prev.filter(d => d !== "__SIN_DEPTO__") : [...prev, "__SIN_DEPTO__"])}
                      style={{
                        padding: "9px 14px", display: "flex", alignItems: "center", gap: 10,
                        cursor: "pointer", fontSize: 13,
                        background: checked ? "#1a1a2e" : "transparent",
                        color: checked ? "#a78bfa" : "#94a3b8",
                        borderBottom: "1px solid #334155",
                      }}
                      onMouseEnter={e => { if (!checked) e.currentTarget.style.background = "#273548"; }}
                      onMouseLeave={e => { if (!checked) e.currentTarget.style.background = "transparent"; }}
                    >
                      <span style={{
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                        border: `2px solid ${checked ? "#a78bfa" : "#475569"}`,
                        background: checked ? "#a78bfa" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, color: "#0f172a", fontWeight: 700
                      }}>{checked ? "✓" : ""}</span>
                      📍 Sin departamento
                    </div>
                  );
                })()}
                {DEPARTAMENTOS.filter(d => d !== "Todos").map(dep => {
                  const checked = deptosFiltro.includes(dep);
                  return (
                    <div
                      key={dep}
                      onClick={() => setDeptosFiltro(prev => checked ? prev.filter(d => d !== dep) : [...prev, dep])}
                      style={{
                        padding: "9px 14px", display: "flex", alignItems: "center", gap: 10,
                        cursor: "pointer", fontSize: 13,
                        background: checked ? "#0c3a5e" : "transparent",
                        color: checked ? "#38bdf8" : "#cbd5e1",
                      }}
                      onMouseEnter={e => { if (!checked) e.currentTarget.style.background = "#273548"; }}
                      onMouseLeave={e => { if (!checked) e.currentTarget.style.background = "transparent"; }}
                    >
                      <span style={{
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                        border: `2px solid ${checked ? "#38bdf8" : "#475569"}`,
                        background: checked ? "#38bdf8" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, color: "#0f172a", fontWeight: 700
                      }}>{checked ? "✓" : ""}</span>
                      {dep}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Buscar */}
        <div style={{ flex: "1 1 200px" }}>
          <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Buscar en resultados
          </label>
          <input
            type="text"
            placeholder="Entidad, objeto, palabra clave…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "8px 12px", background: "#1e293b", color: "#e2e8f0",
              border: "1px solid #334155", borderRadius: 6, fontSize: 13, outline: "none"
            }}
          />
        </div>

        {/* UNSPSC */}
        <div style={{ flex: "0 1 160px" }}>
          <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Código UNSPSC
          </label>
          <input
            type="text"
            placeholder="Ej: 72101500"
            value={unspsc}
            onChange={e => setUnspsc(e.target.value)}
            style={{
              width: "100%", padding: "8px 12px",
              background: unspsc ? "#0c3a5e" : "#1e293b",
              color: unspsc ? "#38bdf8" : "#e2e8f0",
              border: `1px solid ${unspsc ? "#0369a1" : "#334155"}`,
              borderRadius: 6, fontSize: 13, outline: "none"
            }}
          />
        </div>

        {/* Estado */}
        <div ref={estadosRef} style={{ flex: "0 0 auto", position: "relative" }}>
          <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Estado
          </label>
          <button
            onClick={() => setEstadosOpen(o => !o)}
            style={{
              padding: "8px 12px", background: estadosFiltro.length ? "#0c3a5e" : "#1e293b",
              color: estadosFiltro.length ? "#38bdf8" : "#e2e8f0",
              border: `1px solid ${estadosFiltro.length ? "#0369a1" : "#334155"}`,
              borderRadius: 6, fontSize: 13, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", minWidth: 160
            }}
          >
            {estadosFiltro.length ? `${estadosFiltro.length} estado${estadosFiltro.length > 1 ? "s" : ""}` : "Todos los estados"}
            <span style={{ marginLeft: "auto", fontSize: 10 }}>{estadosOpen ? "▲" : "▼"}</span>
          </button>
          {estadosOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 200,
              background: "#1e293b", border: "1px solid #334155", borderRadius: 8,
              minWidth: 220, maxHeight: 280, overflowY: "auto",
              boxShadow: "0 12px 32px rgba(0,0,0,0.5)"
            }}>
              {estadosFiltro.length > 0 && (
                <div onClick={() => setEstadosFiltro([])} style={{ padding: "8px 14px", fontSize: 12, color: "#f87171", cursor: "pointer", borderBottom: "1px solid #334155" }}>
                  ✕ Limpiar selección
                </div>
              )}
              {todosLosEstados.length === 0 && (
                <div style={{ padding: "12px 14px", fontSize: 12, color: "#64748b" }}>Carga datos primero</div>
              )}
              {todosLosEstados.map(est => {
                const checked = estadosFiltro.includes(est);
                return (
                  <div
                    key={est}
                    onClick={() => setEstadosFiltro(prev => checked ? prev.filter(e => e !== est) : [...prev, est])}
                    style={{
                      padding: "9px 14px", display: "flex", alignItems: "center", gap: 10,
                      cursor: "pointer", fontSize: 13,
                      background: checked ? "#0c3a5e" : "transparent",
                      color: checked ? "#38bdf8" : "#cbd5e1",
                    }}
                    onMouseEnter={e => { if (!checked) e.currentTarget.style.background = "#273548"; }}
                    onMouseLeave={e => { if (!checked) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span style={{
                      width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                      border: `2px solid ${checked ? "#38bdf8" : "#475569"}`,
                      background: checked ? "#38bdf8" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, color: "#0f172a", fontWeight: 700
                    }}>{checked ? "✓" : ""}</span>
                    {est}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Fecha publicación desde */}
        <div style={{ flex: "0 0 auto" }}>
          <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Publicación desde
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <input type="date" value={pubDesde} onChange={e => setPubDesde(e.target.value)}
              style={{ padding: "8px 10px", background: pubDesde ? "#0c3a5e" : "#1e293b", color: pubDesde ? "#38bdf8" : "#e2e8f0", border: `1px solid ${pubDesde ? "#0369a1" : "#334155"}`, borderRadius: 6, fontSize: 13, outline: "none", colorScheme: "dark" }} />
            {pubDesde && (
              <button onClick={() => setPubDesde("")} title="Limpiar"
                style={{ padding: "8px 8px", background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>✕</button>
            )}
          </div>
        </div>

        {/* Fecha límite */}
        <div style={{ flex: "0 0 auto" }}>
          <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Límite postulación
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
              style={{ padding: "8px 10px", background: fechaDesde ? "#0c3a5e" : "#1e293b", color: fechaDesde ? "#38bdf8" : "#e2e8f0", border: `1px solid ${fechaDesde ? "#0369a1" : "#334155"}`, borderRadius: 6, fontSize: 13, outline: "none", colorScheme: "dark" }} />
            <span style={{ color: "#475569", fontSize: 12 }}>–</span>
            <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
              style={{ padding: "8px 10px", background: fechaHasta ? "#0c3a5e" : "#1e293b", color: fechaHasta ? "#38bdf8" : "#e2e8f0", border: `1px solid ${fechaHasta ? "#0369a1" : "#334155"}`, borderRadius: 6, fontSize: 13, outline: "none", colorScheme: "dark" }} />
            {(fechaDesde || fechaHasta) && (
              <button onClick={() => { setFechaDesde(""); setFechaHasta(""); }} title="Limpiar fechas"
                style={{ padding: "6px 8px", background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>✕</button>
            )}
          </div>
        </div>

        {/* Registros */}
        <div style={{ flex: "0 0 110px" }}>
          <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Registros
          </label>
          <select value={limit} onChange={e => setLimit(Number(e.target.value))}
            style={{ width: "100%", padding: "8px 12px", background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155", borderRadius: 6, fontSize: 13, outline: "none", cursor: "pointer" }}>
            {[50, 100, 200, 500, 1000, 5000, 10000].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <button onClick={fetchData} disabled={loading}
          style={{
            padding: "8px 24px", background: loading ? "#1e293b" : "#0369a1",
            color: "#fff", border: "none", borderRadius: 6, fontSize: 13,
            fontWeight: 600, cursor: loading ? "wait" : "pointer", alignSelf: "flex-end"
          }}
          onMouseEnter={e => { if (!loading) e.target.style.background = "#0284c7"; }}
          onMouseLeave={e => { if (!loading) e.target.style.background = "#0369a1"; }}
        >
          {loading ? "Cargando…" : "Consultar"}
        </button>
      </div>

      {/* Modal detalle */}
      {selectedRow && (
        <RecordModal
          row={selectedRow}
          colLabel={colLabel}
          formatCOP={formatCOP}
          formatDate={formatDate}
          detectType={detectType}
          onClose={() => setSelectedRow(null)}
          isSeguido={isSeguido}
          onToggleSeguimiento={toggleSeguimiento}
        />
      )}

      {/* Stats bar + toggle vistas */}
      {!loading && (data.length > 0 || seguimientos.length > 0) && (
        <div style={{
          padding: "10px 28px", background: "#0b1120", borderBottom: "1px solid #1e293b",
          fontSize: 12, color: "#94a3b8", display: "flex", justifyContent: "space-between",
          flexWrap: "wrap", gap: 8, alignItems: "center"
        }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Toggle: Todos / Seguimientos */}
            <button
              onClick={() => setVistaPanel("todos")}
              style={{
                padding: "5px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                cursor: "pointer", border: "1px solid",
                background: vistaPanel === "todos" ? "#0369a1" : "#1e293b",
                color: vistaPanel === "todos" ? "#fff" : "#94a3b8",
                borderColor: vistaPanel === "todos" ? "#0369a1" : "#334155",
              }}
            >
              Todos ({sorted.length})
            </button>
            <button
              onClick={() => setVistaPanel("seguimientos")}
              style={{
                padding: "5px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                cursor: "pointer", border: "1px solid",
                background: vistaPanel === "seguimientos" ? "#78350f" : "#1e293b",
                color: vistaPanel === "seguimientos" ? "#fcd34d" : "#94a3b8",
                borderColor: vistaPanel === "seguimientos" ? "#d97706" : "#334155",
              }}
            >
              ★ Mis seguimientos ({seguimientos.length})
            </button>
          </div>
          <span>{columns.length} columnas · clic en encabezado para ordenar · clic en fila para expandir</span>
        </div>
      )}

      {/* Content */}
      <div style={{ padding: "0 28px 28px" }}>
        {loading && <Spinner />}

        {error && (
          <div style={{ margin: "24px 0", padding: "16px 20px", background: "#1c1917", border: "1px solid #78350f", borderRadius: 8, color: "#fbbf24", fontSize: 13 }}>
            {error}
          </div>
        )}

        {vistaPanel === "seguimientos" && seguimientos.length === 0 && (
          <div style={{ padding: "48px 0", textAlign: "center", color: "#64748b", fontSize: 14 }}>
            No has guardado ningún proceso aún. Haz clic en ☆ en cualquier fila o en el modal para guardar.
          </div>
        )}

        {!loading && vistaPanel === "todos" && !error && data.length === 0 && (
          <div style={{ padding: "48px 0", textAlign: "center", color: "#64748b", fontSize: 14 }}>
            Sin resultados. Ajusta los filtros o presiona Consultar.
          </div>
        )}

        {displayData.length > 0 && (
          <div ref={tableRef} style={{ overflowX: "auto", marginTop: 12, borderRadius: 8, border: "1px solid #1e293b" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "'Inter', sans-serif" }}>
              <thead>
                <tr>
                  <th style={{ padding: "10px 8px", textAlign: "center", background: "#1e293b", color: "#d97706", fontWeight: 600, fontSize: 11, position: "sticky", top: 0, borderBottom: "2px solid #334155", width: 36 }} title="Seguimiento">★</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", background: "#1e293b", color: "#94a3b8", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", position: "sticky", top: 0, borderBottom: "2px solid #38bdf8", whiteSpace: "nowrap", width: 36 }}>#</th>
                  {FIXED_COLS.map(col => (
                    <th
                      key={col}
                      onClick={() => { if (sortCol === col) setSortAsc(!sortAsc); else { setSortCol(col); setSortAsc(true); } }}
                      style={{
                        padding: "10px 12px", textAlign: "left", background: "#1e293b",
                        color: sortCol === col ? "#38bdf8" : "#94a3b8",
                        fontWeight: 600, fontSize: 10, textTransform: "uppercase",
                        letterSpacing: "0.06em", position: "sticky", top: 0,
                        borderBottom: sortCol === col ? "2px solid #38bdf8" : "2px solid #334155",
                        whiteSpace: "nowrap", cursor: "pointer", userSelect: "none", maxWidth: 200
                      }}
                    >
                      {colLabel(col)} {sortCol === col ? (sortAsc ? "↑" : "↓") : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayData.map((row, i) => {
                  const seguido = isSeguido(row);
                  const diasVence = getDiasVence(row.fecha_de_ultima_publicaci);
                  const venceProximo = diasVence !== null && diasVence >= 0 && diasVence <= 7;
                  const rowBg = venceProximo
                    ? (i % 2 === 0 ? "#1a1008" : "#1f1208")
                    : (i % 2 === 0 ? "#0b1120" : "#0f172a");

                  return (
                    <tr
                      key={i}
                      onClick={() => setSelectedRow(row)}
                      style={{ background: rowBg, cursor: "pointer", transition: "background 0.15s", animation: "fadeIn 0.2s ease" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#172340"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = rowBg; }}
                    >
                      {/* Columna estrella */}
                      <td style={{ padding: "8px", textAlign: "center", borderTop: "1px solid #1e293b" }}>
                        <button
                          className="star-btn"
                          onClick={e => { e.stopPropagation(); toggleSeguimiento(row); }}
                          title={seguido ? "Quitar seguimiento" : "Guardar en seguimientos"}
                          style={{
                            background: "transparent", border: "none", cursor: "pointer",
                            fontSize: 15, color: seguido ? "#fcd34d" : "#334155",
                            padding: "2px 4px", borderRadius: 4, transition: "all 0.15s",
                            lineHeight: 1
                          }}
                        >{seguido ? "★" : "☆"}</button>
                      </td>
                      {/* Número */}
                      <td style={{ padding: "8px 12px", color: "#475569", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, borderTop: "1px solid #1e293b" }}>
                        {i + 1}
                      </td>
                      {/* Columnas de datos */}
                      {FIXED_COLS.map(col => (
                        <td key={col} style={{
                          padding: "8px 12px", borderTop: "1px solid #1e293b",
                          maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis",
                          whiteSpace: "nowrap", fontSize: 12,
                          color: detectType(col) === "money" ? "#34d399" : "#cbd5e1"
                        }}>
                          {col === "estado_del_procedimiento"
                            ? <StatusBadge status={row[col]} />
                            : col === "fecha_de_ultima_publicaci"
                              ? <span style={{ display: "flex", alignItems: "center" }}>
                                  <span>{cellValue(row, col)}</span>
                                  <VenceBadge fechaStr={row[col]} />
                                </span>
                              : cellValue(row, col)
                          }
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      </>}
    </div>
  );
}
