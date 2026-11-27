import { Fragment, type ReactNode } from "react";

/** Renderiza **negrito** usado na dose calculada; o restante fica como texto. */
export function renderRich(text: string): ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>
      : <Fragment key={i}>{part}</Fragment>,
  );
}

export const stripRich = (text: string) => text.replace(/\*\*/g, "");
