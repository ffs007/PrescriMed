import { supabase } from "@/integrations/supabase/client";
import type { ClinicalAlertKind, AlertLevel, Severity } from "./clinicalAlertsCalc";

export type ClinicalAlertAction =
  | "visualizou" | "removeu_medicamento" | "substituiu_medicamento"
  | "confirmou_com_justificativa" | "bloqueado_pelo_sistema" | "ignorou_informativo";

export interface ClinicalLogEntry {
  id_prescricao?: string | null;
  id_paciente?: string | null;
  principio_ativo?: string | null;
  medicamento_prescrito?: string | null;
  tipo_alerta: ClinicalAlertKind;
  condicao_relacionada?: string | null;
  gravidade?: Severity | null;
  nivel_alerta?: AlertLevel | null;
  mensagem_alerta: string;
  acao_usuario?: ClinicalAlertAction | null;
  justificativa?: string | null;
}

const queue: ClinicalLogEntry[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

async function flush() {
  timer = null;
  if (!queue.length) return;
  const batch = queue.splice(0, queue.length);
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const rows = batch.map((e) => ({ ...e, usuario_responsavel: user.id }));
    const { error } = await supabase.from("log_alertas_alergias_condicoes").insert(rows as never);
    if (error) console.error("[clinicalAlertsLog] falha ao gravar log:", error);
  } catch (error) {
    console.error("[clinicalAlertsLog] falha ao gravar log:", error);
  }
}

import { logHomologacao } from "@/modules/homologacao/state";

export function logClinicalAlert(entry: ClinicalLogEntry) {
  if (entry.acao_usuario === "confirmou_com_justificativa" || entry.acao_usuario === "ignorou_informativo") {
    logHomologacao({ acao: "alerta_ignorado", medicamento: entry.medicamento_prescrito ?? entry.principio_ativo ?? null, detalhe: { alerta: entry.mensagem_alerta, tipo: entry.tipo_alerta, justificativa: entry.justificativa ?? null } });
  }
  queue.push(entry);
  if (timer) clearTimeout(timer);
  timer = setTimeout(flush, 1000);
}
