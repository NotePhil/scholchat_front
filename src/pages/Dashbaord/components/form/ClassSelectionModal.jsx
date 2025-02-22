import React, { useState } from "react";
import { Book, PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PostLoginClassModal = () => {
  const navigate = useNavigate();
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [codeActivation, setCodeActivation] = useState("");
  const [etablissementId, setEtablissementId] = useState("");

  const primaryClasses = [
    { id: 1, name: "Cours Élémentaire 1 (CE1)" },
    { id: 2, name: "Cours Élémentaire 2 (CE2)" },
    { id: 3, name: "Cours Moyen 1 (CM1)" },
    { id: 4, name: "Cours Moyen 2 (CM2)" },
  ];

  const secondaryClasses = [
    { id: 1, name: "Sixième" },
    { id: 2, name: "Cinquième" },
    { id: 3, name: "Quatrième" },
    { id: 4, name: "Troisième" },
    { id: 5, name: "Seconde" },
    { id: 6, name: "Première" },
    { id: 7, name: "Terminale" },
  ];

  const universityClasses = [
    { id: 1, name: "Licence 1" },
    { id: 2, name: "Licence 2" },
    { id: 3, name: "Licence 3" },
    { id: 4, name: "Master 1" },
    { id: 5, name: "Master 2" },
  ];

  const getClassList = () => {
    switch (selectedLevel) {
      case "primaire":
        return primaryClasses;
      case "secondaire":
        return secondaryClasses;
      case "université":
        return universityClasses;
      default:
        return [];
    }
  };

  const handleNavigateToDashboard = (className) => {
    const classData = {
      nom: className,
      niveau: selectedLevel,
      dateCreation: new Date(),
      codeActivation: codeActivation,
      etat: "ACTIVE",
      etablissementId: etablissementId,
      parentsEntities: [],
      elevesEntities: [],
      canaux: [],
    };

    localStorage.setItem("selectedClass", className);
    const userRole = localStorage.getItem("userRole");

    switch (userRole) {
      case "professor":
      case "repetiteur":
        navigate("/professors/dashboard");
        break;
      case "student":
        navigate("/students/dashboard");
        break;
      case "parent":
        navigate("/parents/dashboard");
        break;
      default:
        navigate("/");
        break;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedClass || (selectedLevel === "privé" && newClassName)) {
      const finalClassName =
        selectedLevel === "privé" ? newClassName : selectedClass;
      handleNavigateToDashboard(finalClassName);
    }
  };

  const handleCreateClass = (e) => {
    e.preventDefault();
    if (newClassName) {
      handleNavigateToDashboard(newClassName);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-gradient-to-br from-[#667eea] to-[#764ba2]">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
              <Book className="w-6 h-6 text-blue-600 dark:text-blue-300" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Select Your Class
          </h2>

          {!showCreateClass ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Educational Level
                  </label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#667eea]"
                    required
                  >
                    <option value="">Select a level</option>
                    <option value="primaire">Primary</option>
                    <option value="secondaire">Secondary</option>
                    <option value="université">University</option>
                    <option value="privé">Private School</option>
                  </select>
                </div>

                {selectedLevel === "privé" ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Class Name
                      </label>
                      <input
                        type="text"
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        placeholder="Enter class name"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#667eea]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Activation Code
                      </label>
                      <input
                        type="text"
                        value={codeActivation}
                        onChange={(e) => setCodeActivation(e.target.value)}
                        placeholder="Enter activation code"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#667eea]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        School ID
                      </label>
                      <input
                        type="text"
                        value={etablissementId}
                        onChange={(e) => setEtablissementId(e.target.value)}
                        placeholder="Enter school ID"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#667eea]"
                        required
                      />
                    </div>
                  </>
                ) : (
                  selectedLevel && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Select Class
                        </label>
                        <select
                          value={selectedClass}
                          onChange={(e) => setSelectedClass(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#667eea]"
                          required
                        >
                          <option value="">Choose a class</option>
                          {getClassList().map((cls) => (
                            <option key={cls.id} value={cls.name}>
                              {cls.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Activation Code
                        </label>
                        <input
                          type="text"
                          value={codeActivation}
                          onChange={(e) => setCodeActivation(e.target.value)}
                          placeholder="Enter activation code"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#667eea]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          School ID
                        </label>
                        <input
                          type="text"
                          value={etablissementId}
                          onChange={(e) => setEtablissementId(e.target.value)}
                          placeholder="Enter school ID"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#667eea]"
                          required
                        />
                      </div>
                    </>
                  )
                )}
              </div>

              <div className="flex flex-col gap-4">
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-[#667eea] hover:bg-[#5a67d8] text-white font-medium rounded-lg transition-colors"
                >
                  Continue to Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateClass(true)}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-5 h-5" />
                  Create New Class
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCreateClass} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Class Name
                </label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="Enter class name"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#667eea]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Activation Code
                </label>
                <input
                  type="text"
                  value={codeActivation}
                  onChange={(e) => setCodeActivation(e.target.value)}
                  placeholder="Enter activation code"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#667eea]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  School ID
                </label>
                <input
                  type="text"
                  value={etablissementId}
                  onChange={(e) => setEtablissementId(e.target.value)}
                  placeholder="Enter school ID"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#667eea]"
                  required
                />
              </div>

              <div className="flex flex-col gap-4">
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-[#667eea] hover:bg-[#5a67d8] text-white font-medium rounded-lg transition-colors"
                >
                  Create & Continue
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateClass(false)}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
                >
                  Back to Selection
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostLoginClassModal;
