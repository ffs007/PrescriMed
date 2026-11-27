import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import React from "react";
import SafetyOverrideDialog from "../SafetyOverrideDialog";

describe("SafetyOverrideDialog com seletor estruturado", () => {
  it("se marcado checkbox 'Ausência alternativa terapêutica' → onConfirm recebe prefixo [ESTRUTURADO ...] + texto", async () => {
    let received = "";
    const onConfirm = vi.fn((t) => { received = t; });
    render(<SafetyOverrideDialog
      alert={{
        id: "a1",
        title: "Alerta X",
        message: "Mensagem",
        severity: "critical",
        category: "consistency",
        overridable: true,
      } as any}
      onConfirm={onConfirm}
      onCancel={() => {}}
    />);

    const chk = screen.getByLabelText(/Ausência de alternativa terapêutica/i);
    fireEvent.click(chk);
    const txt = screen.getByRole("textbox");
    fireEvent.change(txt, { target: { value: "Paciente em sepse refratária, múltiplas falhas." } });
    const btn = screen.getByRole("button", { name: /confirmar/i });
    fireEvent.click(btn);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(received.startsWith("[ESTRUTURADO Ausência de alternativa terapêutica]")).toBe(true);
    expect(received.length).toBeGreaterThan(30);
  });
});
