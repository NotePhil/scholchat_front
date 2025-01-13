import { BrowserRouter, Route, Routes } from "react-router-dom";
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
import ProfessorPage from "./pages/Dashbaord/ProfessorPage";
import StudentPage from "./pages/Dashbaord/StudentPage";
import ParentPage from "./pages/Dashbaord/ParentPage";
import ClassesPage from "./pages/Dashbaord/ClassesPage";
import Layoute from "./pages/Dashbaord/Layout";

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
            path="/SignUp"
            element={
              <Layout>
                <SignUp />
              </Layout>
            }
          />
          <Route path="/dashboard" element={<Layoute />} />
          <Route path="/professors" element={<ProfessorPage />} />
          <Route path="/students" element={<StudentPage />} />
          <Route path="/parents" element={<ParentPage />} />
          <Route path="/classes" element={<ClassesPage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
