import React from "react";
import { Route, Routes } from "react-router-dom";
import Principal from "./Dashbaord/components/common/Principal";
import ProfessorDashboard from "../pages/Dashbaord/components/ProfessorDashboard/ProfessorDashboard";
import StudentDashboard from "../pages/Dashbaord/components/StudentDashboard/StudentDashboard";
import ParentDashboard from "../pages/Dashbaord/components/ParentDashboard/ParentDashboard";
import ClassesPage from "../pages/Dashbaord/ClassesPage";
import EmailDashboard from "../pages/Dashbaord/components/StudentDashboard/EmailDashboard";
import ProfesseurMotifPage from "../pages/Dashbaord/components/ProfesseurMotifPage";
import ClassSelectionWrapper from "../pages/Dashbaord/components/form/ClassSelectionWrapper";
import StudentPage from "../pages/Dashbaord/StudentPage";
import ProfessorPage from "../pages/Dashbaord/ProfessorPage";
import ParentPage from "../pages/Dashbaord/ParentPage";
import ActivityFeed from "../pages/Dashbaord/components/StudentDashboard/ActivityFeed";
import GeneralDashboard from "./Dashbaord/GeneralDashboard";

const DashboardRoutes = () => {
  return (
    <Routes>
      <Route
        path="admin/dashboard"
        element={
          <Principal>
            <ProfessorDashboard />
          </Principal>
        }
      />
      <Route
        path="dashboard"
        element={
          <Principal>
            <GeneralDashboard />
          </Principal>
        }
      />
      <Route
        path="professors/dashboard"
        element={
          <Principal>
            <ProfessorDashboard />
          </Principal>
        }
      />
      <Route
        path="students/dashboard"
        element={
          <Principal>
            <StudentDashboard />
          </Principal>
        }
      />
      <Route
        path="parents/dashboard"
        element={
          <Principal>
            <ParentDashboard />
          </Principal>
        }
      />
      <Route
        path="classes"
        element={
          <Principal>
            <ClassesPage />
          </Principal>
        }
      />
      <Route
        path="email-dashboard"
        element={
          <Principal>
            <EmailDashboard />
          </Principal>
        }
      />
      <Route
        path="professeur-motif"
        element={
          <Principal>
            <ProfesseurMotifPage />
          </Principal>
        }
      />
      <Route
        path="postLogin/classModal"
        element={
          <Principal>
            <ClassSelectionWrapper />
          </Principal>
        }
      />
      <Route
        path="students"
        element={
          <Principal>
            <StudentPage />
          </Principal>
        }
      />
      <Route
        path="professors"
        element={
          <Principal>
            <ProfessorPage />
          </Principal>
        }
      />
      <Route
        path="parents"
        element={
          <Principal>
            <ParentPage />
          </Principal>
        }
      />
      <Route
        path="activity"
        element={
          <Principal>
            <ActivityFeed />
          </Principal>
        }
      />
    </Routes>
  );
};

export default DashboardRoutes;
