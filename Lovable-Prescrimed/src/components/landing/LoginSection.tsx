import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const LoginSection = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message === "Invalid login credentials"
        ? "E-mail ou senha incorretos."
        : error.message);
      return;
    }
    toast.success("Login realizado com sucesso!");
    navigate("/app", { replace: true });
  };

  return (
    <section id="entrar" className="scroll-mt-20 border-t border-border bg-background">
      <div className="mx-auto grid max-w-[1100px] items-center gap-12 px-5 py-20 lg:grid-cols-2 lg:py-24">
        <div className="space-y-5">
          <span className="text-[11px] font-semibold tracking-wide font-semibold uppercase text-muted-foreground">
            Acesso da conta
          </span>
          <h2 className="font-semibold text-3xl lg:text-4xl text-foreground leading-tight">
            Entrar no PrescriMed
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
            Acesso individual e seguro. Recomendado para uso em estação pessoal —
            ao usar dispositivo compartilhado, lembre-se de encerrar a sessão.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-lg border border-border bg-card p-6 shadow-paper lg:p-8"
        >
          <div className="space-y-2">
            <Label htmlFor="login-email">E-mail</Label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="login-password">Senha</Label>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? "Entrando…" : "Entrar"}
          </Button>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <Link to="/recuperar-senha" className="hover:text-foreground transition-colors">
              Esqueci minha senha
            </Link>
            <Link to="/cadastro" className="hover:text-foreground transition-colors">
              Criar conta
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
};

export default LoginSection;
