import React from "react";
import { useOutletContext } from "react-router-dom";

const ProfessorPage = () => {
  const { isDark, currentTheme, colorSchemes } = useOutletContext();
  
  return (
    <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      <h1 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
        Hello Professors
      </h1>
      <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
        Welcome to your professor dashboard. Manage your classes, students, and assignments here.
      </p>
    </div>
  );
};

export default ProfessorPage;