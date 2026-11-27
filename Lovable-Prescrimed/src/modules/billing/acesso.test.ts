import { describe, expect, it } from "vitest";
import { diasRestantes, podeUsarIA, temAcesso, type AcessoStatus } from "./acesso";

const now = Date.parse("2026-10-30T12:00:00Z");
const dia = 86_400_000;
const base = (o: Partial<AcessoStatus> = {}): AcessoStatus => ({
  assinante: false, em_trial: true, trial_ends_at: new Date(now + 7 * dia).toISOString(), ia_total: 0, ia_hoje: 0, ...o,
});

describe("teste grátis", () => {
  it("dura 7 dias", () => expect(diasRestantes(base().trial_ends_at, now)).toBe(7));
  it("bloqueia o 31º uso de IA", () => {
    expect(podeUsarIA(base({ ia_total: 29 }), now)).toBe("ok");
    expect(podeUsarIA(base({ ia_total: 30 }), now)).toBe("trial-ia-limit");
  });
  it("bloqueia o 9º uso no mesmo dia", () => {
    expect(podeUsarIA(base({ ia_hoje: 7, ia_total: 7 }), now)).toBe("ok");
    expect(podeUsarIA(base({ ia_hoje: 8, ia_total: 8 }), now)).toBe("trial-ia-limit-dia");
  });
  it("assinante não tem limite", () => expect(podeUsarIA(base({ assinante: true, ia_total: 500, ia_hoje: 50 }), now)).toBe("ok"));
  it("depois do 7º dia sem assinatura nega acesso", () => {
    const s = base({ trial_ends_at: new Date(now - 1000).toISOString() });
    expect(temAcesso(s, now)).toBe(false);
    expect(podeUsarIA(s, now)).toBe("sem-acesso");
  });
});
