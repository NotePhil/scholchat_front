import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "./store/store";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import { Layout } from "./components/common/Layout";
import { Home } from "./pages/Home";
import { BlogSinglePage } from "./components/common/BlogSinglePage";
import { About } from "./pages/About";
import { Courses } from "./pages/Courses";
import { Blog } from "./pages/Blog";
import { Instructor } from "./pages/Instructor";
import FunctionalitiesSection from "./pages/FunctionalitiesSection";
import FunctionalityDetails from "./pages/FunctionalityDetails";
import SolutionDetails from "./pages/SolutionDetails";
import Contact from "./pages/Contact";
import Nursery from "./pages/EducationLevels/Nursery";
import Kindergarten from "./pages/EducationLevels/Kindergarten";
import PrimarySchool from "./pages/EducationLevels/PrimarySchool";
import HighSchool from "./pages/EducationLevels/HighSchool";
import University from "./pages/EducationLevels/University";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import AccountActivation from "./pages/AccountActivation";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import PasswordPage from "./pages/PasswordPage";
import ResetPassword from "./pages/ResetPassword";
import Principal from "./pages/Dashbaord/principale/Principal";
import ManageClass from "./pages/Dashbaord/principale/ManageClass/ManageClass";
import ClassApprovalConfirmation from "./pages/ClassApprovalConfirmation";
import ClassApproval from "./pages/ClassApproval";
import ClassRejection from "./pages/ClassRejection";
import ProtectedRoute from "./context/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { AnimatePresence } from "framer-motion";
import PageTransition from "./components/common/PageTransition";
import "./CSS/themes.css";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function AnimatedRoutes({ theme, setTheme }) {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <Layout theme={theme} setTheme={setTheme}>
                  <PageTransition>
                    <Home theme={theme} />
                  </PageTransition>
                </Layout>
              }
            />
            <Route
              path="/schoolchat/about"
              element={
                <Layout theme={theme} setTheme={setTheme}>
                  <PageTransition>
                    <About theme={theme} />
                  </PageTransition>
                </Layout>
              }
            />
            <Route
              path="/schoolchat/courses"
              element={
                <Layout theme={theme} setTheme={setTheme}>
                  <PageTransition>
                    <Courses theme={theme} />
                  </PageTransition>
                </Layout>
              }
            />
            <Route
              path="/schoolchat/instructor"
              element={
                <Layout theme={theme} setTheme={setTheme}>
                  <PageTransition>
                    <Instructor theme={theme} />
                  </PageTransition>
                </Layout>
              }
            />
            <Route
              path="/schoolchat/blog"
              element={
                <Layout theme={theme} setTheme={setTheme}>
                  <PageTransition>
                    <Blog theme={theme} />
                  </PageTransition>
                </Layout>
              }
            />
            <Route
              path="/schoolchat/blog/:id"
              element={
                <Layout theme={theme} setTheme={setTheme}>
                  <PageTransition>
                    <BlogSinglePage theme={theme} />
                  </PageTransition>
                </Layout>
              }
            />
            <Route
              path="/schoolchat/functionalities"
              element={
                <Layout theme={theme} setTheme={setTheme}>
                  <PageTransition>
                    <FunctionalitiesSection theme={theme} />
                  </PageTransition>
                </Layout>
              }
            />
            <Route
              path="/schoolchat/functionality/:id"
              element={
                <Layout theme={theme} setTheme={setTheme}>
                  <PageTransition>
                    <FunctionalityDetails theme={theme} />
                  </PageTransition>
                </Layout>
              }
            />
            <Route
              path="/schoolchat/solution/:id"
              element={
                <Layout theme={theme} setTheme={setTheme}>
                  <PageTransition>
                    <SolutionDetails theme={theme} />
                  </PageTransition>
                </Layout>
              }
            />
            <Route
              path="/schoolchat/contact"
              element={
                <Layout theme={theme} setTheme={setTheme}>
                  <PageTransition>
                    <Contact theme={theme} />
                  </PageTransition>
                </Layout>
              }
            />
            <Route
              path="/schoolchat/nursery"
              element={
                <Layout theme={theme} setTheme={setTheme}>
                  <PageTransition>
                    <Nursery theme={theme} />
                  </PageTransition>
                </Layout>
              }
            />
            <Route
              path="/schoolchat/kindergarten"
              element={
                <Layout theme={theme} setTheme={setTheme}>
                  <PageTransition>
                    <Kindergarten theme={theme} />
                  </PageTransition>
                </Layout>
              }
            />
            <Route
              path="/schoolchat/primary-school"
              element={
                <Layout theme={theme} setTheme={setTheme}>
                  <PageTransition>
                    <PrimarySchool theme={theme} />
                  </PageTransition>
                </Layout>
              }
            />
            <Route
              path="/schoolchat/high-school"
              element={
                <Layout theme={theme} setTheme={setTheme}>
                  <PageTransition>
                    <HighSchool theme={theme} />
                  </PageTransition>
                </Layout>
              }
            />
            <Route
              path="/schoolchat/university"
              element={
                <Layout theme={theme} setTheme={setTheme}>
                  <PageTransition>
                    <University theme={theme} />
                  </PageTransition>
                </Layout>
              }
            />
            <Route
              path="/schoolchat/login"
              element={
                <Layout theme={theme} setTheme={setTheme}>
                  <PageTransition>
                    <Login theme={theme} />
                  </PageTransition>
                </Layout>
              }
            />
            <Route
              path="/schoolchat/signup"
              element={
                <Layout theme={theme} setTheme={setTheme}>
                  <PageTransition>
                    <SignUp theme={theme} />
                  </PageTransition>
                </Layout>
              }
            />
            <Route path="/schoolchat/PasswordPage" element={<PasswordPage />} />
            <Route
              path="/schoolchat/account-activation"
              element={<AccountActivation />}
            />
            <Route path="/schoolchat/verify-email" element={<VerifyEmail />} />
            <Route
              path="/schoolchat/forgot-password"
              element={<ForgotPassword />}
            />
            <Route
              path="/schoolchat/reset-password"
              element={<ResetPassword />}
            />
            <Route
              path="/scholchat/etablissements/approve-class/:establishmentId/:classId"
              element={<ClassApprovalConfirmation />}
            />
            <Route
              path="/schoolchat/class-approval"
              element={<ClassApproval />}
            />
            <Route
              path="/schoolchat/class-approval/:classeId/:etablissementId"
              element={<ClassApproval />}
            />
            <Route
              path="/schoolchat/class-rejection"
              element={<ClassRejection />}
            />
            <Route
              path="/schoolchat/class-rejection/:classeId/:etablissementId"
              element={<ClassRejection />}
            />

            <Route element={<ProtectedRoute />}>
              <Route
                path="/schoolchat/manage-class"
                element={
                  <Layout theme={theme} setTheme={setTheme}>
                    <PageTransition>
                      <ManageClass theme={theme} />
                    </PageTransition>
                  </Layout>
                }
              />
              <Route path="/schoolchat/Principal" element={<Principal />} />
              <Route
                path="/schoolchat/Principal/:dashboardType"
                element={<Principal />}
              />
              <Route
                path="/schoolchat/Principal/:dashboardType/:section"
                element={<Principal />}
              />
            </Route>
          </Routes>
        </AnimatePresence>
  );
}

function App() {
  const [theme, setTheme] = useState("default");

  return (
    <Provider store={store}>
      <BrowserRouter>
        <AuthProvider>
          <ScrollToTop />
          <AnimatedRoutes theme={theme} setTheme={setTheme} />
          <PWAInstallPrompt />
        </AuthProvider>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
