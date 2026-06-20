import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pg from "pg";

const { Pool } = pg;

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "secop_jwt_secret_2026_cambiar_en_prod";

const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "secop",
  user: "postgres",
  password: "postgres",
});

app.use(cors({ origin: "*" }));
app.use(express.json());

// ── Middleware auth ──────────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "Token requerido" });
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Token inválido" });
  }
}

// ── POST /auth/register ──────────────────────────────────────────────
app.post("/auth/register", async (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password) return res.status(400).json({ error: "username y password requeridos" });
  if (password.length < 6) return res.status(400).json({ error: "Contraseña mínimo 6 caracteres" });
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, role, created_at",
      [username.trim().toLowerCase(), email || null, hash]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ error: "Usuario ya existe" });
    console.error(e);
    res.status(500).json({ error: "Error interno" });
  }
});

// ── POST /auth/login ─────────────────────────────────────────────────
app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Credenciales requeridas" });
  try {
    const result = await pool.query(
      "SELECT id, username, password_hash, role FROM users WHERE username = $1",
      [username.trim().toLowerCase()]
    );
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }
    await pool.query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id]);
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error interno" });
  }
});

// ── GET /auth/me ─────────────────────────────────────────────────────
app.get("/auth/me", authMiddleware, async (req, res) => {
  const result = await pool.query(
    "SELECT id, username, email, role, created_at, last_login FROM users WHERE id = $1",
    [req.user.id]
  );
  res.json(result.rows[0] || null);
});

// ── GET /seguimientos ────────────────────────────────────────────────
app.get("/seguimientos", authMiddleware, async (req, res) => {
  const result = await pool.query(
    "SELECT proceso_id, proceso_data, created_at FROM seguimientos WHERE user_id = $1 ORDER BY created_at DESC",
    [req.user.id]
  );
  res.json(result.rows.map(r => ({ ...r.proceso_data, _seguimiento_id: r.proceso_id, _saved_at: r.created_at })));
});

// ── POST /seguimientos ───────────────────────────────────────────────
app.post("/seguimientos", authMiddleware, async (req, res) => {
  const { proceso_id, proceso_data } = req.body;
  if (!proceso_id) return res.status(400).json({ error: "proceso_id requerido" });
  try {
    await pool.query(
      `INSERT INTO seguimientos (user_id, proceso_id, proceso_data)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, proceso_id) DO UPDATE SET proceso_data = $3`,
      [req.user.id, proceso_id, JSON.stringify(proceso_data || {})]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error interno" });
  }
});

// ── DELETE /seguimientos/:proceso_id ─────────────────────────────────
app.delete("/seguimientos/:proceso_id", authMiddleware, async (req, res) => {
  await pool.query(
    "DELETE FROM seguimientos WHERE user_id = $1 AND proceso_id = $2",
    [req.user.id, req.params.proceso_id]
  );
  res.json({ ok: true });
});

// ── GET /admin/users (solo admin) ────────────────────────────────────
app.get("/admin/users", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Acceso denegado" });
  const result = await pool.query(
    "SELECT id, username, email, role, created_at, last_login FROM users ORDER BY created_at DESC"
  );
  res.json(result.rows);
});

// ── Health check ─────────────────────────────────────────────────────
app.get("/health", (req, res) => res.json({ status: "ok", ts: new Date() }));

app.listen(PORT, () => console.log(`SECOP API corriendo en http://localhost:${PORT}`));
