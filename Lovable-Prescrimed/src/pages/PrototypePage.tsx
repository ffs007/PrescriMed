import { readFunctionErrorMessage } from "@/modules/ai/lib/functionsError";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { supabaseUntyped } from "@/integrations/supabase/untyped";
import { tplBridge } from "@/modules/templates/psxTemplatesBridge";
import { protBridge } from "@/modules/protocols/psxProtocolsBridge";

declare global {
  interface Window {
    __psxBridge?: {
      ask: (body: unknown) => Promise<unknown>;
      logSafety?: (ev: Record<string, unknown>) => Promise<void>;
      listSafety?: () => Promise<unknown[]>;
      tpl?: (op: string, args?: Record<string, unknown>) => Promise<unknown>;
      prot?: (op: string, args?: Record<string, unknown>) => Promise<unknown>;
    };
  }
}

/** localStorage do protótipo ↔ coluna em profiles (segue o médico entre aparelhos). */
const SYNC: Record<string, string> = { "psx.cfg": "psx_cfg", "psx.docstyle": "psx_docstyle", "psx.custom": "psx_custom", "psx.safety": "psx_safety", "psx.stamp": "stamp_config" };

/** PrescriMed clínico — motor preservado, com o assistente ligado à IA do app. */
export default function PrototypePage() {
  // Acesso (assinatura ou teste grátis) é decidido por RequireAccess na rota.
  const loading = false;
  const [cfgReady, setCfgReady] = useState(false);

  useEffect(() => {
    window.__psxBridge = {
      ask: async (body) => {
        const { data, error } = await supabase.functions.invoke("psx-assist", { body });
        if (error) {
          const message = await readFunctionErrorMessage(error, error.message);
          window.dispatchEvent(new CustomEvent("psx-acesso-refresh"));
          throw { code: "error", message };
        }
        window.dispatchEvent(new CustomEvent("psx-acesso-refresh"));
        return data;
      },
      // Eventos de segurança (renal, gestação): append-only, auditáveis.
      logSafety: async (ev) => {
        const s = (v: unknown) => (v == null ? null : String(v).slice(0, 2000));
        await supabaseUntyped.from("safety_events").insert({
          tipo: s(ev.tipo) ?? "alerta", dominio: s(ev.dominio) ?? "geral", medicamento: s(ev.medicamento),
          motivo: s(ev.motivo), fonte: s(ev.fonte), justificativa: s(ev.justificativa),
          contexto: (ev.contexto as object) ?? {},
        });
      },
      listSafety: async () => {
        const { data } = await supabaseUntyped.from("safety_events").select("*").order("created_at", { ascending: false }).limit(200);
        return (data as unknown[]) ?? [];
      },
      tpl: tplBridge,
      prot: protBridge,
    };
    return () => { delete window.__psxBridge; };
  }, []);

  // Unidade/cidade salvas na conta: carrega antes do protótipo abrir e sincroniza ao editar.
  useEffect(() => {
    let uid: string | null = null;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      uid = user?.id ?? null;
      if (uid) {
        const { data } = await supabaseUntyped.from("profiles").select(Object.values(SYNC).join(",")).eq("id", uid).maybeSingle();
        const row = (data ?? {}) as Record<string, unknown>;
        for (const [key, col] of Object.entries(SYNC)) {
          if (row[col] != null) localStorage.setItem(key, JSON.stringify(row[col]));
          else if (key !== "psx.cfg") localStorage.removeItem(key);
        }
      }
      setCfgReady(true);
    })().catch(() => setCfgReady(true));
    const timers: Record<string, number> = {};
    const onStorage = (e: StorageEvent) => {
      const col = e.key ? SYNC[e.key] : undefined;
      if (!col || !uid || !e.newValue) return;
      window.clearTimeout(timers[col]);
      const val = e.newValue;
      timers[col] = window.setTimeout(() => {
        try { void supabaseUntyped.from("profiles").update({ [col]: JSON.parse(val) }).eq("id", uid); } catch { /* ignore */ }
      }, 600);
    };
    window.addEventListener("storage", onStorage);
    return () => { window.removeEventListener("storage", onStorage); Object.values(timers).forEach((t) => window.clearTimeout(t)); };
  }, []);

  if (loading || !cfgReady) return null;
  return (
    <iframe
      title="PrescriMed — Atendimento clínico"
      src="/prototype/index.html"
      className="block w-full border-0"
      style={{ height: "calc(100dvh - var(--trial-bar-h, 0px))" }}
    />
  );
}
