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
            path="/activity"
            element={
              <Layout>
                <ActivityFeed />
              </Layout>
            }
          />
          <Route
            path="/postLogin/classModal"
            element={
              <Layout>
                <PostLoginClassModal />
              </Layout>
            }
          />

          <Route
            path="/about"
            element={
              <Layout>
                <About />
              </Layout>
            }
          />
          <Route
            path="/courses"
            element={
              <Layout>
                <Courses />
              </Layout>
            }
          />
          <Route
            path="/instructor"
            element={
              <Layout>
                <Instructor />
              </Layout>
            }
          />
          <Route
            path="/blog"
            element={
              <Layout>
                <Blog />
              </Layout>
            }
          />
          <Route
            path="/single-blog"
            element={
              <Layout>
                <BlogSinglePage />
              </Layout>
            }
          />
          <Route
            path="/functionalities"
            element={
              <Layout>
                <FunctionalitiesSection />
              </Layout>
            }
          />
          <Route
            path="/login"
            element={
              <Layout>
                <Login />
              </Layout>
            }
          />
          <Route
            path="/postLogin/classModal"
            element={<ClassSelectionWrapper />}
          />
          <Route
            path="/SignUp"
            element={
              <Layout>
                <SignUp />
              </Layout>
            }
          />
          <Route path="/admin/dashboard" element={<Layoute />} />
          <Route path="/professors" element={<ProfessorPage />} />
          <Route path="/students" element={<StudentPage />} />
          <Route path="/students/dashboard" element={<StudentDashboard />} />
          <Route path="/parents" element={<ParentPage />} />
          <Route path="/parents/dashboard" element={<ParentDashboard />} />
          <Route path="/classes" element={<ClassesPage />} />
          <Route path="email-dashboard" element={<EmailDashboard />} />
          <Route
            path="/professors/dashboard"
            element={<ProfessorDashboard />}
          />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
