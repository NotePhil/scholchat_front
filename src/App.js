import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { Layout } from "./components/common/Layout";
import { Home } from "./pages/Home";
import { BlogSinglePage } from "./components/common/BlogSinglePage";
import { About } from "./pages/About";
import { Courses } from "./pages/Courses";
import { Blog } from "./pages/Blog";
import { Instructor } from "./pages/Instructor";
import FunctionalitiesSection from "./pages/FunctionalitiesSection";
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
import ProtectedRoute from "./context/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  const [theme, setTheme] = useState("default");

  return (
    <Provider store={store}>
      <BrowserRouter>
        <AuthProvider>
          <ScrollToTop />
          <Routes>
            <Route
              path="/"
              element={
                <Layout theme={theme} setTheme={setTheme}>
                  <Home theme={theme} />
                </Layout>
              }
            />
            <Route
              path="/schoolchat/about"
              element={
                <Layout theme={theme} setTheme={setTheme}>
                  <About theme={theme} />
                </Layout>
              }
            />
            <Route
              path="/schoolchat/courses"
              element={
                <Layout theme={theme} setTheme={setTheme}>
                  <Courses theme={theme} />
                </Layout>
              }
            />
            <Route
              path="/schoolchat/instructor"
              element={
                <Layout theme={theme} setTheme={setTheme}>
                  <Instructor theme={theme} />
                </Layout>
              }
            />
            <Route
              path="/schoolchat/blog"
              element={
                <Layout theme={theme} setTheme={setTheme}>
                  <Blog theme={theme} />
                </Layout>
              }
            />
            <Route
              path="/schoolchat/single-blog"
              element={
                <Layout theme={theme} setTheme={setTheme}>
                  <BlogSinglePage theme={theme} />
                </Layout>
              }
            />
            <Route
              path="/schoolchat/functionalities"
              element={
                <Layout theme={theme} setTheme={setTheme}>
                  <FunctionalitiesSection theme={theme} />
                </Layout>
              }
            />
            <Route
              path="/schoolchat/login"
              element={
                <Layout theme={theme} setTheme={setTheme}>
                  <Login theme={theme} />
                </Layout>
              }
            />
            <Route
              path="/schoolchat/signup"
              element={
                <Layout theme={theme} setTheme={setTheme}>
                  <SignUp theme={theme} />
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

            <Route element={<ProtectedRoute />}>
              <Route
                path="/schoolchat/manage-class"
                element={
                  <Layout theme={theme} setTheme={setTheme}>
                    <ManageClass theme={theme} />
                  </Layout>
                }
              />
              <Route path="/schoolchat/principal" element={<Principal />} />
              <Route
                path="/schoolchat/principal/:dashboardType"
                element={<Principal />}
              />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
