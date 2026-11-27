// Cota de IA do teste grátis (7 dias, 30 usos no total, 8 por dia).
// Regra aplicada no banco (fn_consumir_ia); aqui só identificamos o usuário.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

export type QuotaResult = { ok: true; userId: string } | { ok: false; status: number; error: string };

export async function consumirIA(req: Request, funcao: string): Promise<QuotaResult> {
  const auth = req.headers.get("Authorization") ?? "";
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data } = await anon.auth.getUser(auth.replace("Bearer ", ""));
  const uid = data?.user?.id;
  if (!uid) return { ok: false, status: 401, error: "nao-autenticado" };
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: r, error } = await admin.rpc("fn_consumir_ia", { _uid: uid, _funcao: funcao });
  if (error) return { ok: false, status: 500, error: "quota-erro" };
  if (r !== "ok") return { ok: false, status: 402, error: String(r) };
  return { ok: true, userId: uid };
}
