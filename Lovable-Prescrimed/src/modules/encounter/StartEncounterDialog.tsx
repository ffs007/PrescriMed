/**
 * Abertura de atendimento: o único lugar onde os dados do paciente e do
 * ambiente são digitados. Todos os documentos depois herdam daqui.
 */
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEncounterContext } from "./EncounterProvider";
import type { EncounterAmbiente } from "./services/encounters";

const AMBIENTES: Array<{ value: EncounterAmbiente; label: string }> = [
  { value: "ambulatorial", label: "Ambulatorial" },
  { value: "ps", label: "Pronto-socorro" },
  { value: "emergencia", label: "Emergência" },
  { value: "hospitalar", label: "Hospitalar" },
  { value: "uti", label: "UTI" },
];

export default function StartEncounterDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { start } = useEncounterContext();
  const [saving, setSaving] = useState(false);
  const [nome, setNome] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [sexo, setSexo] = useState("");
  const [peso, setPeso] = useState("");
  const [alergias, setAlergias] = useState("");
  const [funcaoRenal, setFuncaoRenal] = useState("");
  const [ambiente, setAmbiente] = useState<EncounterAmbiente>("ps");
  const [instituicao, setInstituicao] = useState("");
  const [unidade, setUnidade] = useState("");
  const [convenio, setConvenio] = useState("");
  const [pa, setPa] = useState("");
  const [fc, setFc] = useState("");
  const [fr, setFr] = useState("");
  const [temperatura, setTemperatura] = useState("");
  const [saturacao, setSaturacao] = useState("");
  const [glicemia, setGlicemia] = useState("");
  const [dor, setDor] = useState("");
  const [glasgow, setGlasgow] = useState("");
  const [hipotese, setHipotese] = useState("");

  const submit = async () => {
    if (!nome.trim()) {
      toast.error("Informe o nome do paciente.");
      return;
    }
    setSaving(true);
    try {
      const pesoNum = Number(peso.replace(",", "."));
      await start({
        nome,
        dataNascimento: nascimento || null,
        sexo: sexo || null,
        pesoKg: Number.isFinite(pesoNum) && pesoNum > 0 ? pesoNum : null,
        alergias: alergias || null,
        funcaoRenal: funcaoRenal || null,
        ambiente,
        instituicao: instituicao || null,
        unidade: unidade || null,
        convenio: convenio || null,
        sinaisVitais: { pa, fc, fr, temperatura, saturacao, glicemia, dor, glasgow },
        hipoteseDiagnostica: hipotese || null,
      });
      toast.success("Atendimento aberto. Os documentos já usam estes dados.");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível abrir o atendimento.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Abrir atendimento</DialogTitle>
          <DialogDescription>
            Preencha uma única vez. Receita, atestado, pedido de exames e encaminhamento passam a
            herdar estes dados.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="at-nome">Nome do paciente</Label>
              <Input id="at-nome" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="at-nasc">Data de nascimento</Label>
              <Input id="at-nasc" type="date" value={nascimento} onChange={(e) => setNascimento(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="at-sexo">Sexo</Label>
              <Select value={sexo} onValueChange={setSexo}>
                <SelectTrigger id="at-sexo"><SelectValue placeholder="Não informado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="feminino">Feminino</SelectItem>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="at-peso">Peso (kg)</Label>
              <Input id="at-peso" inputMode="decimal" value={peso} onChange={(e) => setPeso(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="at-renal">Função renal</Label>
              <Select value={funcaoRenal} onValueChange={setFuncaoRenal}>
                <SelectTrigger id="at-renal"><SelectValue placeholder="Não avaliada" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="leve">Alteração leve</SelectItem>
                  <SelectItem value="moderada">Alteração moderada</SelectItem>
                  <SelectItem value="grave">Alteração grave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="at-alergias">Alergias</Label>
              <Input id="at-alergias" value={alergias} onChange={(e) => setAlergias(e.target.value)} placeholder="Nega alergias" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label htmlFor="at-amb">Ambiente</Label>
              <Select value={ambiente} onValueChange={(v) => setAmbiente(v as EncounterAmbiente)}>
                <SelectTrigger id="at-amb"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AMBIENTES.map((a) => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="at-inst">Instituição</Label>
              <Input id="at-inst" value={instituicao} onChange={(e) => setInstituicao(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="at-unid">Unidade</Label>
              <Input id="at-unid" value={unidade} onChange={(e) => setUnidade(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="at-conv">Convênio</Label>
              <Input id="at-conv" value={convenio} onChange={(e) => setConvenio(e.target.value)} />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="at-hip">Hipótese diagnóstica</Label>
              <Input id="at-hip" value={hipotese} onChange={(e) => setHipotese(e.target.value)} />
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Sinais vitais</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="grid gap-1.5"><Label htmlFor="sv-pa">PA</Label><Input id="sv-pa" value={pa} onChange={(e) => setPa(e.target.value)} placeholder="120/80" /></div>
              <div className="grid gap-1.5"><Label htmlFor="sv-fc">FC</Label><Input id="sv-fc" value={fc} onChange={(e) => setFc(e.target.value)} placeholder="bpm" /></div>
              <div className="grid gap-1.5"><Label htmlFor="sv-fr">FR</Label><Input id="sv-fr" value={fr} onChange={(e) => setFr(e.target.value)} placeholder="irpm" /></div>
              <div className="grid gap-1.5"><Label htmlFor="sv-temp">Temperatura</Label><Input id="sv-temp" value={temperatura} onChange={(e) => setTemperatura(e.target.value)} placeholder="°C" /></div>
              <div className="grid gap-1.5"><Label htmlFor="sv-sat">SatO₂</Label><Input id="sv-sat" value={saturacao} onChange={(e) => setSaturacao(e.target.value)} placeholder="%" /></div>
              <div className="grid gap-1.5"><Label htmlFor="sv-gli">Glicemia</Label><Input id="sv-gli" value={glicemia} onChange={(e) => setGlicemia(e.target.value)} placeholder="mg/dL" /></div>
              <div className="grid gap-1.5"><Label htmlFor="sv-dor">Dor (0-10)</Label><Input id="sv-dor" value={dor} onChange={(e) => setDor(e.target.value)} /></div>
              <div className="grid gap-1.5"><Label htmlFor="sv-gla">Glasgow</Label><Input id="sv-gla" value={glasgow} onChange={(e) => setGlasgow(e.target.value)} /></div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Abrindo..." : "Abrir atendimento"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
