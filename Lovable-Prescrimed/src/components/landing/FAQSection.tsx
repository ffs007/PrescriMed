import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "É só receita ou emite outros documentos do atendimento?",
    a: "É uma central de emissão clínica completa: receita (comum, especial e controle), solicitação de exames, encaminhamento, atestado, declaração de comparecimento, relatório de atendimento e orientações com plano de retorno — todos no mesmo fluxo do paciente.",
  },
  {
    q: "Funciona bem no celular durante o atendimento?",
    a: "Sim. A interface é construída mobile-first para plantão e ambulatório: toques grandes, fluxo em etapas, preview do documento em drawer e sem campos espremidos.",
  },
  {
    q: "Serve para recém-formado e médico experiente?",
    a: "Sim. O recém-formado ganha apoio em dose, contraindicação e padrão de documento. O médico experiente ganha velocidade — atalhos, modelos próprios e busca instantânea para o atendimento real.",
  },
  {
    q: "Quem é responsável legalmente pelos documentos emitidos?",
    a: "Você. O PrescriMed é ferramenta de apoio à decisão clínica — equivalente a calculadora e bulário digital. A responsabilidade legal pelo documento emitido é, em qualquer cenário, do médico assinante. Por isso o fluxo sempre exige revisão antes da emissão.",
  },
  {
    q: "De onde vêm as doses e diretrizes utilizadas?",
    a: "A base é construída a partir de fontes oficiais brasileiras (Anvisa, DEF, bulas) e diretrizes de sociedades médicas reconhecidas. Cada referência é versionada e auditável dentro da plataforma.",
  },
  {
    q: "Meus dados e dos meus pacientes ficam seguros?",
    a: "Sim. Aderência estrita à LGPD, criptografia em trânsito e em repouso, e princípio de minimização de dados. Você é o controlador dos dados clínicos que registrar.",
  },
  {
    q: "Como funciona o teste grátis?",
    a: "Ao se cadastrar, você tem 7 dias de acesso completo, sem cartão. A IA tem 30 usos no período (até 8 por dia). Depois dos 7 dias, é preciso assinar para continuar — seus dados ficam guardados.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. No plano mensal a renovação é automática e você pode cancelar a qualquer momento, sem multa — o acesso segue até o fim do período pago. No plano anual, é um único pagamento por ano, sem renovação automática.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-20 md:py-32 bg-muted/40 border-t border-border scroll-mt-20">
      <div className="max-w-[1100px] mx-auto px-6 lg:px-16 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        <div className="lg:col-span-4">
          <p className="text-[11px] font-medium tracking-wide font-semibold uppercase text-muted-foreground mb-6">
            Perguntas
          </p>
          <h2 className="font-semibold text-3xl md:text-4xl lg:text-5xl text-foreground leading-[1.05] tracking-tight">
            Antes de
            <span className="italic text-primary"> começar.</span>
          </h2>
          <p className="mt-6 text-sm text-muted-foreground leading-relaxed">
            As respostas honestas para as perguntas que todo médico faz antes
            de confiar uma ferramenta clínica.
          </p>
        </div>

        <div className="lg:col-span-8">
          <Accordion type="single" collapsible className="border-t border-border">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border-b border-border"
              >
                <AccordionTrigger className="text-left font-semibold text-lg md:text-xl text-foreground hover:text-primary transition-colors py-6">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed text-sm md:text-base pb-6 max-w-[60ch]">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
