/**
 * Curadoria da base nacional — acesso pelas funções do banco.
 *
 * Tudo passa por funções que exigem perfil de administrador ou revisor:
 * nenhum outro perfil lê ou grava esses registros.
 */
import { supabase } from "@/integrations/supabase/client";

export type CuradoriaEntidade =
  | "instituicao"
  | "classe_medicamentosa"
  | "condicao_clinica"
  | "protocolo_clinico";

export type CuradoriaStatus = "rascunho" | "em_revisao" | "aprovado" | "reprovado";

export const ENTIDADE_LABEL: Record<CuradoriaEntidade, string> = {
  instituicao: "Base nacional / instituições",
  classe_medicamentosa: "Classes de medicamentos",
  condicao_clinica: "Quadros clínicos",
  protocolo_clinico: "Protocolos",
};

export const STATUS_LABEL: Record<CuradoriaStatus, string> = {
  rascunho: "Rascunho",
  em_revisao: "Em revisão",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
};

export const TIPO_CONDICAO = ["patologia", "sindrome", "sintoma", "queixa", "hipotese"] as const;
export const TIPO_INSTITUICAO = ["publica", "privada", "filantropica", "universitaria", "mista"] as const;

export interface CuradoriaItem {
  id: number;
  titulo: string;
  subtitulo: string | null;
  detalhe: string | null;
  ativo: boolean;
  status: CuradoriaStatus;
  observacao: string | null;
  revisadoEm: string | null;
}

export interface CuradoriaResumo {
  instituicoes: number;
  classes: number;
  condicoes: number;
  protocolos: number;
  aprovados: number;
  em_revisao: number;
  reprovados: number;
}

export async function podeCurar(): Promise<boolean> {
  const { data, error } = await supabase.rpc("fn_curadoria_pode_editar");
  if (error) return false;
  return Boolean(data);
}

export async function carregarResumo(): Promise<CuradoriaResumo> {
  const { data, error } = await supabase.rpc("fn_curadoria_resumo");
  if (error) throw error;
  return (data ?? {}) as unknown as CuradoriaResumo;
}

export async function listarItens(
  entidade: CuradoriaEntidade,
  busca: string,
): Promise<CuradoriaItem[]> {
  const { data, error } = await supabase.rpc("fn_curadoria_listar", {
    _entidade: entidade,
    _busca: busca.trim() || null,
  });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: Number(r.id),
    titulo: r.titulo ?? "—",
    subtitulo: r.subtitulo,
    detalhe: r.detalhe,
    ativo: r.ativo ?? true,
    status: (r.status ?? "rascunho") as CuradoriaStatus,
    observacao: r.observacao,
    revisadoEm: r.revisado_em,
  }));
}

export interface SalvarArgs {
  entidade: CuradoriaEntidade;
  id?: number | null;
  nome: string;
  chave?: string | null;
  detalhe?: string | null;
  tipo?: string | null;
  cid10?: string[] | null;
  ativo?: boolean;
}

export async function salvarItem(args: SalvarArgs): Promise<number> {
  const { data, error } = await supabase.rpc("fn_curadoria_salvar", {
    _entidade: args.entidade,
    _id: args.id ?? null,
    _nome: args.nome,
    _chave: args.chave ?? null,
    _detalhe: args.detalhe ?? null,
    _tipo: args.tipo ?? null,
    _cid10: args.cid10 ?? null,
    _ativo: args.ativo ?? true,
  });
  if (error) throw error;
  return Number(data);
}

export async function revisarItem(
  entidade: CuradoriaEntidade,
  id: number,
  status: CuradoriaStatus,
  observacao?: string | null,
): Promise<void> {
  const { error } = await supabase.rpc("fn_curadoria_revisar", {
    _entidade: entidade,
    _entidade_id: id,
    _status: status,
    _observacao: observacao ?? null,
  });
  if (error) throw error;
}

export interface HistoricoLinha {
  status: CuradoriaStatus;
  observacao: string | null;
  revisadoEm: string;
}

export async function carregarHistorico(
  entidade: CuradoriaEntidade,
  id: number,
): Promise<HistoricoLinha[]> {
  const { data, error } = await supabase.rpc("fn_curadoria_historico", {
    _entidade: entidade,
    _entidade_id: id,
  });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    status: (r.status ?? "rascunho") as CuradoriaStatus,
    observacao: r.observacao,
    revisadoEm: r.revisado_em,
  }));
}
