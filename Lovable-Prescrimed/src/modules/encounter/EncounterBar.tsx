/**
 * Barra do atendimento em aberto: quem está sendo atendido, onde, e os
 * documentos já emitidos neste atendimento. Fica visível em todas as telas.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, FileText, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ageInYearsFrom, useEncounterContext } from "./EncounterProvider";
import { listEncounterDocuments, type EncounterAmbiente } from "./services/encounters";
import StartEncounterDialog from "./StartEncounterDialog";

const AMBIENTE_LABEL: Record<EncounterAmbiente, string> = {
  ambulatorial: "Ambulatorial",
  ps: "Pronto-socorro",
  emergencia: "Emergência",
  hospitalar: "Hospitalar",
  uti: "UTI",
};

export default function EncounterBar() {
  const { encounter, openEncounters, select, close } = useEncounterContext();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: docs } = useQuery({
    queryKey: ["atendimento-documentos", encounter?.id],
    queryFn: () => listEncounterDocuments(encounter!.id),
    enabled: Boolean(encounter?.id),
    staleTime: 30 * 1000,
  });

  const idade = encounter ? ageInYearsFrom(encounter.paciente.dataNascimento) : null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b bg-muted/40 px-3 py-2 text-sm sm:px-5">
        {encounter ? (
          <>
            <UserRound className="h-4 w-4 text-primary" aria-hidden />
            <span className="font-medium">{encounter.paciente.nome}</span>
            {idade !== null && (
              <span className="text-muted-foreground">
                {idade < 2 ? `${Math.round(idade * 12)} meses` : `${Math.floor(idade)} anos`}
              </span>
            )}
            {encounter.paciente.pesoKg !== null && (
              <span className="text-muted-foreground">{encounter.paciente.pesoKg} kg</span>
            )}
            <Badge variant="secondary">{AMBIENTE_LABEL[encounter.ambiente]}</Badge>
            {encounter.paciente.alergias && (
              <Badge variant="destructive">Alergia: {encounter.paciente.alergias}</Badge>
            )}
            {encounter.cidPrincipal && <Badge variant="outline">{encounter.cidPrincipal}</Badge>}

            <div className="ml-auto flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <FileText className="h-4 w-4" />
                    Documentos ({docs?.length ?? 0})
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>Emitidos neste atendimento</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {(docs ?? []).length === 0 ? (
                    <DropdownMenuItem disabled>Nenhum documento ainda</DropdownMenuItem>
                  ) : (
                    (docs ?? []).map((d) => (
                      <DropdownMenuItem key={`${d.origem}-${d.id}`} className="flex-col items-start gap-0.5">
                        <span className="font-medium capitalize">{d.tipo.replace(/_/g, " ")}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(d.criadoEm).toLocaleString("pt-BR")}
                          {d.titulo ? ` — ${d.titulo}` : ""}
                        </span>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="sm" onClick={() => void close()}>
                Encerrar
              </Button>
            </div>
          </>
        ) : (
          <>
            <span className="text-muted-foreground">Nenhum atendimento em aberto</span>
            <div className="ml-auto flex items-center gap-2">
              {openEncounters.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1">
                      Retomar <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72">
                    <DropdownMenuLabel>Atendimentos em andamento</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {openEncounters.map((e) => (
                      <DropdownMenuItem key={e.id} onClick={() => select(e.id)} className="flex-col items-start gap-0.5">
                        <span className="font-medium">{e.paciente.nome}</span>
                        <span className="text-xs text-muted-foreground">
                          {AMBIENTE_LABEL[e.ambiente]} — {new Date(e.inicio).toLocaleString("pt-BR")}
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button size="sm" onClick={() => setDialogOpen(true)}>Abrir atendimento</Button>
            </div>
          </>
        )}
      </div>
      <StartEncounterDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
