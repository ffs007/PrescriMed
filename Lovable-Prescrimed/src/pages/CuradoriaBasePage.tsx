/**
 * Curadoria da base nacional — criar, revisar e aprovar
 * instituições, classes de medicamentos, quadros clínicos e protocolos.
 *
 * Acesso somente para administradores e revisores: o próprio banco recusa
 * qualquer outro perfil.
 */
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, History, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ENTIDADE_LABEL,
  STATUS_LABEL,
  TIPO_CONDICAO,
  TIPO_INSTITUICAO,
  type CuradoriaEntidade,
  type CuradoriaStatus,
} from "@/modules/curadoria/services/curadoriaBase";
import {
  useCuradoriaHistorico,
  useCuradoriaItens,
  useCuradoriaMutations,
  useCuradoriaResumo,
  usePodeCurar,
} from "@/modules/curadoria/hooks/useCuradoriaBase";

const ENTIDADES = Object.keys(ENTIDADE_LABEL) as CuradoriaEntidade[];

const STATUS_TONE: Record<CuradoriaStatus, string> = {
  rascunho: "bg-muted text-muted-foreground",
  em_revisao: "bg-secondary text-secondary-foreground",
  aprovado: "bg-primary/10 text-primary",
  reprovado: "bg-destructive/10 text-destructive",
};

const Metric = ({ label, value }: { label: string; value: number | string }) => (
  <div className="rounded-md border border-border bg-card p-3">
    <div className="text-2xl font-semibold text-foreground">{value}</div>
    <div className="text-xs text-muted-foreground">{label}</div>
  </div>
);

const CuradoriaBasePage = () => {
  const [entidade, setEntidade] = useState<CuradoriaEntidade>("condicao_clinica");
  const [busca, setBusca] = useState("");
  const [nome, setNome] = useState("");
  const [chave, setChave] = useState("");
  const [detalhe, setDetalhe] = useState("");
  const [tipo, setTipo] = useState<string>("patologia");
  const [cids, setCids] = useState("");
  const [editando, setEditando] = useState<number | null>(null);
  const [historicoDe, setHistoricoDe] = useState<number | null>(null);
  const [observacao, setObservacao] = useState("");

  const permissao = usePodeCurar();
  const liberado = permissao.data === true;

  const resumo = useCuradoriaResumo(liberado);
  const itens = useCuradoriaItens(entidade, busca, liberado);
  const historico = useCuradoriaHistorico(entidade, historicoDe);
  const { salvar, revisar } = useCuradoriaMutations();

  const limpar = () => {
    setNome(""); setChave(""); setDetalhe(""); setCids(""); setEditando(null);
  };

  const handleSalvar = async () => {
    if (!nome.trim()) {
      toast.error("Informe o nome do item.");
      return;
    }
    try {
      await salvar.mutateAsync({
        entidade,
        id: editando,
        nome: nome.trim(),
        chave: chave.trim() || null,
        detalhe: detalhe.trim() || null,
        tipo: entidade === "condicao_clinica" || entidade === "instituicao" ? tipo : null,
        cid10: cids.trim()
          ? cids.split(/[,;\s]+/).map((c) => c.trim().toUpperCase()).filter(Boolean)
          : null,
      });
      toast.success(editando ? "Item atualizado." : "Item criado como rascunho.");
      limpar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar.");
    }
  };

  const handleRevisar = async (id: number, status: CuradoriaStatus) => {
    try {
      await revisar.mutateAsync({ entidade, id, status, observacao: observacao.trim() || null });
      toast.success(`Marcado como ${STATUS_LABEL[status].toLowerCase()}.`);
      setObservacao("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível registrar a revisão.");
    }
  };

  if (permissao.isLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        Verificando permissões…
      </main>
    );
  }

  if (!liberado) {
    return (
      <main className="container mx-auto max-w-2xl px-4 py-10 text-center">
        <h1 className="text-lg font-semibold text-foreground">Curadoria da base nacional</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta área é restrita a administradores e revisores clínicos.
        </p>
        <Button variant="outline" className="mt-4" asChild>
          <Link to="/app">Voltar ao app</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-5xl space-y-5 px-4 py-6">
      <Helmet>
        <title>Curadoria da base nacional | PrescriMed</title>
        <meta
          name="description"
          content="Crie, revise e aprove a base nacional, classes de medicamentos, quadros clínicos e protocolos."
        />
      </Helmet>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/app" aria-label="Voltar"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Curadoria da base nacional</h1>
          <p className="text-sm text-muted-foreground">
            Cada item nasce como rascunho e só vale como referência depois de aprovado.
          </p>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Instituições" value={resumo.data?.instituicoes ?? "—"} />
        <Metric label="Classes" value={resumo.data?.classes ?? "—"} />
        <Metric label="Quadros clínicos" value={resumo.data?.condicoes ?? "—"} />
        <Metric label="Protocolos" value={resumo.data?.protocolos ?? "—"} />
        <Metric label="Aprovados" value={resumo.data?.aprovados ?? "—"} />
        <Metric label="Em revisão" value={resumo.data?.em_revisao ?? "—"} />
        <Metric label="Reprovados" value={resumo.data?.reprovados ?? "—"} />
      </section>

      <Tabs value={entidade} onValueChange={(v) => { setEntidade(v as CuradoriaEntidade); limpar(); }}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start">
          {ENTIDADES.map((e) => (
            <TabsTrigger key={e} value={e} className="text-xs">{ENTIDADE_LABEL[e]}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            {editando ? "Editar item" : `Novo item — ${ENTIDADE_LABEL[entidade]}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do item" />
          </div>

          {entidade !== "condicao_clinica" && (
            <div className="space-y-1">
              <Label className="text-xs">Código / identificador</Label>
              <Input
                value={chave}
                onChange={(e) => setChave(e.target.value)}
                placeholder="Gerado a partir do nome se ficar vazio"
              />
            </div>
          )}

          {(entidade === "condicao_clinica" || entidade === "instituicao") && (
            <div className="space-y-1">
              <Label className="text-xs">Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(entidade === "condicao_clinica" ? TIPO_CONDICAO : TIPO_INSTITUICAO).map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(entidade === "condicao_clinica" || entidade === "protocolo_clinico") && (
            <div className="space-y-1">
              <Label className="text-xs">CIDs relacionados</Label>
              <Input value={cids} onChange={(e) => setCids(e.target.value)} placeholder="J18, J13" />
            </div>
          )}

          {entidade !== "condicao_clinica" && entidade !== "instituicao" && (
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">Descrição</Label>
              <Textarea
                value={detalhe}
                onChange={(e) => setDetalhe(e.target.value)}
                rows={2}
                placeholder="Para que serve, em uma linha"
              />
            </div>
          )}

          <div className="flex gap-2 sm:col-span-2">
            <Button onClick={handleSalvar} disabled={salvar.isPending}>
              {salvar.isPending
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : <Plus className="mr-2 h-4 w-4" />}
              {editando ? "Salvar alterações" : "Criar item"}
            </Button>
            {editando && (
              <Button variant="outline" onClick={limpar}>Cancelar edição</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar nesta aba…"
        aria-label="Buscar item da curadoria"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            {ENTIDADE_LABEL[entidade]} · {itens.data?.length ?? 0}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {itens.isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {itens.isError && (
            <p className="py-6 text-center text-xs text-destructive">
              Não foi possível carregar os itens.
            </p>
          )}
          {!itens.isLoading && (itens.data?.length ?? 0) === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhum item nesta aba.</p>
          )}

          <Textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            rows={2}
            placeholder="Observação da revisão (opcional) — vale para a próxima decisão registrada"
            className="text-xs"
          />

          {(itens.data ?? []).map((item) => (
            <div key={item.id} className="space-y-2 rounded-md border border-border p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground">{item.titulo}</div>
                  <div className="text-xs text-muted-foreground">
                    {[item.subtitulo, item.detalhe].filter(Boolean).join(" · ")}
                  </div>
                  {item.observacao && (
                    <div className="mt-1 text-xs italic text-muted-foreground">“{item.observacao}”</div>
                  )}
                </div>
                <Badge variant="outline" className={STATUS_TONE[item.status]}>
                  {STATUS_LABEL[item.status]}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => {
                  setEditando(item.id);
                  setNome(item.titulo);
                  setChave(item.subtitulo ?? "");
                  setDetalhe(item.detalhe === "—" ? "" : item.detalhe ?? "");
                }}>
                  Editar
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleRevisar(item.id, "em_revisao")}>
                  Enviar para revisão
                </Button>
                <Button size="sm" onClick={() => handleRevisar(item.id, "aprovado")}>
                  <Check className="mr-1 h-3.5 w-3.5" /> Aprovar
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleRevisar(item.id, "reprovado")}>
                  <X className="mr-1 h-3.5 w-3.5" /> Reprovar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setHistoricoDe(historicoDe === item.id ? null : item.id)}
                >
                  <History className="mr-1 h-3.5 w-3.5" /> Histórico
                </Button>
              </div>

              {historicoDe === item.id && (
                <div className="space-y-1 rounded-md bg-muted/40 p-2 text-xs">
                  {historico.isLoading && <p className="text-muted-foreground">Carregando…</p>}
                  {!historico.isLoading && (historico.data?.length ?? 0) === 0 && (
                    <p className="text-muted-foreground">Sem decisões registradas.</p>
                  )}
                  {(historico.data ?? []).map((h, i) => (
                    <p key={i} className="text-muted-foreground">
                      {new Date(h.revisadoEm).toLocaleString("pt-BR")} · {STATUS_LABEL[h.status]}
                      {h.observacao ? ` — ${h.observacao}` : ""}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
};

export default CuradoriaBasePage;
