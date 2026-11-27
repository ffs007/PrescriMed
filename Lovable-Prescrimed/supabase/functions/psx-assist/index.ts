import { consumirIA } from "../_shared/quota.ts";
// Assistente PrescriMed via IA do Lovable. Apenas apoio; decisão é do médico.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const out = (s: number, d: unknown) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

// Modelos gratuitos do OpenRouter, em ordem de preferência (o OpenRouter tenta o próximo se um falhar).
const OR_FREE_MODELS = ["google/gemma-4-31b-it:free", "nvidia/nemotron-3-super-120b-a12b:free", "openrouter/free"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await sb.auth.getUser(auth.replace("Bearer ", ""));
    if (!u?.user) return out(401, { error: "não autenticado" });

    const body = await req.json();
    const q = await consumirIA(req, "psx-assist");
    if (!q.ok) return out(q.status, { error: q.error });

    // OpenRouter (modelo gratuito) quando não há imagens; imagens seguem pela IA da plataforma.
    const orKey = Deno.env.get("OPENROUTER_API_KEY");
    if (orKey && !(body.images ?? []).length) {
      const msgs = body.mode === "json"
        ? [{ role: "system", content: "Responda somente com um objeto JSON válido, sem texto fora dele." }, { role: "user", content: String(body.prompt ?? "") }]
        : (body.messages ?? []).map((m: { role: string; content: string }) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content ?? "") }));
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${orKey}`, "Content-Type": "application/json", "HTTP-Referer": "https://prescrimed.app", "X-Title": "PrescriMed" },
        body: JSON.stringify({ models: OR_FREE_MODELS, messages: msgs }),
      });
      if (r.ok) {
        const j = await r.json();
        const text: string = j?.choices?.[0]?.message?.content ?? "";
        if (body.mode !== "json") return out(200, { text });
        const m = text.match(/\{[\s\S]*\}/);
        try { return out(200, { json: JSON.parse(m ? m[0] : text) }); } catch { /* cai para a IA da plataforma */ }
      } else console.error("psx-assist openrouter", r.status, (await r.text()).slice(0, 300));
    }

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return out(500, { error: "IA indisponível" });

    const toPart = (c: unknown) => (typeof c === "string" ? [{ type: "input_text", text: c }] : c);
    let input: Array<Record<string, unknown>>;
    if (body.mode === "json") {
      const content: Array<Record<string, unknown>> = [{ type: "input_text", text: String(body.prompt ?? "") }];
      for (const img of (body.images ?? []).slice(0, 3)) content.push({ type: "input_image", image_url: img });
      input = [{ role: "user", content }];
    } else {
      input = (body.messages ?? []).map((m: { role: string; content: string }) =>
        m.role === "assistant"
          ? { role: "assistant", content: [{ type: "output_text", text: String(m.content ?? "") }] }
          : { role: "user", content: toPart(String(m.content ?? "")) });
    }

    const r = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        ...(body.mode === "json" ? { instructions: "Responda somente com um objeto JSON válido, sem texto fora dele.", text: { format: { type: "json_object" } } } : {}),
        input,
      }),
    });
    if (r.status === 429) return out(429, { error: "Muitas solicitações; tente em instantes." });
    if (r.status === 402) return out(402, { error: "Créditos de IA esgotados." });
    if (!r.ok) return out(502, { error: "Falha na IA", detail: await r.text() });
    const j = await r.json();
    const text: string = j.output_text ?? (j.output ?? [])
      .flatMap((o: { content?: Array<{ type: string; text?: string }> }) => o.content ?? [])
      .filter((c: { type: string }) => c.type === "output_text")
      .map((c: { text?: string }) => c.text ?? "").join("");
    if (body.mode === "json") {
      const m = text.match(/\{[\s\S]*\}/);
      try { return out(200, { json: JSON.parse(m ? m[0] : text) }); } catch { return out(502, { error: "Resposta inválida" }); }
    }
    return out(200, { text });
  } catch (e) {
    return out(500, { error: String(e) });
  }
});
