/** Hooks da curadoria da base nacional. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  carregarHistorico,
  carregarResumo,
  listarItens,
  podeCurar,
  revisarItem,
  salvarItem,
  type CuradoriaEntidade,
  type CuradoriaStatus,
  type SalvarArgs,
} from "../services/curadoriaBase";

export function usePodeCurar() {
  return useQuery({ queryKey: ["curadoria-base", "permissao"], queryFn: podeCurar, staleTime: 300_000 });
}

export function useCuradoriaResumo(enabled: boolean) {
  return useQuery({
    queryKey: ["curadoria-base", "resumo"],
    queryFn: carregarResumo,
    enabled,
    staleTime: 30_000,
  });
}

export function useCuradoriaItens(entidade: CuradoriaEntidade, busca: string, enabled: boolean) {
  return useQuery({
    queryKey: ["curadoria-base", "itens", entidade, busca],
    queryFn: () => listarItens(entidade, busca),
    enabled,
    staleTime: 15_000,
  });
}

export function useCuradoriaHistorico(entidade: CuradoriaEntidade, id: number | null) {
  return useQuery({
    queryKey: ["curadoria-base", "historico", entidade, id],
    queryFn: () => carregarHistorico(entidade, id as number),
    enabled: id !== null,
  });
}

export function useCuradoriaMutations() {
  const qc = useQueryClient();
  const invalidar = () => qc.invalidateQueries({ queryKey: ["curadoria-base"] });

  const salvar = useMutation({ mutationFn: (args: SalvarArgs) => salvarItem(args), onSuccess: invalidar });

  const revisar = useMutation({
    mutationFn: (args: {
      entidade: CuradoriaEntidade;
      id: number;
      status: CuradoriaStatus;
      observacao?: string | null;
    }) => revisarItem(args.entidade, args.id, args.status, args.observacao),
    onSuccess: invalidar,
  });

  return { salvar, revisar };
}
