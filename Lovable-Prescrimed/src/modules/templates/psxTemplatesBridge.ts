/** Ponte dos modelos pessoais (public/prototype/lovable-templates.js → banco). RLS faz o controle de acesso. */
import { supabase } from "@/integrations/supabase/client";
import { supabaseUntyped as db } from "@/integrations/supabase/untyped";

type A = Record<string, any>;
const ok = <T>(r: { data: T; error: any }) => { if (r.error) throw { code: "error", message: r.error.message }; return r.data; };

async function sha(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

export async function tplBridge(op: string, a: A = {}): Promise<unknown> {
  const { data: { user } } = await supabase.auth.getUser();
  const uid = user?.id;
  if (!uid) throw { code: "error", message: "sem sessão" };
  switch (op) {
    case "me": return { uid, admin: !!ok(await supabase.rpc("has_role", { _user_id: uid, _role: "admin" } as never)) };
    case "list": {
      const ms = ok(await db.from("tpl_modelos").select("*").eq("arquivado", false).order("updated_at", { ascending: false }).limit(500)) as A[];
      const ids = ms.map((m) => m.id);
      const usos = ids.length ? ok(await db.from("tpl_usos").select("modelo_id,estrelas,polegar,pct_mod,created_at,user_id").in("modelo_id", ids).limit(5000)) as A[] : [];
      const comp = ok(await db.from("tpl_compart").select("modelo_id,nivel,user_id").limit(2000)) as A[];
      const sug = ok(await db.from("tpl_sugestoes").select("modelo_id,status").eq("status", "pendente").limit(1000)) as A[];
      return ms.map((m) => {
        const u = usos.filter((x) => x.modelo_id === m.id);
        const st = u.filter((x) => x.estrelas).map((x) => x.estrelas);
        const mine = comp.find((c) => c.modelo_id === m.id && c.user_id === uid);
        return { ...m, nivel: m.owner === uid ? "dono" : mine ? mine.nivel : m.publicacao === "publicado" ? "publico" : "revisor",
          usos: u.length, ultimoUso: u.map((x) => x.created_at).sort().pop() ?? null,
          estrelas: st.length ? st.reduce((s, x) => s + x, 0) / st.length : null,
          polegar: u.reduce((s, x) => s + (x.polegar ?? 0), 0),
          pctMod: u.filter((x) => x.pct_mod != null).map((x) => +x.pct_mod),
          compart: comp.filter((c) => c.modelo_id === m.id && m.owner === uid).length,
          sugestoes: sug.filter((s) => s.modelo_id === m.id).length };
      });
    }
    case "versions": return ok(await db.from("tpl_versoes").select("*").eq("modelo_id", a.id).order("created_at", { ascending: false }).limit(300));
    case "create": {
      const m = ok(await db.from("tpl_modelos").insert({ owner: uid, nome: a.nome, meta: a.meta ?? {}, origem_id: a.origem_id ?? null }).select().single()) as A;
      const hash = await sha(JSON.stringify(a.conteudo));
      const v = ok(await db.from("tpl_versoes").insert({ modelo_id: m.id, autor: uid, ramo: "principal", mensagem: a.mensagem || "Versão inicial", conteudo: a.conteudo, meta: a.meta ?? {}, hash }).select().single());
      return { modelo: m, versao: v };
    }
    case "commit": {
      const hash = await sha(JSON.stringify(a.conteudo));
      const v = ok(await db.from("tpl_versoes").insert({ modelo_id: a.id, autor: uid, ramo: a.ramo || "principal", pai: a.pai ?? null, mensagem: a.mensagem || "", conteudo: a.conteudo, meta: a.meta ?? {}, hash }).select().single());
      const patch: A = { updated_at: new Date().toISOString() };
      if (a.meta && (a.ramo || "principal") === "principal") patch.meta = a.meta;
      if (a.nome) patch.nome = a.nome;
      ok(await db.from("tpl_modelos").update(patch).eq("id", a.id));
      return v;
    }
    case "update": ok(await db.from("tpl_modelos").update(a.patch).eq("id", a.id)); return true;
    case "archive": ok(await db.from("tpl_modelos").update({ arquivado: true }).eq("id", a.id)); return true;
    case "invite": return ok(await supabase.rpc("fn_tpl_convidar" as never, { _modelo: a.id, _email: a.email, _nivel: a.nivel } as never));
    case "join": return ok(await supabase.rpc("fn_tpl_entrar_codigo" as never, { _codigo: a.codigo } as never));
    case "shares": return ok(await db.from("tpl_compart").select("*").eq("modelo_id", a.id));
    case "unshare": ok(await db.from("tpl_compart").delete().eq("id", a.shareId)); return true;
    case "review": return ok(await supabase.rpc("fn_tpl_revisar_publicacao" as never, { _modelo: a.id, _aprovar: a.aprovar, _obs: a.obs ?? null } as never));
    case "suggest": return ok(await db.from("tpl_sugestoes").insert({ modelo_id: a.id, autor: uid, base_versao: a.base ?? null, mensagem: a.mensagem || "", conteudo: a.conteudo }).select().single());
    case "suggestions": return ok(await db.from("tpl_sugestoes").select("*").eq("modelo_id", a.id).order("created_at", { ascending: false }));
    case "decide": ok(await db.from("tpl_sugestoes").update({ status: a.status, decidido_em: new Date().toISOString() }).eq("id", a.sid)); return true;
    case "use": return ok(await db.from("tpl_usos").insert({ modelo_id: a.id, versao_id: a.versao ?? null, user_id: uid, contexto: a.contexto ?? {} }).select().single());
    case "rate": ok(await db.from("tpl_usos").update(a.patch).eq("id", a.usoId)); return true;
    case "time": ok(await db.from("tpl_tempos").insert({ user_id: uid, com_modelo: !!a.com, segundos: Math.round(a.segundos) })); return true;
    case "stats": {
      const usos = ok(await db.from("tpl_usos").select("modelo_id,created_at,pct_mod,estrelas,polegar,segundos").eq("user_id", uid).order("created_at").limit(5000));
      const tempos = ok(await db.from("tpl_tempos").select("com_modelo,segundos,created_at").eq("user_id", uid).limit(5000));
      return { usos, tempos };
    }
    default: throw { code: "error", message: "operação desconhecida: " + op };
  }
}
