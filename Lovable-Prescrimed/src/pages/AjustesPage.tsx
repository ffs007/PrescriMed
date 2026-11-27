import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { supabaseUntyped } from "@/integrations/supabase/untyped";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { StampPreview } from "@/modules/stamp/StampPreview";
import { stampSchema, UFS, type StampConfig } from "@/modules/stamp/stamp";

const EMPTY: StampConfig = { nome: "", crm: "", uf: "SP", especialidade: "", rqe: "", cargo: "", ativo: true };

export default function AjustesPage() {
  const [cfg, setCfg] = useState<StampConfig>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUid(user.id);
      const { data } = await supabaseUntyped.from("profiles").select("stamp_config").eq("id", user.id).maybeSingle();
      const sc = (data as { stamp_config?: Partial<StampConfig> } | null)?.stamp_config;
      if (sc) setCfg({ ...EMPTY, ...sc });
    })();
  }, []);

  const set = <K extends keyof StampConfig>(k: K, v: StampConfig[K]) => setCfg((c) => ({ ...c, [k]: v }));

  const save = async () => {
    const r = stampSchema.safeParse(cfg);
    if (!r.success) { toast.error(r.error.issues[0].message); return; }
    if (!uid) return;
    setSaving(true);
    const { error } = await supabaseUntyped.from("profiles").update({ stamp_config: r.data }).eq("id", uid);
    setSaving(false);
    if (error) { toast.error("Não foi possível salvar o carimbo."); return; }
    localStorage.setItem("psx.stamp", JSON.stringify(r.data));
    toast.success("Carimbo salvo. Ele sairá nos próximos documentos.");
  };

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Ajustes</h1>
        <Button variant="outline" asChild><Link to="/app">Voltar ao atendimento</Link></Button>
      </div>
      <Tabs defaultValue="carimbo">
        <TabsList><TabsTrigger value="carimbo">Meu Carimbo</TabsTrigger></TabsList>
        <TabsContent value="carimbo">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Dados do carimbo</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5"><Label htmlFor="nome">Nome completo</Label>
                  <Input id="nome" value={cfg.nome} maxLength={80} onChange={(e) => set("nome", e.target.value)} placeholder="Dra. Ana Souza" /></div>
                <div className="grid grid-cols-[1fr_110px] gap-3">
                  <div className="space-y-1.5"><Label htmlFor="crm">CRM</Label>
                    <Input id="crm" inputMode="numeric" value={cfg.crm} maxLength={8} onChange={(e) => set("crm", e.target.value.replace(/\D/g, ""))} /></div>
                  <div className="space-y-1.5"><Label>UF</Label>
                    <Select value={cfg.uf} onValueChange={(v) => set("uf", v as StampConfig["uf"])}>
                      <SelectTrigger aria-label="UF"><SelectValue /></SelectTrigger>
                      <SelectContent>{UFS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                    </Select></div>
                </div>
                <div className="grid grid-cols-[1fr_110px] gap-3">
                  <div className="space-y-1.5"><Label htmlFor="esp">Especialidade (opcional)</Label>
                    <Input id="esp" value={cfg.especialidade} maxLength={60} onChange={(e) => set("especialidade", e.target.value)} /></div>
                  <div className="space-y-1.5"><Label htmlFor="rqe">RQE</Label>
                    <Input id="rqe" value={cfg.rqe} maxLength={12} onChange={(e) => set("rqe", e.target.value)} /></div>
                </div>
                <div className="space-y-1.5"><Label htmlFor="cargo">Cargo (opcional)</Label>
                  <Input id="cargo" value={cfg.cargo} maxLength={60} onChange={(e) => set("cargo", e.target.value)} placeholder="Diretor Técnico" /></div>
                <div className="flex items-center justify-between rounded-md border border-border p-3">
                  <Label htmlFor="ativo">Imprimir carimbo nos documentos</Label>
                  <Switch id="ativo" checked={cfg.ativo} onCheckedChange={(v) => set("ativo", v)} />
                </div>
                <Button onClick={save} disabled={saving} className="w-full">{saving ? "Salvando…" : "Salvar carimbo"}</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Prévia</CardTitle></CardHeader>
              <CardContent className="flex min-h-[240px] items-center justify-center bg-card">
                <StampPreview config={cfg} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
