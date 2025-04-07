import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/common/Layout";
import { Home } from "./pages/Home";
import { BlogSinglePage } from "./components/common/BlogSinglePage";
import { About } from "./pages/About";
import { Courses } from "./pages/Courses";
import { Blog } from "./pages/Blog";
import { Instructor } from "./pages/Instructor";
import FunctionalitiesSection from "./pages/FunctionalitiesSection";
import PostLoginClassModal from "./pages/Dashbaord/components/form/ClassSelectionModal";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import AccountActivation from "./pages/AccountActivation";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import PasswordPage from "./pages/PasswordPage";
import DashboardRoutes from "./pages/DashboardRoutes";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes & Authentication - Without Dashboard/Sidebar */}
        <Route
          path="/"
          element={
            <Layout>
              <Home />
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
        <Route
          path="/schoolchat/login"
          element={
            <Layout>
              <Login />
            </Layout>
          }
        />
        <Route
          path="/schoolchat/signup"
          element={
            <Layout>
              <SignUp />
            </Layout>
          }
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
        <Route path="/schoolchat/PasswordPage" element={<PasswordPage />} />
        <Route
          path="/schoolchat/postLogin/classModal"
          element={
            <Layout>
              <PostLoginClassModal />
            </Layout>
          }
        />

        {/* Dashboard Routes with Principal Layout */}
        <Route path="/schoolchat/*" element={<DashboardRoutes />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
