import {
  Pill,
  FlaskConical,
  Send,
  FileCheck2,
  CalendarCheck,
  ClipboardList,
  HeartPulse,
  Stethoscope,
  CheckCircle2,
  Clock,
} from "lucide-react";

type ModuleStatus = "disponivel" | "em-breve";

interface ModuleItem {
  icon: typeof Pill;
  name: string;
  desc: string;
  pill: string;
  status: ModuleStatus;
}

const modules: ModuleItem[] = [
  {
    icon: Pill,
    name: "Receita médica",
    desc: "Comum, especial e controle. Cálculo pediátrico e checagem de interações.",
    pill: "Núcleo clínico",
    status: "disponivel",
  },
  {
    icon: FlaskConical,
    name: "Solicitação de exames",
    desc: "Laboratoriais e de imagem com justificativa estruturada e CID opcional.",
    pill: "Diagnóstico",
    status: "disponivel",
  },
  {
    icon: Send,
    name: "Encaminhamento",
    desc: "Especialidade, motivo, hipótese e resumo do caso em um clique.",
    pill: "Continuidade",
    status: "disponivel",
  },
  {
    icon: FileCheck2,
    name: "Atestado",
    desc: "Período, CID opcional e observações. Modelo padronizado e profissional.",
    pill: "Afastamento",
    status: "disponivel",
  },
  {
    icon: CalendarCheck,
    name: "Declaração de comparecimento",
    desc: "Emissão em segundos, com data, horário e acompanhante quando aplicável.",
    pill: "Comprovação",
    status: "em-breve",
  },
  {
    icon: ClipboardList,
    name: "Relatório de atendimento",
    desc: "Anamnese, hipótese, conduta e plano em formato clínico estruturado.",
    pill: "Documentação",
    status: "em-breve",
  },
  {
    icon: HeartPulse,
    name: "Orientações & retorno",
    desc: "Sinais de alarme, medidas não farmacológicas e plano de retorno claros.",
    pill: "Cuidado contínuo",
    status: "em-breve",
  },
  {
    icon: Stethoscope,
    name: "Solicitação de procedimento",
    desc: "Curativos, fisioterapia, nebulização e condutas complementares ao tratamento.",
    pill: "Procedimentos",
    status: "em-breve",
  },
];

const StatusBadge = ({ status }: { status: ModuleStatus }) =>
  status === "disponivel" ? (
    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide font-semibold text-primary">
      <CheckCircle2 className="h-3 w-3" />
      Disponível
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide font-semibold text-primary">
      <Clock className="h-3 w-3" />
      Em breve
    </span>
  );

const ModulesSection = () => {
  return (
    <section
      id="modulos"
      className="py-20 md:py-32 bg-muted/40 border-y border-border scroll-mt-20"
    >
      <div className="max-w-[1200px] mx-auto px-6 lg:px-16">
        <div className="max-w-3xl mb-14 lg:mb-20">
          <p className="text-[11px] font-medium tracking-wide font-semibold uppercase text-muted-foreground mb-6">
            Central de emissão clínica
          </p>
          <h2 className="font-semibold text-3xl md:text-5xl lg:text-6xl text-foreground leading-[1.05] tracking-tight text-balance">
            Não é só receita. É todo o
            <span className="italic text-primary"> documento clínico</span>{" "}
            do atendimento.
          </h2>
          <p className="mt-6 text-base md:text-lg text-muted-foreground leading-relaxed max-w-[58ch]">
            Oito módulos pensados para a rotina real — ambulatório, plantão e
            urgência. Um único fluxo: paciente, ação, documento. Sem trocar
            de sistema, sem refazer dados.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-primary-soft border border-border">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <article
                key={m.name}
                className="group bg-card p-7 lg:p-8 flex flex-col transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="size-10 border border-border flex items-center justify-center transition-colors group-hover:border-primary/40 group-hover:bg-primary/5">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-[10px] uppercase tracking-wide font-semibold text-primary">
                    {m.pill}
                  </span>
                </div>
                <h3 className="font-semibold text-xl md:text-2xl text-foreground tracking-tight leading-snug mb-3">
                  {m.name}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                  {m.desc}
                </p>
                <div className="mt-5 pt-4 border-t border-border">
                  <StatusBadge status={m.status} />
                </div>
              </article>
            );
          })}

          {/* Closing tile */}
          <article className="bg-primary text-paper p-7 lg:p-8 flex flex-col justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-wide font-semibold text-paper/60 mb-6">
                Próxima fronteira
              </div>
              <h3 className="font-semibold text-xl md:text-2xl tracking-tight leading-snug mb-3">
                Prontuário leve integrado
              </h3>
            </div>
            <p className="text-sm text-paper/70 leading-relaxed mt-6">
              O atendimento inteiro num único fluxo, com validade jurídica.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
};

export default ModulesSection;
