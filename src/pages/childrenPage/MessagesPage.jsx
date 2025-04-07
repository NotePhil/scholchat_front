import React from "react";
import { useOutletContext } from "react-router-dom";

const MessagesPage = () => {
  const { isDark, currentTheme, colorSchemes } = useOutletContext();

  return (
    <div className={`p-6 rounded-lg ${isDark ? "bg-gray-800" : "bg-white"}`}>
      <h1
        className={`text-2xl font-bold mb-4 ${
          isDark ? "text-white" : "text-gray-800"
        }`}
      >
        Messages
      </h1>
      <p className={isDark ? "text-gray-300" : "text-gray-600"}>
        Communicate with teachers, students, and other parents.
      </p>
    </div>
  );
};

export default MessagesPage;
