import { supabase } from "@/integrations/supabase/client";

/** Estado global (fora do React) para utilitários de impressão e logs. */
let ativo = false;
const listeners = new Set<(v: boolean) => void>();

export const isHomologacao = () => ativo;
export function setHomologacao(v: boolean) {
  ativo = v;
  listeners.forEach((l) => l(v));
}
export function onHomologacaoChange(l: (v: boolean) => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export const WATERMARK_TEXT = "MODELO DE TESTE — NÃO VÁLIDO PARA USO CLÍNICO";

export type HomologacaoAcao =
  | "tela_aberta"
  | "medicamento_selecionado"
  | "documento_emitido"
  | "alerta_ignorado"
  | "problema_reportado";

export interface HomologacaoEvento {
  acao: HomologacaoAcao;
  tela?: string;
  condicao?: string | null;
  medicamento?: string | null;
  detalhe?: Record<string, unknown>;
}

/** Registra uma ação do modo homologação. Silencioso fora do modo. */
export function logHomologacao(ev: HomologacaoEvento) {
  if (!ativo) return;
  const row = {
    acao: ev.acao,
    tela: ev.tela ?? window.location.pathname,
    condicao: ev.condicao ?? null,
    medicamento: ev.medicamento ?? null,
    detalhe: ev.detalhe ?? {},
  };
  void supabase.from("homologacao_eventos" as never).insert(row as never).then(({ error }) => {
    if (error) console.error("[homologacao] falha ao registrar evento", error);
  });
}

/** Marca d'água diagonal em todas as páginas de um PDF jsPDF. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function stampWatermark(pdf: any) {
  const total = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    pdf.setPage(i);
    const w = pdf.internal.pageSize.getWidth();
    const h = pdf.internal.pageSize.getHeight();
    pdf.saveGraphicsState?.();
    try {
      pdf.setGState?.(new pdf.GState({ opacity: 0.25 }));
    } catch {
      /* opacidade opcional */
    }
    pdf.setTextColor(200, 0, 0);
    pdf.setFontSize(Math.min(w, h) / 9);
    pdf.text(WATERMARK_TEXT, w / 2, h / 2, { angle: 35, align: "center", baseline: "middle" });
    pdf.restoreGraphicsState?.();
  }
}

/** HTML/CSS de marca d'água para impressão pelo navegador (repete por página). */
export const WATERMARK_PRINT_HTML = `<div class="homolog-watermark" aria-hidden="true">${WATERMARK_TEXT}</div>`;
export const WATERMARK_PRINT_CSS = `.homolog-watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-35deg);font:700 32px sans-serif;color:rgba(200,0,0,.25);white-space:nowrap;pointer-events:none;z-index:9999}`;
