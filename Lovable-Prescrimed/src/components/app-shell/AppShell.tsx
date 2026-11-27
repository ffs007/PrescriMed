import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Bell, Building2, Plus, Search, Stethoscope } from "lucide-react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import AppSidebar from "./AppSidebar";
import MobileBottomNav from "./MobileBottomNav";
import { useBetaSettings } from "@/modules/beta/hooks/useBetaSettings";
import BetaBadge from "@/modules/beta/BetaBadge";
import BetaTermsGate from "@/modules/beta/BetaTermsGate";
import FeedbackButton from "@/modules/beta/feedback/FeedbackButton";
import ChatbotWidget from "@/modules/ai/ChatbotWidget";
import UnifiedSearchDialog from "@/modules/search/UnifiedSearchDialog";
import UsageTracker from "@/modules/usage/UsageTracker";
import { useSubscription } from "@/hooks/useSubscription";
import InstallAppBanner from "./InstallAppBanner";
import HomologacaoBanner from "@/modules/homologacao/HomologacaoBanner";
import ReportProblemButton from "@/modules/homologacao/ReportProblemButton";
import EncounterBar from "@/modules/encounter/EncounterBar";

export default function AppShell() {
  const navigate = useNavigate();
  const { settings } = useBetaSettings();
  const betaAtivo = Boolean(settings?.modo_beta_ativo);
  const [searchOpen, setSearchOpen] = useState(false);
  const { isActive: planoAtivo } = useSubscription();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <SidebarProvider>
      <UsageTracker />
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          <HomologacaoBanner />
          <InstallAppBanner />
          <header className="sticky top-0 z-30 flex h-16 [.homologacao_&]:top-8 items-center gap-3 border-b bg-card/95 px-3 backdrop-blur sm:px-5">
            <SidebarTrigger />
            <NavLink to="/app" className="flex min-w-0 items-center gap-2 font-semibold text-primary md:hidden"><Stethoscope className="h-5 w-5" /><span>PrescriMed</span></NavLink>
            {betaAtivo && <BetaBadge />}
            <Button variant="outline" className="hidden min-w-0 flex-1 justify-start gap-2 text-muted-foreground sm:flex md:max-w-md" onClick={() => setSearchOpen(true)} aria-label="Abrir busca unificada"><Search className="h-4 w-4" /><span className="truncate">Buscar pacientes, documentos, protocolos...</span><kbd className="ml-auto hidden text-[10px] lg:inline">Ctrl K</kbd></Button>
            <div className="ml-auto hidden items-center gap-2 lg:flex"><Button variant="outline" size="sm" className="gap-2"><Building2 className="h-4 w-4" />Unidade clínica</Button><Button variant="ghost" size="icon" aria-label="Notificações"><Bell className="h-4 w-4" /></Button></div>
            <Button variant="outline" size="icon" className="sm:hidden" onClick={() => setSearchOpen(true)} aria-label="Buscar"><Search className="h-4 w-4" /></Button>
            <Button size="sm" onClick={() => navigate("/app/prescricao/nova")}><Plus className="mr-1 h-4 w-4" /><span className="hidden sm:inline">Nova prescrição</span><span className="sm:hidden">Nova</span></Button>
          </header>
          <EncounterBar />
          <main className="flex-1 pb-20 md:pb-4"><Outlet /></main>
          <MobileBottomNav />
          {planoAtivo && <ChatbotWidget />}
          <UnifiedSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
          {betaAtivo && <BetaTermsGate />}
          {betaAtivo && <FeedbackButton />}
          <ReportProblemButton />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
