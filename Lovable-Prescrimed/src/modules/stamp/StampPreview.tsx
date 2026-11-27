import { stampLines, type StampConfig } from "./stamp";

/** Simula um carimbo de borracha clássico. */
export function StampPreview({ config }: { config: Partial<StampConfig> }) {
  const lines = stampLines(config);
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="min-w-[260px] max-w-full border border-foreground px-6 py-3 text-center text-foreground"
        style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
      >
        {lines.length ? lines.map((l, i) => (
          <p key={i} className={i === 0 ? "text-lg font-bold leading-tight" : "text-sm leading-snug"}>{l}</p>
        )) : <p className="text-sm text-muted-foreground">Preencha o formulário</p>}
      </div>
      <div className="w-[260px] border-t border-foreground pt-1 text-center text-xs text-muted-foreground">rubrica</div>
    </div>
  );
}
