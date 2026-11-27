/** Detecta se o texto de via (ou posologia) descreve administração injetável
 * IV/EV/IM/SC ou equivalentes. Normaliza acentos e case; match em word boundary. */
export const isInjectableRoute = (text: string | undefined | null): boolean => {
  if (!text) return false;
  const t = String(text).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (/\b(iv|ev|im|sc|s\.c\.|i\.m\.|i\.v\.|e\.v\.)\b/.test(t)) return true;
  if (/\b(intravenos[oa]|endovenos[oa]|intramuscular|subcutaneo|subcutanea|parenteral)\b/.test(t))
    return true;
  return false;
};
