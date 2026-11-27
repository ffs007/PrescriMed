import { Link } from "react-router-dom";

const testimonials = [
  {
    quote:
      "Ganhei velocidade sem perder segurança. Hoje prescrevo com muito menos atrito durante o plantão e isso muda completamente como eu termino o turno.",
    name: "Médico clínico — pronto atendimento",
    context: "Validação fechada · SP",
  },
  {
    quote:
      "A interface não me força a sair do raciocínio clínico. Eu monto a receita enquanto ainda estou pensando no caso.",
    name: "Médica generalista — atenção primária",
    context: "Validação fechada · MG",
  },
  {
    quote:
      "Como recém-formado, me sinto mais confiante para revisar dose pediátrica. O alerta de contraindicação já me poupou de dois erros.",
    name: "Médico recém-formado — urgência",
    context: "Validação fechada · RS",
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-20 md:py-32 bg-muted/40 border-y border-border">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-16">
        {/* Credibility block */}
        <div className="max-w-3xl mb-12 pb-10 border-b border-border">
          <p className="font-semibold text-xl md:text-2xl italic text-foreground leading-relaxed">
            Criada a partir da rotina médica real.
          </p>
          <p className="mt-3 text-sm md:text-base text-muted-foreground leading-relaxed max-w-[60ch]">
            A plataforma foi desenhada com visão médica e refinada com a escuta de profissionais 
            que conhecem, na prática, os atritos do atendimento.
          </p>
        </div>

        <div className="max-w-2xl mb-16 lg:mb-20">
          <p className="text-[11px] font-medium tracking-wide font-semibold uppercase text-muted-foreground mb-6">
            Em validação fechada
          </p>
          <h2 className="font-semibold text-3xl md:text-5xl lg:text-6xl text-foreground leading-[1.05] tracking-tight text-balance">
            O que dizem os médicos que já
            <span className="italic text-primary"> usam no atendimento.</span>
          </h2>
          <p className="mt-6 text-sm md:text-base text-muted-foreground leading-relaxed max-w-[55ch]">
            Estamos refinando a plataforma com um grupo fechado de médicos
            antes da abertura pública. Identidades preservadas a pedido dos parceiros.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {testimonials.map((t, i) => (
            <figure
              key={i}
              className="flex flex-col bg-card p-8 lg:p-10 shadow-paper border border-border"
            >
              <div className="font-semibold text-5xl text-primary/30 leading-none mb-4">
                &ldquo;
              </div>
              <blockquote className="font-semibold text-lg lg:text-xl text-foreground leading-snug flex-1">
                {t.quote}
              </blockquote>
              <figcaption className="mt-8 pt-6 border-t border-border">
                <div className="text-sm font-medium text-foreground">{t.name}</div>
                <div className="text-[11px] uppercase tracking-wide font-semibold text-primary mt-1">
                  {t.context}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/cadastro"
            className="font-semibold italic text-base md:text-lg text-foreground hover:text-muted-foreground transition-colors border-b border-border/20 hover:border-border/50 pb-0.5"
          >
            Quer participar da próxima leva de validação? →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
