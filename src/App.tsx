import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/use-theme";
import { FontSizeProvider } from "@/hooks/use-font-size";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import DashboardLayout from "./components/DashboardLayout";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import OficinaPage from "./pages/OficinaPage.tsx";
import EsbocosPage from "./pages/EsbocosPage.tsx";
import RaioXPage from "./pages/RaioXPage.tsx";
import DevocionalPage from "./pages/DevocionalPage.tsx";
import NomesPage from "./pages/NomesPage.tsx";
import GarimpoPage from "./pages/GarimpoPage.tsx";
import MuralPage from "./pages/MuralPage.tsx";
import VozDeDeusPage from "./pages/VozDeDeusPage.tsx";
import PulpitoPage from "./pages/PulpitoPage.tsx";
import BibliaPage from "./pages/BibliaPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import AdminPage from "./pages/AdminPage.tsx";
import LivrariaPage from "./pages/LivrariaPage.tsx";
import ColecaoPage from "./pages/ColecaoPage.tsx";
import LeitorPage from "./pages/LeitorPage.tsx";
import LayoutDemoPage from "./pages/LayoutDemoPage.tsx";
import JornadaPage from "./pages/JornadaPage.tsx";
import JornadaLivroPage from "./pages/JornadaLivroPage.tsx";
import JornadaCapituloPage from "./pages/JornadaCapituloPage.tsx";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const ProtectedRoutes = () => {
  const { email, loading } = useAuth();
  const isAdminRoute = typeof window !== "undefined" && window.location.pathname.startsWith("/fc-control-panel");
  const isLayoutDemo = typeof window !== "undefined" && window.location.pathname.startsWith("/layout-demo");

  if (isLayoutDemo) {
    return <Routes><Route path="/layout-demo" element={<LayoutDemoPage />} /></Routes>;
  }
  if (isAdminRoute) {
    return (
      <Routes>
        <Route path="/fc-control-panel" element={<AdminPage />} />
      </Routes>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!email) {
    return <LoginPage />;
  }

  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<Index />} />
        <Route path="/oficina" element={<OficinaPage />} />
        <Route path="/esbocos" element={<EsbocosPage />} />
        <Route path="/raio-x" element={<RaioXPage />} />
        <Route path="/devocional" element={<DevocionalPage />} />
        <Route path="/nomes" element={<NomesPage />} />
        <Route path="/garimpo" element={<GarimpoPage />} />
        <Route path="/mural" element={<MuralPage />} />
        <Route path="/voz-de-deus" element={<VozDeDeusPage />} />
        <Route path="/pulpito" element={<PulpitoPage />} />
        <Route path="/biblia" element={<BibliaPage />} />
        <Route path="/jornada" element={<JornadaPage />} />
        <Route path="/jornada/:testament/:bookSlug" element={<JornadaLivroPage />} />
        <Route path="/jornada/:testament/:bookSlug/capitulos/:chapter" element={<JornadaCapituloPage />} />
        <Route path="/livraria" element={<LivrariaPage />} />
        <Route path="/livraria/:productSlug" element={<ColecaoPage />} />
        <Route path="/livraria/:productSlug/:volumeSlug" element={<LeitorPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <FontSizeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ProtectedRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </FontSizeProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
