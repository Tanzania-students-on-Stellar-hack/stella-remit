import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import SendMoney from "./pages/SendMoney";
import Receive from "./pages/Receive";
import TransactionHistory from "./pages/TransactionHistory";
import Convert from "./pages/Convert";
import Escrow from "./pages/Escrow";
import SorobanEscrow from "./pages/SorobanEscrow";
import CrossBorderPayment from "./pages/CrossBorderPayment";
import TokenIssuance from "./pages/TokenIssuance";
import SavingsGroup from "./pages/SavingsGroup";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import Invoice from "./pages/Invoice";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/send" element={<ProtectedRoute><SendMoney /></ProtectedRoute>} />
              <Route path="/receive" element={<ProtectedRoute><Receive /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><TransactionHistory /></ProtectedRoute>} />
              <Route path="/convert" element={<ProtectedRoute><Convert /></ProtectedRoute>} />
              <Route path="/cross-border" element={<ProtectedRoute><CrossBorderPayment /></ProtectedRoute>} />
              <Route path="/token-issuance" element={<ProtectedRoute><TokenIssuance /></ProtectedRoute>} />
              <Route path="/savings-group" element={<ProtectedRoute><SavingsGroup /></ProtectedRoute>} />
              <Route path="/escrow" element={<ProtectedRoute><Escrow /></ProtectedRoute>} />
              <Route path="/soroban-escrow" element={<ProtectedRoute><SorobanEscrow /></ProtectedRoute>} />
              <Route path="/invoice" element={<ProtectedRoute><Invoice /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
