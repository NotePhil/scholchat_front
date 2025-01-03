// src/components/ui/Card.jsx
import React from "react";

export const Card = ({ children, className }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children }) => {
  return <div className="border-b pb-4 mb-4">{children}</div>;
};

export const CardTitle = ({ children }) => {
  return <h2 className="text-lg font-semibold text-gray-800">{children}</h2>;
};

export const CardDescription = ({ children }) => {
  return <p className="text-sm text-gray-600">{children}</p>;
};

export const CardContent = ({ children }) => {
  return <div>{children}</div>;
};

export default Card;
