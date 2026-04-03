// src/App.tsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Context
import { UserProvider } from "./context/UserContext";
import { CartProvider } from './context/CartContext';

// Auth pages
import Login from "./components/auth/Login";
import SignUp from "./components/auth/Signup";
import SuperAdminAuth from "./components/SuperAdminAuth/SuperAdminAuth";

// Pharmacy Admin pages
import DashboardAdmin from "./pages/Roles/pharmacy-admin/DashboardAdmin";
import AdminOverview from "./pages/Roles/pharmacy-admin/Adminoverview";
import StaffManagement from "./pages/Roles/pharmacy-admin/StaffManagement";
import ProductApprovals from "./pages/Roles/pharmacy-admin/ProductApprovals";
import PharmacySettings from "./pages/Roles/pharmacy-admin/PharmacySettings";
import Analytics from "./pages/Roles/pharmacy-admin/Analytics";

// Pharmacist pages
import DashboardPharmacist from "./pages/Roles/Pharmacist/DashboardPharmacist";
import OverviewPharmacist from "./pages/Roles/Pharmacist/OverviewPharmacist";
import MyUploads from "./pages/Roles/Pharmacist/MyUploads";
import SupplierChat from './pages/Roles/Pharmacist/SupplierChat';

// Super Admin pages
import DashboardSuperAdmin from './pages/Roles/super-admin/DashboardSuperAdmin';
import OverviewSuperAdmin from './pages/Roles/super-admin/OverviewSuperAdmin';
import PharmacyVerification from './pages/Roles/super-admin/PharmacyVerification';
import UserManagement from './pages/Roles/super-admin/UserManagement';
import Reports from './pages/Roles/super-admin/Reports';
import PlatformSettings from './pages/Roles/super-admin/PlatformSettings';

// Marketplace
import MarketDashboard from './pages/marketplace/MarketDashboard';
import UploadCenter from "./pages/marketplace/UploadCenter";
import ChatPage from "./pages/marketplace/ChatPage";
import Cart from "./pages/Roles/Pharmacist/Cart";
import ProductDetail from "./pages/marketplace/ProductDetail";

// Layouts
import Header from "./components/Layouts/Header";
import Footer from "./components/Layouts/Footer";
import About from "./components/Layouts/About";
import Contact from "./components/Layouts/Contact";

// HOC
import VerifyUser from "./components/auth/VerifyUser";
import VerifySuperAdmin from "./components/SuperAdminAuth/VerifySuperAdmin";


// ======================
// 🌐 GLOBAL PUBLIC LAYOUT
// ======================
const MarketplaceLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    <Header />

    <main style={{ minHeight: "80vh" }}>
      {children}
    </main>

    <Footer />
  </>
);


// ======================
// 🚀 APP
// ======================
const App: React.FC = () => {
  return (
    <Router>
      <UserProvider>
        <CartProvider>

          <Routes>

            {/* ================= AUTH ================= */}
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/signup" element={<SignUp />} />

            {/* Super Admin Auth */}
            <Route path="/SuperAdminAuth/SuperAdminAuth" element={<SuperAdminAuth />} />


            {/* ================= SUPER ADMIN (nested) ================= */}
            <Route
  path="/super-admin"
  element={<VerifySuperAdmin><DashboardSuperAdmin /></VerifySuperAdmin>}
>
  <Route index element={<OverviewSuperAdmin />} />
  <Route path="overview" element={<OverviewSuperAdmin />} />
  <Route path="pharmacy-verification" element={<PharmacyVerification />} />
  <Route path="user-management" element={<UserManagement />} />
  <Route path="reports" element={<Reports />} />
  <Route path="platform-settings" element={<PlatformSettings />} />
</Route>

            {/* ================= MARKETPLACE ================= */}
            <Route
              path="/marketplace/marketdashboard"
              element={
                <MarketplaceLayout>
                  <MarketDashboard />
                </MarketplaceLayout>
              }
            />

            {/* Product pages (FIXED with layout) */}
            <Route
              path="/product/:productId"
              element={
                <MarketplaceLayout>
                  <ProductDetail />
                </MarketplaceLayout>
              }
            />

            <Route
              path="/product/:productId/contact"
              element={
                <MarketplaceLayout>
                  <ChatPage />
                </MarketplaceLayout>
              }
            />


            {/* ================= ABOUT & CONTACT ================= */}
            <Route
              path="/about"
              element={
                <MarketplaceLayout>
                  <About />
                </MarketplaceLayout>
              }
            />

            <Route
              path="/contact"
              element={
                <MarketplaceLayout>
                  <Contact />
                </MarketplaceLayout>
              }
            />


            {/* ================= PHARMACY ADMIN (nested) ================= */}
<Route
  path="/pharmacy-admin"
  element={<VerifyUser role="owner"><DashboardAdmin /></VerifyUser>}
>
  <Route index element={<AdminOverview />} />
  <Route path="staff-management" element={<StaffManagement />} />
  <Route path="product-approvals" element={<ProductApprovals />} />
  <Route path="pharmacy-settings" element={<PharmacySettings />} />
  <Route path="analytics" element={<Analytics />} />
</Route>

            {/* ================= PHARMACIST ================= */}
            <Route
              path="/Pharmacist"
              element={
                <VerifyUser role="pharmacist">
                  <DashboardPharmacist />
                </VerifyUser>
              }
            >
              <Route index element={<OverviewPharmacist />} />
              <Route path="OverviewPharmacist" element={<OverviewPharmacist />} />
              <Route path="UploadCenter" element={<UploadCenter />} />
              <Route path="MyUploads" element={<MyUploads />} />
              <Route path="Cart" element={<Cart />} />
              <Route path="ProductDetail/:productId" element={<ProductDetail />} />
              <Route path="SupplierChat" element={<SupplierChat />} />
            </Route>


            {/* ================= DEFAULT ================= */}
            <Route path="*" element={<Navigate to="/marketplace/marketdashboard" replace />} />

          </Routes>

        </CartProvider>
      </UserProvider>
    </Router>
  );
};

export default App;