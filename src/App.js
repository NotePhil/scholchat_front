import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Layout } from "./components/common/Layout";
import { Home } from "./pages/Home";
import { BlogSinglePage } from "./components/common/BlogSinglePage";
import { About } from "./pages/About";
import { Courses } from "./pages/Courses";
import { Blog } from "./pages/Blog";
import { Instructor } from "./pages/Instructor";
import FunctionalitiesSection from "./pages/FunctionalitiesSection";
import ClassSelectionWrapper from "./pages/Dashbaord/components/form/ClassSelectionWrapper";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ProfessorPage from "./pages/Dashbaord/ProfessorPage";
import StudentPage from "./pages/Dashbaord/StudentPage";
import ProfessorDashboard from "./pages/Dashbaord/components/ProfessorDashboard/ProfessorDashboard";
import StudentDashboard from "./pages/Dashbaord/components/StudentDashboard/StudentDashboard";
import ParentDashboard from "./pages/Dashbaord/components/ParentDashboard/ParentDashboard";
import ParentPage from "./pages/Dashbaord/ParentPage";
import ClassesPage from "./pages/Dashbaord/ClassesPage";
import PostLoginClassModal from "./pages/Dashbaord/components/form/ClassSelectionModal";
import EmailDashboard from "./pages/Dashbaord/components/StudentDashboard/EmailDashboard";
import ActivityFeed from "./pages/Dashbaord/components/StudentDashboard/ActivityFeed";
import AccountActivation from "./pages/AccountActivation";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import PasswordPage from "./pages/PasswordPage";
import ResetPassword from "./pages/ResetPassword";
import Principal from "./pages/Dashbaord/principale/Principal";
import ManageClass from "./pages/Dashbaord/principale/ManageClass/ManageClass";
import ProtectedRoute from "./context/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

// Scroll to top on route change
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
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          {/* Public Routes */}
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

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/schoolchat/activity"
              element={
                <Layout theme={theme} setTheme={setTheme}>
                  <ActivityFeed theme={theme} />
                </Layout>
              }
            />
            <Route
              path="/schoolchat/postLogin/classModal"
              element={
                <Layout theme={theme} setTheme={setTheme}>
                  <PostLoginClassModal theme={theme} />
                </Layout>
              }
            />
            <Route path="/schoolchat/parents" element={<ParentPage />} />
            <Route path="/schoolchat/classes" element={<ClassesPage />} />
            <Route
              path="/schoolchat/email-dashboard"
              element={<EmailDashboard />}
            />
            <Route
              path="/schoolchat/manage-class"
              element={
                <Layout theme={theme} setTheme={setTheme}>
                  <ManageClass theme={theme} />
                </Layout>
              }
            />

            {/* Role-based routes */}
            <Route path="/schoolchat/student" element={<StudentPage />}>
              <Route index element={<StudentDashboard />} />
            </Route>

            <Route path="/schoolchat/professor" element={<ProfessorPage />}>
              <Route index element={<ProfessorDashboard />} />
            </Route>

            <Route path="/schoolchat/parent" element={<ParentPage />}>
              <Route index element={<ParentDashboard />} />
            </Route>

            <Route path="/schoolchat/principal" element={<Principal />} />
            <Route
              path="/schoolchat/principal/:dashboardType"
              element={<Principal />}
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;