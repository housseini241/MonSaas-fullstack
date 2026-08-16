import "@/App.css";
import "@/index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getSubdomainSlug } from "@/lib/subdomain";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/lib/auth";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import Sites from "@/pages/Sites";
import Clients from "@/pages/Clients";
import ClientDetail from "@/pages/ClientDetail";
import ClientForm from "@/pages/ClientForm";
import Agenda from "@/pages/Agenda";
import DevisDetail from "@/pages/DevisDetail";
import Onboarding from "@/pages/Onboarding";
import Generating from "@/pages/Generating";
import Preview from "@/pages/Preview";
import PreviewPlans from "@/pages/PreviewPlans";
import PreviewSuccess from "@/pages/PreviewSuccess";
import Builder from "@/pages/Builder";
import PublicSite from "@/pages/PublicSite";
import PublicRealisations from "@/pages/Publicrealisations";
import PublicTransformation from "@/pages/Publictransformation";
import Billing from "@/pages/Billing";
import BillingSuccess from "@/pages/BillingSuccess";
import BillingCancel from "@/pages/BillingCancel";
import Admin from "@/pages/Admin";
import AdminMarketplace from "@/pages/AdminMarketplace";
import Avis from "@/pages/Avis";
import ShopBuilder from "@/pages/ShopBuilder";
import OnboardingShop from "@/pages/OnboardingShop";
import PublicShop from "@/pages/PublicShop";
import PublicProduct from "@/pages/PublicProduct";
import ShopCheckout from "@/pages/ShopCheckout";
import ShopSuccess from "@/pages/ShopSuccess";
import Domains from "@/pages/Domains";
import DomainSuccess from "@/pages/DomainSuccess";
import DomainCancel from "@/pages/DomainCancel";
import DomainAutoRenewSuccess from "@/pages/DomainAutoRenewSuccess";
import MarketplaceLanding from "@/pages/MarketplaceLanding";
import MarketplaceDirectory from "@/pages/MarketplaceDirectory";
import MarketplaceProfile from "@/pages/MarketplaceProfile";
import MarketplaceDemande from "@/pages/MarketplaceDemande";
import MarketplaceDemandeDetail from "@/pages/MarketplaceDemandeDetail";
import MarketplaceDemandeRepondre from "@/pages/MarketplaceDemandeRepondre";
import MarketplaceSettings from "@/pages/MarketplaceSettings";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const subdomainSlug = getSubdomainSlug();

  if (subdomainSlug) {
    return (
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/" element={<PublicSite slug={subdomainSlug} />} />
          <Route path="/realisations" element={<PublicRealisations slug={subdomainSlug} />} />
          <Route path="/transformation" element={<PublicTransformation slug={subdomainSlug} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/avis" element={<Avis />} />
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/sites" element={<Protected><Sites /></Protected>} />
          <Route path="/clients" element={<Protected><Clients /></Protected>} />
          <Route path="/clients/nouveau" element={<Protected><ClientForm /></Protected>} />
          <Route path="/clients/:clientId/edit" element={<Protected><ClientForm /></Protected>} />
          <Route path="/clients/:clientId" element={<Protected><ClientDetail /></Protected>} />
          <Route path="/agenda" element={<Protected><Agenda /></Protected>} />
          <Route path="/devis/:devisId" element={<Protected><DevisDetail /></Protected>} />
          <Route path="/onboarding" element={<Protected><Onboarding /></Protected>} />
          <Route path="/generating" element={<Protected><Generating /></Protected>} />
          <Route path="/preview" element={<Protected><Preview /></Protected>} />
          <Route path="/preview/plans" element={<Protected><PreviewPlans /></Protected>} />
          <Route path="/preview/success" element={<Protected><PreviewSuccess /></Protected>} />
          <Route path="/builder/:siteId" element={<Protected><Builder /></Protected>} />
          <Route path="/billing" element={<Protected><Billing /></Protected>} />
          <Route path="/billing/success" element={<Protected><BillingSuccess /></Protected>} />
          <Route path="/billing/cancel" element={<Protected><BillingCancel /></Protected>} />
          <Route path="/admin" element={<Protected><Admin /></Protected>} />
          <Route path="/admin/marketplace" element={<Protected><AdminMarketplace /></Protected>} />
          <Route path="/shop-builder/:shopId" element={<Protected><ShopBuilder /></Protected>} />
          <Route path="/onboarding-shop" element={<Protected><OnboardingShop /></Protected>} />
          <Route path="/shop/:slug" element={<PublicShop />} />
          <Route path="/shop/:slug/product/:productSlug" element={<PublicProduct />} />
          <Route path="/shop/:slug/checkout" element={<ShopCheckout />} />
          <Route path="/shop/:slug/success" element={<ShopSuccess />} />
          <Route path="/domains" element={<Protected><Domains /></Protected>} />
          <Route path="/domain/success" element={<Protected><DomainSuccess /></Protected>} />
          <Route path="/domain/cancel" element={<Protected><DomainCancel /></Protected>} />
          <Route path="/domain/auto-renew-success" element={<Protected><DomainAutoRenewSuccess /></Protected>} />
          <Route path="/marketplace" element={<MarketplaceLanding />} />
          <Route path="/marketplace/profil" element={<Protected><MarketplaceSettings /></Protected>} />
          <Route path="/marketplace/artisans" element={<MarketplaceDirectory />} />
          <Route path="/marketplace/artisan/:slug" element={<MarketplaceProfile />} />
          <Route path="/marketplace/demande" element={<MarketplaceDemande />} />
          <Route path="/marketplace/appels-doffres/:id" element={<MarketplaceDemandeDetail />} />
          <Route path="/appels-doffres/:id/repondre" element={<Protected><MarketplaceDemandeRepondre /></Protected>} />
          <Route path="/site/:slug" element={<PublicSite />} />
          <Route path="/site/:slug/realisations" element={<PublicRealisations />} />
          <Route path="/site/:slug/transformation" element={<PublicTransformation />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
