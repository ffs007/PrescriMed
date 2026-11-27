import { Link } from "react-router-dom";
import { Activity, Check, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-hero-gradient-subtle pb-16 pt-28 lg:pb-24 lg:pt-36">
      <div className="relative mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-12 px-5 lg:grid-cols-12 lg:gap-16 lg:px-12">
        {/* LEFT — Editorial copy */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          {/* Brand signature — elegant tagline above headline */}
          <div className="mb-6 flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
            <Activity className="size-3.5" /> Cockpit clínico para o plantão
          </div>

          <h1 className="max-w-[14ch] text-balance text-[2.5rem] font-extrabold leading-[1.03] text-foreground sm:text-[3.2rem] md:text-[4.1rem] lg:text-[4.7rem]">
            PrescriMed
            <span className="mt-4 block text-2xl font-semibold leading-tight sm:text-3xl">
              Documentos clínicos e prescrições para o plantão
            </span>
          </h1>

          <p className="mt-6 max-w-[55ch] text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            Paciente, documento e segurança na mesma tela. Prescreva com cálculo de dose, alertas clínicos e revisão médica obrigatória.
          </p>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-5 mt-10">
            <Button size="lg" asChild><Link to="/cadastro">Começar agora</Link></Button>
            <Button size="lg" variant="outline" asChild><a href="#modulos">Ver o fluxo clínico</a></Button>
          </div>

          <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            Prescreva em segundos. Reduza esquecimentos no plantão.
          </p>

          {/* Authority line */}
          <div className="mt-12 grid grid-cols-1 gap-3 border-t border-border pt-6 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-wide font-semibold text-primary">
                Conformidade legal
              </span>
              <span className="font-semibold text-base text-foreground">
                Dados protegidos
              </span>
            </div>
            <div className="flex flex-col gap-1.5 sm:border-l sm:border-border sm:pl-8">
              <span className="text-[10px] uppercase tracking-wide font-semibold text-primary">
                Padrão regulatório
              </span>
              <span className="font-semibold text-base text-foreground">
                Revisão obrigatória
              </span>
            </div>
            <div className="flex flex-col gap-1.5 sm:border-l sm:border-border sm:pl-8">
              <span className="text-[10px] uppercase tracking-wide font-semibold text-primary">
                Base farmacológica
              </span>
              <span className="font-semibold text-base text-foreground">
                Fontes rastreáveis
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT — Live document mockup */}
        <div className="lg:col-span-5 w-full flex justify-center lg:justify-end">
          <div className="relative flex w-full max-w-[500px] flex-col rounded-lg border border-border bg-card p-5 shadow-paper sm:p-7">
            {/* Floating live-check badge */}
            <div className="absolute -top-3 right-4 z-10 hidden items-center gap-1.5 rounded-full bg-success px-3 py-1.5 text-[10px] font-semibold text-primary-foreground shadow-paper sm:flex">
              <ShieldCheck className="size-3" /> Segurança ativa
            </div>

            {/* Document header */}
            <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
              <div>
                <div className="text-[10px] uppercase tracking-wide font-semibold text-primary mb-1">
                  Paciente
                </div>
                <div className="font-semibold text-lg tracking-tight text-foreground">
                  Lívia M. Fontes
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wide font-semibold text-primary mb-1">
                  Idade / Peso
                </div>
                <div className="text-xs tabular-nums text-foreground font-medium">
                  4a 2m — 16,4 kg
                </div>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-2">
              <div className="rounded-md border bg-background p-2"><span className="text-[10px] text-muted-foreground">Idade</span><b className="block font-mono text-sm">4a 2m</b></div>
              <div className="rounded-md border bg-background p-2"><span className="text-[10px] text-muted-foreground">Peso</span><b className="block font-mono text-sm">16,4 kg</b></div>
              <div className="rounded-md border bg-background p-2"><span className="text-[10px] text-muted-foreground">Alergias</span><b className="block text-sm text-success">Nega</b></div>
            </div>
            <div className="anim-reveal mb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] uppercase tracking-wide font-semibold text-foreground px-2 py-0.5 border border-border/20">
                  Uso oral
                </span>
              </div>
              <div className="font-semibold text-xl tracking-tight text-foreground mb-1">
                Amoxicilina + Clavulanato
              </div>
              <div className="text-[11px] text-muted-foreground mb-3">
                (400mg + 57mg) / 5ml — Suspensão oral
              </div>

              <div className="anim-reveal anim-delay-1 mt-2 rounded-md border-l-2 border-primary bg-primary/5 p-3.5">
                <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                  <span>OMA · 90mg/kg/dia</span>
                  <span className="font-medium tabular-nums">Vol: 4,6 ml</span>
                </div>
                <div className="text-[13px] text-foreground leading-relaxed">
                  Administrar{" "}
                  <strong className="font-semibold tabular-nums">4,6 ml</strong>{" "}
                  a cada{" "}
                  <strong className="font-semibold tabular-nums">12h</strong>,
                  por{" "}
                  <strong className="font-semibold tabular-nums">10 dias</strong>.
                </div>
              </div>
            </div>

            {/* Medication 2 */}
            <div className="anim-reveal anim-delay-2 mb-auto pt-4 border-t border-border-faint">
              <div className="font-semibold text-xl tracking-tight text-foreground mb-1">
                Dipirona Monoidratada
              </div>
              <div className="text-[11px] text-muted-foreground mb-3">
                500mg/ml — Solução em gotas
              </div>
              <div className="anim-reveal anim-delay-3 border-l-2 border-border/20 pl-3 py-1 text-[13px] text-foreground leading-relaxed">
                Dar{" "}
                <strong className="font-semibold tabular-nums">16 gotas</strong>{" "}
                a cada{" "}
                <strong className="font-semibold tabular-nums">6h</strong>, se
                febre &gt; 37,8 °C.
              </div>
            </div>

            {/* Footer action */}
            <div className="anim-reveal anim-delay-4 mt-6 border-t border-border pt-5">
              <div className="mb-3 flex items-center gap-2 rounded-md border border-success/30 bg-success/10 p-3 text-xs font-semibold text-primary">
                <Check className="size-4" /> Dose calculada por peso
              </div>
              <div className="flex items-center justify-between rounded-md border border-warning/30 bg-warning/10 p-3 text-xs text-foreground">
                <span className="flex items-center gap-2"><Sparkles className="size-4 text-regulatory" /> Revisei este documento</span>
                <span className="rounded bg-primary px-3 py-1.5 font-semibold text-primary-foreground">Baixar PDF</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
