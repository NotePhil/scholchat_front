import React from "react";
import { useOutletContext } from "react-router-dom";

const ChildrenPage = () => {
  const { isDark, currentTheme, colorSchemes } = useOutletContext();

  return (
    <div className={`p-6 rounded-lg ${isDark ? "bg-gray-800" : "bg-white"}`}>
      <h1
        className={`text-2xl font-bold mb-4 ${
          isDark ? "text-white" : "text-gray-800"
        }`}
      >
        My Children
      </h1>
      <p className={isDark ? "text-gray-300" : "text-gray-600"}>
        View information about your children's classes, assignments, and
        progress.
      </p>
    </div>
  );
};

export default ChildrenPage;
