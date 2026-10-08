const cors = (env) => ({
  "Access-Control-Allow-Origin": env.SITE_ORIGIN,
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Headers": "Content-Type, X-Bootstrap-Key",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS"
});

const json = (env, data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...cors(env), ...extra }
  });

async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    key,
    256
  );
  return [...new Uint8Array(bits)].map(x => x.toString(16).padStart(2, "0")).join("");
}

function b64(bytes) {
  return btoa(String.fromCharCode(...bytes));
}

async function passwordRecord(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return b64(salt) + "$" + await hashPassword(password, salt);
}

async function verify(password, record) {
  const [encodedSalt, hash] = record.split("$");
  const salt = Uint8Array.from(atob(encodedSalt), c => c.charCodeAt(0));
  return hash === await hashPassword(password, salt);
}

async function tokenHash(token) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, "0")).join("");
}

async function current(request, env) {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/cec_session=([^;]+)/);
  if (!match) return null;
  const hash = await tokenHash(match[1]);
  return await env.DB.prepare(
    "SELECT u.id,u.username,u.role,u.team,u.active FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>datetime('now') AND u.active=1"
  ).bind(hash).first();
}

function setCookie(value, maxAge = 2592000) {
  return `cec_session=${value}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=None`;
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: cors(env) });
    const url = new URL(request.url);

    try {
      if (url.pathname === "/api/bootstrap" && request.method === "POST") {
        const key = request.headers.get("X-Bootstrap-Key");
        if (!env.BOOTSTRAP_KEY || key !== env.BOOTSTRAP_KEY) return json(env, { error: "forbidden" }, 403);
        const count = await env.DB.prepare("SELECT COUNT(*) AS n FROM users").first();
        if (count.n > 0) return json(env, { error: "already_initialized" }, 409);
        const body = await request.json();
        if (!body.username || !body.password) return json(env, { error: "missing_fields" }, 400);
        const passwordHash = await passwordRecord(body.password);
        await env.DB.prepare(
          "INSERT INTO users(username,password_hash,role,team,active,created_at) VALUES(?,?,?,NULL,1,datetime('now'))"
        ).bind(body.username, passwordHash, "admin").run();
        return json(env, { ok: true });
      }

      if (url.pathname === "/api/login" && request.method === "POST") {
        const { username, password } = await request.json();
        const user = await env.DB.prepare("SELECT * FROM users WHERE username=?").bind(username).first();
        if (!user || !user.active || !(await verify(password, user.password_hash))) return json(env, { error: "invalid_credentials" }, 401);
        const token = b64(crypto.getRandomValues(new Uint8Array(32)));
        await env.DB.prepare(
          "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,datetime('now','+30 days'))"
        ).bind(await tokenHash(token), user.id).run();
        return json(env, { user: { username: user.username, role: user.role, team: user.team } }, 200, { "Set-Cookie": setCookie(token) });
      }

      if (url.pathname === "/api/logout" && request.method === "POST") {
        const user = await current(request, env);
        if (user) {
          const cookie = request.headers.get("Cookie") || "";
          const match = cookie.match(/cec_session=([^;]+)/);
          if (match) await env.DB.prepare("DELETE FROM sessions WHERE token_hash=?").bind(await tokenHash(match[1])).run();
        }
        return json(env, { ok: true }, 200, { "Set-Cookie": setCookie("", 0) });
      }

      if (url.pathname === "/api/me" && request.method === "GET") {
        const user = await current(request, env);
        if (!user) return json(env, { error: "unauthorized" }, 401);
        return json(env, { user });
      }

      const user = await current(request, env);
      if (!user || user.role !== "admin") return json(env, { error: "forbidden" }, 403);

      if (url.pathname === "/api/users" && request.method === "GET") {
        const result = await env.DB.prepare("SELECT id,username,role,team,active,created_at FROM users ORDER BY username").all();
        return json(env, { users: result.results });
      }

      if (url.pathname === "/api/users" && request.method === "POST") {
        const { username, password, role, team } = await request.json();
        if (!username || !password || !role) return json(env, { error: "missing_fields" }, 400);
        const passwordHash = await passwordRecord(password);
        try {
          await env.DB.prepare(
            "INSERT INTO users(username,password_hash,role,team,active,created_at) VALUES(?,?,?,?,1,datetime('now'))"
          ).bind(username, passwordHash, role, team || null).run();
        } catch {
          return json(env, { error: "username_exists" }, 409);
        }
        return json(env, { ok: true });
      }

      if (url.pathname.startsWith("/api/users/") && request.method === "DELETE") {
        const id = url.pathname.split("/").pop();
        await env.DB.prepare("UPDATE users SET active=0 WHERE id=?").bind(id).run();
        return json(env, { ok: true });
      }

      return json(env, { error: "not_found" }, 404);
    } catch (error) {
      return json(env, { error: "server_error", detail: error.message }, 500);
    }
  }
};
