import { BrowserRouter, Route, Routes } from "react-router-dom";
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
import Layoute from "./pages/Dashbaord/Layout";
import EmailDashboard from "./pages/Dashbaord/components/StudentDashboard/EmailDashboard";
import ActivityFeed from "./pages/Dashbaord/components/StudentDashboard/ActivityFeed";
import AccountActivation from "./pages/AccountActivation";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import PasswordPage from "./pages/PasswordPage";
import ResetPassword from "./pages/ResetPassword";
import Principal from "./pages/Dashbaord/principale/Principal";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <Layout>
                <Home />
              </Layout>
            }
          />
          <Route
            path="/schoolchat/activity"
            element={
              <Layout>
                <ActivityFeed />
              </Layout>
            }
          />
          <Route
            path="/schoolchat/postLogin/classModal"
            element={
              <Layout>
                <PostLoginClassModal />
              </Layout>
            }
          />
          <Route
            path="/schoolchat/about"
            element={
              <Layout>
                <About />
              </Layout>
            }
          />
          <Route
            path="/schoolchat/courses"
            element={
              <Layout>
                <Courses />
              </Layout>
            }
          />
          <Route
            path="/schoolchat/instructor"
            element={
              <Layout>
                <Instructor />
              </Layout>
            }
          />
          <Route
            path="/schoolchat/blog"
            element={
              <Layout>
                <Blog />
              </Layout>
            }
          />
          <Route
            path="/schoolchat/single-blog"
            element={
              <Layout>
                <BlogSinglePage />
              </Layout>
            }
          />
          <Route
            path="/schoolchat/functionalities"
            element={
              <Layout>
                <FunctionalitiesSection />
              </Layout>
            }
          />
          {/* Updated Principal routes with dashboard type */}
          <Route path="/schoolchat/Principal" element={<Principal />} />
          <Route
            path="/schoolchat/Principal/:dashboardType"
            element={<Principal />}
          />
          <Route
            path="/schoolchat/login"
            element={
              <Layout>
                <Login />
              </Layout>
            }
          />
          <Route
            path="/schoolchat/postLogin/classModal"
            element={<ClassSelectionWrapper />}
          />
          <Route
            path="/schoolchat/signup"
            element={
              <Layout>
                <SignUp />
              </Layout>
            }
          />
          <Route path="/schoolchat/PasswordPage" element={<PasswordPage />} />
          <Route path="/schoolchat/parents" element={<ParentPage />} />
          <Route path="/schoolchat/classes" element={<ClassesPage />} />
          <Route
            path="/schoolchat/email-dashboard"
            element={<EmailDashboard />}
          />
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
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
