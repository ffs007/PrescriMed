// Busca semanal no PubMed por protocolo (lote limitado, trava contra execução dupla, idempotente por PMID).
// Nada altera protocolos: cada artigo novo vira alerta para o coordenador/administrador.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const out = (s: number, d: unknown) => new Response(JSON.stringify(d), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const BATCH = 25;
const EU = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const now = new Date();
  const { data: st } = await sb.from("prot_job_state").select("*").eq("id", "pubmed").maybeSingle();
  if (st?.paused_reason) return out(200, { paused: st.paused_reason });
  if (st?.locked_until && new Date(st.locked_until) > now) return out(200, { skipped: "em execução" });
  await sb.from("prot_job_state").upsert({ id: "pubmed", locked_until: new Date(now.getTime() + 5 * 60e3).toISOString() });
  let created = 0, cursor = st?.cursor ?? 0, errors = 0;
  try {
    const { data: ps } = await sb.from("prot_protocolos").select("id,titulo,camada,proxima_revisao").eq("arquivado", false).neq("camada", "pessoal").order("created_at").range(cursor, cursor + BATCH - 1);
    const list = ps ?? [];
    for (const p of list) {
      // Revisão vencida
      if (p.proxima_revisao && new Date(p.proxima_revisao) < now) {
        const { error } = await sb.from("prot_alertas").insert({ protocolo_id: p.id, tipo: "revisao", titulo: "Revisão obrigatória vencida em " + p.proxima_revisao, chave: "rev:" + p.proxima_revisao });
        if (!error) created++;
      }
      const { data: v } = await sb.from("prot_versoes").select("conteudo").eq("protocolo_id", p.id).order("numero", { ascending: false }).limit(1).maybeSingle();
      const c = (v?.conteudo ?? {}) as { palavras?: string[]; pubmed?: string };
      const term = c.pubmed || `(${p.titulo.replace(/\(.*?\)/g, "").trim()}) AND (guideline[pt] OR meta-analysis[pt] OR randomized controlled trial[pt])`;
      const r = await fetch(`${EU}/esearch.fcgi?db=pubmed&retmode=json&retmax=5&datetype=pdat&reldate=7&term=${encodeURIComponent(term)}`);
      if (r.status === 429) { errors++; break; }
      if (!r.ok) { errors++; continue; }
      const ids: string[] = (await r.json())?.esearchresult?.idlist ?? [];
      if (ids.length) {
        const s = await fetch(`${EU}/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(",")}`);
        const sj = s.ok ? await s.json() : { result: {} };
        for (const id of ids) {
          const it = sj.result?.[id] ?? {};
          const { error } = await sb.from("prot_alertas").insert({ protocolo_id: p.id, tipo: "pubmed", titulo: it.title || "Artigo PMID " + id, url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`, resumo: [it.source, it.pubdate, (it.pubtype ?? []).join(", ")].filter(Boolean).join(" · "), chave: "pmid:" + id });
          if (!error) created++;
        }
      }
      await new Promise((res) => setTimeout(res, 400)); // limite do NCBI: 3 req/s sem chave
    }
    cursor = list.length < BATCH ? 0 : cursor + BATCH;
  } finally {
    await sb.from("prot_job_state").update({ locked_until: null, last_run: new Date().toISOString(), cursor }).eq("id", "pubmed");
  }
  return out(200, { created, cursor, errors });
});
