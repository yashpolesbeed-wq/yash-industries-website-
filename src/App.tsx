import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ScrollToTop from "@/components/ScrollToTop";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { ADMIN_LOGIN_PATH, ADMIN_PANEL_PATH } from "@/lib/routes";
import Index from "./pages/Index";
import About from "./pages/About";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Infrastructure from "./pages/Infrastructure";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminPanel from "./pages/AdminPanel";

const queryClient = new QueryClient();

const AppShell = () => {
  const location = useLocation();
  const isAdminRoute =
    location.pathname.startsWith(ADMIN_PANEL_PATH) ||
    location.pathname.startsWith(ADMIN_LOGIN_PATH);

  return (
    <>
      <ScrollToTop />
      {!isAdminRoute ? <Navbar /> : null}
      <main className="min-h-screen">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:slug" element={<ProductDetail />} />
          <Route path="/gallery" element={<Infrastructure />} />
          <Route path="/contact" element={<Contact />} />
          <Route path={ADMIN_LOGIN_PATH} element={<AdminLogin />} />
          <Route path={ADMIN_PANEL_PATH} element={<AdminPanel />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isAdminRoute ? <Footer /> : null}
      {!isAdminRoute ? <WhatsAppButton /> : null}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
