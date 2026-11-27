/** Ponte do módulo de protocolos em três camadas (public/prototype/lovable-protocols.js → banco). RLS e gatilhos fazem o controle. */
import { supabase } from "@/integrations/supabase/client";
import { supabaseUntyped as db } from "@/integrations/supabase/untyped";

type A = Record<string, any>;
const ok = <T>(r: { data: T; error: any }) => { if (r.error) throw { code: "error", message: r.error.message }; return r.data; };

async function sha(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

export async function protBridge(op: string, a: A = {}): Promise<unknown> {
  const { data: { user } } = await supabase.auth.getUser();
  const uid = user?.id;
  if (!uid) throw { code: "error", message: "sem sessão" };
  switch (op) {
    case "me": {
      const admin = !!ok(await supabase.rpc("has_role", { _user_id: uid, _role: "admin" } as never));
      const membros = ok(await db.from("prot_membros").select("equipe_id,papel").eq("user_id", uid)) as A[];
      const prof = ok(await db.from("profiles").select("full_name,crm").eq("id", uid).maybeSingle()) as A | null;
      return { uid, admin, membros, nome: prof?.full_name || user?.email, crm: prof?.crm || "" };
    }
    case "list": {
      const ps = ok(await db.from("prot_protocolos").select("*").eq("arquivado", false).order("titulo").limit(2000)) as A[];
      const ids = ps.map((p) => p.id);
      const vs = ids.length ? ok(await db.from("prot_versoes").select("id,protocolo_id,numero,critico,changelog,created_at").in("protocolo_id", ids).order("numero", { ascending: false }).limit(10000)) as A[] : [];
      const ev = ok(await db.from("prot_eventos").select("protocolo_id,tipo").eq("user_id", uid).limit(10000)) as A[];
      const lid = ok(await db.from("prot_leituras").select("versao_id,quiz_ok").eq("user_id", uid).limit(10000)) as A[];
      const heads = ps.map((p) => vs.find((v) => v.protocolo_id === p.id)?.id).filter(Boolean) as string[];
      const hc: A = {};
      for (let i = 0; i < heads.length; i += 100) {
        const r = ok(await db.from("prot_versoes").select("id,conteudo").in("id", heads.slice(i, i + 100))) as A[];
        r.forEach((x) => { hc[x.id] = x.conteudo; });
      }
      return ps.map((p) => {
        const mv = vs.filter((v) => v.protocolo_id === p.id);
        return { ...p, head: mv[0] ?? null, headC: mv[0] ? hc[mv[0].id] ?? null : null, nVersoes: mv.length, meusUsos: ev.filter((e) => e.protocolo_id === p.id && e.tipo === "aplicacao").length, lidas: lid.filter((l) => mv.some((v) => v.id === l.versao_id)) };
      });
    }
    case "version": return ok(await db.from("prot_versoes").select("*").eq("id", a.id).single());
    case "versions": return ok(await db.from("prot_versoes").select("*").eq("protocolo_id", a.id).order("numero", { ascending: false }).limit(300));
    case "create": {
      const p = ok(await db.from("prot_protocolos").insert({ owner: uid, camada: a.camada || "pessoal", equipe_id: a.equipe_id ?? null, proto_origem: a.proto_origem ?? null, titulo: a.titulo, status: a.camada === "pessoal" ? "aprovado" : "rascunho", proxima_revisao: a.proxima_revisao ?? null }).select().single()) as A;
      const v = ok(await db.from("prot_versoes").insert({ protocolo_id: p.id, autor: uid, numero: 0, conteudo: a.conteudo, changelog: a.changelog || "Versão inicial", critico: false, hash: await sha(JSON.stringify(a.conteudo)) }).select().single());
      return { protocolo: p, versao: v };
    }
    case "commit": {
      const v = ok(await db.from("prot_versoes").insert({ protocolo_id: a.id, autor: uid, numero: 0, conteudo: a.conteudo, changelog: a.changelog || "", critico: !!a.critico, hash: await sha(JSON.stringify(a.conteudo)) }).select().single());
      if (a.patch) ok(await db.from("prot_protocolos").update(a.patch).eq("id", a.id));
      return v;
    }
    case "update": ok(await db.from("prot_protocolos").update(a.patch).eq("id", a.id)); return true;
    case "seed": {
      // Cópia única dos protocolos-base do PrescriMed como camada institucional (índice único por origem).
      const have = ok(await db.from("prot_protocolos").select("proto_origem").eq("camada", "institucional").limit(5000)) as A[];
      const set = new Set(have.map((h) => h.proto_origem));
      let n = 0;
      for (const it of (a.items as A[]) ?? []) {
        if (set.has(it.proto_origem)) continue;
        const p = ok(await db.from("prot_protocolos").insert({ owner: uid, camada: "institucional", proto_origem: it.proto_origem, titulo: it.titulo, status: "aprovado", travado: true, aprovador_nome: "Coordenação médica", proxima_revisao: new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10) }).select().single()) as A;
        ok(await db.from("prot_versoes").insert({ protocolo_id: p.id, autor: uid, numero: 0, conteudo: it.conteudo, changelog: "Versão 1 importada do PrescriMed", hash: await sha(JSON.stringify(it.conteudo)) }));
        n++;
      }
      return n;
    }
    case "teams": {
      const eq = ok(await db.from("prot_equipes").select("*").order("nome")) as A[];
      const mb = ok(await db.from("prot_membros").select("*")) as A[];
      const inst = ok(await db.from("prot_instancias").select("*").order("nome"));
      return { equipes: eq.map((e) => ({ ...e, membros: mb.filter((m) => m.equipe_id === e.id) })), instancias: inst };
    }
    case "teamCreate": return ok(await db.from("prot_equipes").insert({ nome: a.nome, tipo: a.tipo || "outro" }).select().single());
    case "teamAdd": return ok(await supabase.rpc("fn_prot_add_membro" as never, { _equipe: a.equipe_id, _email: a.email, _papel: a.papel || "membro" } as never));
    case "teamMembers": return ok(await supabase.rpc("fn_prot_membros_email" as never, { _equipe: a.equipe_id } as never));
    case "teamRemove": ok(await db.from("prot_membros").delete().eq("id", a.id)); return true;
    case "suggest": return ok(await db.from("prot_sugestoes").insert({ ...a.campos, protocolo_id: a.id, autor: uid }).select().single());
    case "suggestions": {
      let q = db.from("prot_sugestoes").select("*").order("created_at", { ascending: false }).limit(1000);
      if (a.id) q = q.eq("protocolo_id", a.id);
      return ok(await q);
    }
    case "decide": ok(await db.from("prot_sugestoes").update({ status: a.status, resposta: a.resposta ?? null }).eq("id", a.sid)); return true;
    case "event": ok(await db.from("prot_eventos").insert({ protocolo_id: a.id, versao_id: a.versao ?? null, user_id: uid, tipo: a.tipo, detalhes: a.detalhes ?? {} })); return true;
    case "read": ok(await db.from("prot_leituras").upsert({ user_id: uid, versao_id: a.versao, quiz_ok: !!a.quiz_ok, acertos: a.acertos ?? null }, { onConflict: "user_id,versao_id" })); return true;
    case "alerts": return ok(await db.from("prot_alertas").select("*").eq("resolvido", false).order("created_at", { ascending: false }).limit(500));
    case "alertAdd": return ok(await db.from("prot_alertas").insert({ protocolo_id: a.id, tipo: "manual", titulo: a.titulo, url: a.url ?? null, resumo: a.resumo ?? null, chave: "m" + Date.now(), created_by: uid }).select().single());
    case "alertResolve": ok(await db.from("prot_alertas").update({ resolvido: true }).eq("id", a.aid)); return true;
    case "stats": {
      const ev = ok(await db.from("prot_eventos").select("protocolo_id,user_id,tipo,detalhes,created_at").gte("created_at", a.desde ?? "2000-01-01").order("created_at").limit(20000));
      const sug = ok(await db.from("prot_sugestoes").select("protocolo_id,status,prioridade,prazo,created_at,analise_em,decidido_em,implantado_em").limit(5000));
      return { eventos: ev, sugestoes: sug };
    }
    default: throw { code: "error", message: "operação desconhecida: " + op };
  }
}
