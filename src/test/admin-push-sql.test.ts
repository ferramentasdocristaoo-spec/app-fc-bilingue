// @vitest-environment node
/**
 * Migração 20261121010000 (admin pela sessão + push) rodada num Postgres de verdade em memória (PGlite).
 * O esquema "auth" do Supabase é imitado: auth.users, auth.uid() e auth.jwt() leem o request.jwt.claims,
 * como o PostgREST faz.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

const raiz = path.resolve(__dirname, "../..");
const migracao = readFileSync(path.join(raiz, "supabase/migrations/20261121010000_admin_sessao_e_push.sql"), "utf8");

const BASE = `
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
END $$;
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE auth.users (id uuid PRIMARY KEY, email text, email_confirmed_at timestamptz);
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS
  $f$ SELECT coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $f$;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
  $f$ SELECT nullif(auth.jwt() ->> 'sub', '')::uuid $f$;
GRANT USAGE ON SCHEMA auth, extensions, public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO anon, authenticated, service_role;

CREATE TABLE public.approved_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text UNIQUE NOT NULL, bloqueado boolean NOT NULL DEFAULT false,
  expires_at timestamptz, plan text, idiomas_liberados boolean NOT NULL DEFAULT false);
CREATE TABLE public.admin_users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL UNIQUE, password_hash text NOT NULL);
INSERT INTO public.admin_users (email, password_hash) VALUES ('dono@fc.test', extensions.crypt('senha-velha', extensions.gen_salt('bf')));
INSERT INTO auth.users VALUES
  ('11111111-1111-1111-1111-111111111111', 'dono@fc.test', now()),
  ('22222222-2222-2222-2222-222222222222', 'cliente@fc.test', now()),
  ('33333333-3333-3333-3333-333333333333', 'Dono2@FC.test', NULL);
INSERT INTO public.approved_emails (email, plan) VALUES ('cliente@fc.test', 'br_mensal'), ('dono@fc.test', NULL);
INSERT INTO public.approved_emails (email, bloqueado) VALUES ('bloqueado@fc.test', true);
INSERT INTO public.approved_emails (email, expires_at) VALUES ('vencido@fc.test', now() - interval '1 day');
`;

const TOKEN = "t".repeat(120);
let db: PGlite;

/** Roda como o PostgREST: papel + claims do JWT na mesma transação. */
async function como<T = Record<string, unknown>>(papel: "anon" | "authenticated", claims: Record<string, unknown> | null, sql: string, params: unknown[] = []) {
  return db.transaction(async (tx) => {
    await tx.query(`SELECT set_config('request.jwt.claims', $1, true)`, [claims ? JSON.stringify(claims) : ""]);
    await tx.exec(`SET LOCAL ROLE ${papel}`);
    const r = await tx.query<T>(sql, params);
    return r.rows;
  });
}
const sessao = (sub: string, email: string, extra: Record<string, unknown> = {}) => ({ sub, email, role: "authenticated", ...extra });
const DONO = sessao("11111111-1111-1111-1111-111111111111", "dono@fc.test");
const CLIENTE = sessao("22222222-2222-2222-2222-222222222222", "cliente@fc.test");

beforeAll(async () => {
  db = new PGlite({ extensions: { pgcrypto } });
  await db.exec(BASE);
  await db.exec(migracao);
  await db.exec(migracao); // idempotente: rodar de novo não pode falhar
  // Passo manual do dono: liga a linha de admin à própria conta.
  await db.exec("UPDATE public.admin_users SET user_id = '11111111-1111-1111-1111-111111111111' WHERE email = 'dono@fc.test'");
}, 60_000);

describe("admin pela sessão", () => {
  it("dono com e-mail confirmado e em admin_users é admin", async () => {
    const [r] = await como<{ ok: boolean }>("authenticated", DONO, "SELECT public.is_session_admin() AS ok");
    expect(r.ok).toBe(true);
  });

  it("conta com o e-mail do admin mas sem user_id ligado NÃO é admin (cadastro aberto não vira admin)", async () => {
    await db.exec("INSERT INTO auth.users VALUES ('44444444-4444-4444-4444-444444444444', 'novo-admin@fc.test', now())");
    await db.query("INSERT INTO public.admin_users (email, password_hash) VALUES ('novo-admin@fc.test', 'x')");
    const s = sessao("44444444-4444-4444-4444-444444444444", "novo-admin@fc.test");
    expect((await como<{ ok: boolean }>("authenticated", s, "SELECT public.is_session_admin() AS ok"))[0].ok).toBe(false);
    expect((await como<{ ok: boolean }>("authenticated", s, "SELECT public.verify_admin('', '') AS ok"))[0].ok).toBe(false);
  });

  it("trocar a senha do painel exige a senha atual, mesmo com sessão de admin", async () => {
    await expect(como("authenticated", DONO, "SELECT public.admin_change_password('dono@fc.test', '', 'nova')")).rejects.toThrow(/unauthorized/);
    await como("anon", null, "SELECT public.admin_change_password('dono@fc.test', 'senha-velha', 'senha-velha')");
  });

  it("cliente logado não é admin; sem sessão também não", async () => {
    expect((await como<{ ok: boolean }>("authenticated", CLIENTE, "SELECT public.is_session_admin() AS ok"))[0].ok).toBe(false);
    expect((await como<{ ok: boolean }>("anon", null, "SELECT public.is_session_admin() AS ok"))[0].ok).toBe(false);
  });

  it("e-mail não confirmado não vira admin, mesmo estando em admin_users", async () => {
    await db.query("INSERT INTO public.admin_users (email, password_hash) VALUES ('dono2@fc.test', 'x') ON CONFLICT DO NOTHING");
    const s = sessao("33333333-3333-3333-3333-333333333333", "dono2@fc.test");
    expect((await como<{ ok: boolean }>("authenticated", s, "SELECT public.is_session_admin() AS ok"))[0].ok).toBe(false);
  });

  it("JWT com e-mail diferente do auth.users (ou anônimo) não vale", async () => {
    const trocado = sessao("22222222-2222-2222-2222-222222222222", "dono@fc.test");
    expect((await como<{ ok: boolean }>("authenticated", trocado, "SELECT public.is_session_admin() AS ok"))[0].ok).toBe(false);
    const anonimo = { ...DONO, is_anonymous: true };
    expect((await como<{ ok: boolean }>("authenticated", anonimo, "SELECT public.is_session_admin() AS ok"))[0].ok).toBe(false);
  });

  it("verify_admin: senha antiga continua valendo; sessão vale com e-mail vazio ou o próprio", async () => {
    const v = (papel: "anon" | "authenticated", claims: Record<string, unknown> | null, e: string, p: string) =>
      como<{ ok: boolean }>(papel, claims, "SELECT public.verify_admin($1, $2) AS ok", [e, p]).then((r) => r[0].ok);
    expect(await v("anon", null, "dono@fc.test", "senha-velha")).toBe(true);
    expect(await v("anon", null, "DONO@fc.test ", "senha-velha")).toBe(true);
    expect(await v("anon", null, "dono@fc.test", "errada")).toBe(false);
    expect(await v("anon", null, "dono@fc.test", "")).toBe(false);
    expect(await v("authenticated", DONO, "", "")).toBe(true);
    expect(await v("authenticated", DONO, "dono@fc.test", "")).toBe(true);
    expect(await v("authenticated", DONO, "outro@fc.test", "")).toBe(false);
    expect(await v("authenticated", CLIENTE, "", "")).toBe(false);
    expect(await v("authenticated", CLIENTE, "dono@fc.test", "")).toBe(false);
  });
});

describe("push: tabelas e RPCs", () => {
  it("inscreve com e-mail liberado e recusa bloqueado, vencido, desconhecido e token ruim", async () => {
    const ins = (e: string, t: string) =>
      como<{ r: string }>("anon", null, "SELECT public.push_inscrever($1, $2, NULL, 'pt-BR', 'android') AS r", [e, t]).then((x) => x[0].r);
    expect(await ins("Cliente@FC.test", TOKEN)).toBe("ok");
    expect(await ins("bloqueado@fc.test", "b".repeat(120))).toBe("sem_acesso");
    expect(await ins("vencido@fc.test", "v".repeat(120))).toBe("sem_acesso");
    expect(await ins("ninguem@fc.test", "n".repeat(120))).toBe("sem_acesso");
    expect(await ins("cliente@fc.test", "curto")).toBe("token_invalido");
    expect(await ins("cliente@fc.test", "x".repeat(110) + "<script>")).toBe("token_invalido");
    const linhas = await db.query<{ email: string; lang: string }>("SELECT email, lang FROM public.push_inscricoes");
    expect(linhas.rows).toEqual([{ email: "cliente@fc.test", lang: "pt-BR" }]);
  });

  it("com sessão vale o e-mail da sessão, não o informado", async () => {
    const t = "s".repeat(120);
    const [r] = await como<{ r: string }>("authenticated", DONO, "SELECT public.push_inscrever('cliente@fc.test', $1) AS r", [t]);
    expect(r.r).toBe("ok");
    const { rows } = await db.query<{ email: string }>("SELECT email FROM public.push_inscricoes WHERE token = $1", [t]);
    expect(rows[0].email).toBe("dono@fc.test");
  });

  it("sem sessão: não apaga aparelhos de ninguém e para em 10 por e-mail", async () => {
    const novo = "z".repeat(120);
    await como("anon", null, "SELECT public.push_inscrever('cliente@fc.test', $1, $2)", [novo, TOKEN]);
    const { rows } = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM public.push_inscricoes WHERE token = $1", [TOKEN]);
    expect(rows[0].n).toBe(1); // o "antigo" informado sem sessão não é apagado
    const res: string[] = [];
    for (let i = 0; i < 12; i++) res.push((await como<{ r: string }>("anon", null, "SELECT public.push_inscrever('cliente@fc.test', $1) AS r", [`k${i}`.padEnd(120, "k")]))[0].r);
    expect(res.filter((r) => r === "limite").length).toBeGreaterThan(0);
    const c = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM public.push_inscricoes WHERE email = 'cliente@fc.test'");
    expect(c.rows[0].n).toBe(10);
    expect((await db.query("SELECT 1 FROM public.push_inscricoes WHERE token = $1", [TOKEN])).rows.length).toBe(1);
  });

  it("com sessão: inscrição verificada, troca de token apaga o antigo, e anon não toma o token", async () => {
    const t1 = "q".repeat(120), t2 = "w".repeat(120);
    await como("authenticated", DONO, "SELECT public.push_inscrever(NULL, $1)", [t1]);
    await como("authenticated", DONO, "SELECT public.push_inscrever(NULL, $1, $2)", [t2, t1]);
    expect((await db.query("SELECT 1 FROM public.push_inscricoes WHERE token = $1", [t1])).rows.length).toBe(0);
    await como("anon", null, "SELECT public.push_inscrever('cliente@fc.test', $1)", [t2]);
    const { rows } = await db.query<{ email: string; verificado: boolean }>("SELECT email, verificado FROM public.push_inscricoes WHERE token = $1", [t2]);
    expect(rows[0]).toEqual({ email: "dono@fc.test", verificado: true });
  });

  it("envio com a mesma chave não entra duas vezes", async () => {
    await db.query("INSERT INTO public.push_envios (titulo, texto, chave) VALUES ('a', 'b', 'chave-1')");
    await expect(db.query("INSERT INTO public.push_envios (titulo, texto, chave) VALUES ('a', 'b', 'chave-1')")).rejects.toThrow(/duplicate key/);
  });

  it("anon e cliente não leem nem escrevem as tabelas direto; admin da sessão lê", async () => {
    await expect(como("anon", null, "SELECT * FROM public.push_inscricoes")).rejects.toThrow(/permission denied/);
    await expect(como("anon", null, "INSERT INTO public.push_envios (titulo, texto) VALUES ('a', 'b')")).rejects.toThrow(/permission denied/);
    await expect(como("authenticated", CLIENTE, "INSERT INTO public.push_envios (titulo, texto) VALUES ('a', 'b')")).rejects.toThrow(/permission denied/);
    expect(await como("authenticated", CLIENTE, "SELECT * FROM public.push_inscricoes")).toEqual([]);
    const doDono = await como("authenticated", DONO, "SELECT * FROM public.push_inscricoes");
    expect(doDono.length).toBeGreaterThan(0);
  });

  it("desligar apaga só o token informado", async () => {
    const t = "d".repeat(120);
    await como("authenticated", DONO, "SELECT public.push_inscrever(NULL, $1)", [t]);
    const [r] = await como<{ ok: boolean }>("anon", null, "SELECT public.push_desligar($1) AS ok", [t]);
    expect(r.ok).toBe(true);
    const [r2] = await como<{ ok: boolean }>("anon", null, "SELECT public.push_desligar($1) AS ok", [t]);
    expect(r2.ok).toBe(false);
  });

  it("marcar aberto: só o service_role, e nunca passa dos entregues", async () => {
    const { rows } = await db.query<{ id: number }>("INSERT INTO public.push_envios (titulo, texto, enviados) VALUES ('t', 'x', 1) RETURNING id");
    await expect(como("anon", null, "SELECT public.push_marcar_aberto($1)", [rows[0].id])).rejects.toThrow(/permission denied/);
    await db.query("SELECT public.push_marcar_aberto($1)", [rows[0].id]);
    await db.query("SELECT public.push_marcar_aberto($1)", [rows[0].id]);
    const a = await db.query<{ abertos: number }>("SELECT abertos FROM public.push_envios WHERE id = $1", [rows[0].id]);
    expect(a.rows[0].abertos).toBe(1);
  });
});
