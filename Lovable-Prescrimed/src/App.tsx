import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
const PrototypePage = lazy(() => import("./pages/PrototypePage"));
const AjustesPage = lazy(() => import("./pages/AjustesPage"));
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
const Index = lazy(() => import("./pages/Index.tsx"));
const Login = lazy(() => import("./pages/Login.tsx"));
const Cadastro = lazy(() => import("./pages/Cadastro.tsx"));
const RecuperarSenha = lazy(() => import("./pages/RecuperarSenha.tsx"));
const RedefinirSenha = lazy(() => import("./pages/RedefinirSenha.tsx"));
const Home = lazy(() => import("./pages/Home.tsx"));
const QuickTemplates = lazy(() => import("./pages/QuickTemplates.tsx"));
const HistoryPage = lazy(() => import("./pages/HistoryPage.tsx"));
const PrescricoesPage = lazy(() => import("./pages/PrescricoesPage"));
const DocumentsPage = lazy(() => import("./pages/DocumentsPage.tsx"));
const MedicationsBrowse = lazy(() => import("./pages/MedicationsBrowse.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AppShell from "./components/app-shell/AppShell";
const IVDilutionAdminPage = lazy(() => import("./modules/iv-dilution/IVDilutionAdminPage"));
const NewPrescriptionPage = lazy(() => import("./modules/prescription/mvp/NewPrescriptionPage"));
const RequisitosPage = lazy(() => import("./pages/RequisitosPage"));
const SegurancaPage = lazy(() => import("./pages/SegurancaPage"));
const IndicatorsPage = lazy(() => import("./pages/IndicatorsPage"));
const InternacoesPage = lazy(() => import("./pages/InternacoesPage"));
const NotificacoesPage = lazy(() => import("./pages/NotificacoesPage"));
const ClinicalTestsPage = lazy(() => import("./pages/ClinicalTestsPage"));
const PublicDocumentPage = lazy(() => import("./pages/PublicDocumentPage"));
const ImportarLotePage = lazy(() => import("./pages/ImportarLotePage"));
const CuradoriaPage = lazy(() => import("./pages/CuradoriaPage"));
const CuradoriaBasePage = lazy(() => import("./pages/CuradoriaBasePage"));
const VinculoExamesPage = lazy(() => import("./pages/VinculoExamesPage"));
const VinculoMedicamentosPage = lazy(() => import("./pages/VinculoMedicamentosPage"));
const ChecklistProtocoloPage = lazy(() => import("./pages/ChecklistProtocoloPage"));
const RevisaoDosesPage = lazy(() => import("./pages/RevisaoDosesPage"));
const EscoresTraumaPage = lazy(() => import("./pages/EscoresTraumaPage"));
const EscoresServidorPage = lazy(() => import("./pages/EscoresServidorPage"));
const ProtocoloPSPage = lazy(() => import("./pages/ProtocoloPSPage"));
const AuditoriaProtocolosPage = lazy(() => import("./pages/AuditoriaProtocolosPage"));
const EtapasProtocoloPage = lazy(() => import("./pages/EtapasProtocoloPage"));
const IndicadoresQualidadePage = lazy(() => import("./pages/IndicadoresQualidadePage"));
const ResultadoEscorePage = lazy(() => import("./pages/ResultadoEscorePage"));
const PromocaoBasePage = lazy(() => import("./pages/PromocaoBasePage"));
const AuditoriaBaseClinicaPage = lazy(() => import("./pages/AuditoriaBaseClinicaPage"));
const RevisaoClinicaPage = lazy(() => import("./pages/RevisaoClinicaPage"));
const RevisaoLegadoPage = lazy(() => import("./pages/RevisaoLegadoPage"));
const MinhasPatologiasPage = lazy(() => import("./pages/MinhasPatologiasPage"));
const ProtocolosEscoresPage = lazy(() => import("./pages/ProtocolosEscoresPage"));
const AtualizacoesPage = lazy(() => import("./pages/AtualizacoesPage"));
const AssinaturaPage = lazy(() => import("./pages/AssinaturaPage"));
const AssinaturaRetornoPage = lazy(() => import("./pages/AssinaturaRetornoPage"));
import RequireAccess from "./modules/billing/components/RequireAccess";
import RequireSubscription from "./modules/billing/components/RequireSubscription";
import { AuthProvider } from "./components/providers/AuthProvider";
import { EncounterProvider } from "./modules/encounter/EncounterProvider";
const HomologacaoPage = lazy(() => import("./pages/HomologacaoPage"));
import { HomologacaoProvider } from "./modules/homologacao/HomologacaoProvider";
const LegalPage = lazy(() => import("./pages/LegalPage"));
const InstalarAppPage = lazy(() => import("./pages/InstalarAppPage"));
const TutorialPage = lazy(() => import("./pages/TutorialPage"));
const VerificarCertificadoPage = lazy(() => import("./pages/VerificarCertificadoPage"));
const InteligenciaPage = lazy(() => import("./pages/InteligenciaPage"));
const VerificarPortfolioPage = lazy(() => import("./pages/VerificarPortfolioPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
      <HomologacaoProvider>
      <EncounterProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<div className="grid min-h-[40vh] place-items-center" role="status" aria-label="Carregando tela"><span className="size-6 animate-spin rounded-full border-2 border-muted border-t-primary" /></div>}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/recuperar-senha" element={<RecuperarSenha />} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />
          <Route path="/termos" element={<LegalPage kind="terms" />} />
          <Route path="/privacidade" element={<LegalPage kind="privacy" />} />

          {/* O atendimento PrescriMed é o app. Telas antigas ficam guardadas no código, fora do roteador. */}
          <Route path="/app" element={<ProtectedRoute><RequireAccess><PrototypePage /></RequireAccess></ProtectedRoute>} />
          <Route path="/app/assinatura" element={<ProtectedRoute><div className="mx-auto max-w-5xl p-4"><AssinaturaPage /></div></ProtectedRoute>} />
          <Route path="/app/assinatura/retorno" element={<ProtectedRoute><div className="mx-auto max-w-5xl p-4"><AssinaturaRetornoPage /></div></ProtectedRoute>} />
          <Route path="/app/tutorial" element={<ProtectedRoute><RequireAccess><TutorialPage /></RequireAccess></ProtectedRoute>} />
          <Route path="/verificar-certificado/:codigo" element={<VerificarCertificadoPage />} />
          <Route path="/app/ajustes" element={<ProtectedRoute><RequireAccess><AjustesPage /></RequireAccess></ProtectedRoute>} />
          <Route path="/app/instalar" element={<ProtectedRoute><InstalarAppPage /></ProtectedRoute>} />
          <Route path="/app/inteligencia" element={<ProtectedRoute><RequireAccess><InteligenciaPage /></RequireAccess></ProtectedRoute>} />
          <Route path="/verificar/:codigo" element={<VerificarPortfolioPage />} />
          <Route path="/app/*" element={<Navigate to="/app" replace />} />
          <Route path="/admin/*" element={<Navigate to="/app" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
      </EncounterProvider>
      </HomologacaoProvider>
      </AuthProvider>
    </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
