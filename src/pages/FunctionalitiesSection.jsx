import React from "react";
import {
  FiBookOpen,
  FiMail,
  FiClipboard,
  FiUserCheck,
  FiTarget,
} from "react-icons/fi"; // Icons for functionalities
import "../CSS/animations1.css";

export const FunctionalitiesSection = () => {
  const functionalities = [
    {
      icon: <FiBookOpen size={30} />,
      title: "Cahier de texte",
      description:
        "Organisez et accédez facilement aux notes de cours et au contenu de chaque sujet.",
    },
    {
      icon: <FiMail size={30} />,
      title: "Messagerie",
      description:
        "Communiquez facilement avec les enseignants et les autres élèves.",
    },
    {
      icon: <FiClipboard size={30} />,
      title: "Devoirs",
      description:
        "Suivez les devoirs assignés et gérez les dates de rendu efficacement.",
    },
    {
      icon: <FiUserCheck size={30} />,
      title: "Suivie des absences",
      description:
        "Gardez un enregistrement des absences et suivez les retards.",
    },
    {
      icon: <FiTarget size={30} />,
      title: "Objectifs scolaires",
      description:
        "Définissez et suivez les objectifs scolaires de manière structurée.",
    },
  ];

  return (
    <section className="bg-white py-10 md:py-20 lg:py-24">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center text-gray-800 mb-8 fade-in-up">
          Nos Fonctionnalités
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-center">
          {functionalities.map((func, index) => (
            <div
              key={index}
              className="flex flex-col items-center p-6 bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition transform hover:-translate-y-1 hover:scale-105 duration-500 ease-in-out slide-in"
              style={{ animationDelay: `${index * 0.2}s` }} // Staggered delay
            >
              <div className="text-primary mb-4 bounce">{func.icon}</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2 text-glow">
                {func.title}
              </h3>
              <p className="text-gray-600 fade-in">{func.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FunctionalitiesSection;
