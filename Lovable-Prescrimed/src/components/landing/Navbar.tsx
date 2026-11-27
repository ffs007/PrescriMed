import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-border bg-card/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 lg:px-12">
        <Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-foreground">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-xs text-primary-foreground">PM</span>
          PrescriMed
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <a href="#modulos" className="transition-colors hover:text-foreground">Módulos</a>
          <a href="#metodologia" className="transition-colors hover:text-foreground">Fluxo</a>
          <a href="#funcionalidades" className="transition-colors hover:text-foreground">Segurança</a>
          <a href="#planos" className="transition-colors hover:text-foreground">Planos</a>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" asChild><Link to="/login">Entrar</Link></Button>
          <Button asChild><Link to="/cadastro">Criar conta</Link></Button>
        </div>

        {/* Mobile actions */}
        <div className="md:hidden flex items-center gap-4">
          <a
            href="#entrar"
            className="text-[11px] font-semibold tracking-wide font-semibold uppercase text-foreground"
          >
            Entrar
          </a>
          <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} aria-label="Abrir menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="space-y-3 border-b border-border bg-card px-5 pb-5 pt-2 md:hidden">
          <a href="#modulos" onClick={() => setOpen(false)} className="block text-sm text-muted-foreground py-2">Módulos</a>
          <a href="#metodologia" onClick={() => setOpen(false)} className="block text-sm text-muted-foreground py-2">Metodologia</a>
          <a href="#funcionalidades" onClick={() => setOpen(false)} className="block text-sm text-muted-foreground py-2">Funcionalidades</a>
          <a href="#planos" onClick={() => setOpen(false)} className="block text-sm text-muted-foreground py-2">Planos</a>
          <a href="#faq" onClick={() => setOpen(false)} className="block text-sm text-muted-foreground py-2">Perguntas</a>
          <div className="pt-2 space-y-3">
            <a
              href="#entrar"
              onClick={() => setOpen(false)}
              className="block text-center border border-border px-5 py-3 text-[11px] font-semibold tracking-wide font-semibold uppercase text-foreground"
            >
              Entrar
            </a>
            <Button className="w-full" asChild><Link to="/cadastro" onClick={() => setOpen(false)}>Criar conta</Link></Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
