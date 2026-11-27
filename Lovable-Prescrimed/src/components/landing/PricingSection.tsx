import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Mensal",
    price: "15,99",
    period: "por mês",
    description: "Flexibilidade total para experimentar no seu ritmo.",
    popular: false,
    highlight: "Promoção de lançamento: 3 primeiros meses",
    savings: "Depois: R$ 25,99 por mês · renovação automática",
  },
  {
    name: "Anual",
    price: "249,50",
    period: "por ano",
    description: "Melhor custo por mês, com um único pagamento por ano.",
    popular: true,
    highlight: "20% de desconto",
    savings: "Equivale a R$ 20,79 por mês",
  },
];

const features = [
  "Prescrições ilimitadas",
  "Cálculo pediátrico automático",
  "Alertas de interação e contraindicação",
  "Protocolos e modelos próprios",
  "Receita comum, especial e controle",
  "Acesso em qualquer dispositivo",
];

const PricingSection = () => {
  return (
    <section id="planos" className="py-20 md:py-32 scroll-mt-20">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-16">
        <div className="max-w-2xl mb-16 lg:mb-20">
          <p className="text-[11px] font-medium tracking-wide font-semibold uppercase text-muted-foreground mb-6">
            Investimento
          </p>
          <h2 className="font-semibold text-3xl md:text-5xl lg:text-6xl text-foreground leading-[1.05] tracking-tight text-balance">
            Um valor justo para uma
            <span className="italic text-primary"> ferramenta de uso diário.</span>
          </h2>
          <p className="mt-6 text-base md:text-lg text-muted-foreground leading-relaxed max-w-[55ch]">
            7 dias grátis com acesso completo, sem cartão. A IA tem 30 usos no período.
            Cancele quando quiser — o controle fica com você.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-primary-soft border border-border max-w-[880px]">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col p-8 lg:p-10 ${
                plan.popular ? "bg-card" : "bg-muted/30"
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-primary text-paper text-center py-2 text-[10px] font-semibold tracking-wide font-semibold uppercase">
                  Mais escolhido
                </div>
              )}

              <div className={plan.popular ? "mt-8" : ""}>
                <div className="text-[10px] uppercase tracking-wide font-semibold text-primary mb-3">
                  {plan.name}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-foreground">R$</span>
                  <span className="font-semibold text-6xl text-foreground tabular-nums tracking-tight leading-none">
                    {plan.price}
                  </span>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">{plan.period}</div>
                {plan.highlight && (
                  <div className="mt-2 text-[11px] text-primary font-medium">
                    {plan.highlight}
                  </div>
                )}
                {plan.savings && (
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {plan.savings}
                  </div>
                )}
              </div>

              <p className="mt-6 text-sm text-muted-foreground leading-relaxed">
                {plan.description}
              </p>

              <ul className="mt-8 space-y-3 flex-1">
                {features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-3 text-sm text-foreground leading-relaxed"
                  >
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                to="/cadastro"
                className={`mt-10 block text-center px-6 py-3.5 text-[11px] font-semibold tracking-wide font-semibold uppercase transition-colors ${
                  plan.popular
                    ? "bg-primary text-paper hover:bg-primary-muted"
                    : "border border-border text-foreground hover:bg-primary hover:text-paper"
                }`}
              >
                Teste grátis por 7 dias
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
