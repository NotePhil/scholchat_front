import React from "react";
import { Users, School, MapPin, Phone, Mail, User } from "lucide-react";
import UserModalTemplate from "../../ModalViewTemplat/UserModalTemplate";

const UserViewEleve = ({
  user,
  onClose,
  userType = "eleve",
  isDark = false,
  currentTheme = "blue",
  showSidebar = true,
  colorSchemes = {
    blue: { primary: "#4a6da7", light: "#6889c3" },
    green: { primary: "#2e7d32", light: "#4caf50" },
  },
}) => {
  // Custom tabs specific to eleve
  const customTabs = [];

  // Add students tab if user has classes with students
  if (userType === "eleve" && user.classes && user.classes.length > 0) {
    // Check if any class has students
    const hasStudents = user.classes.some(
      (cls) => cls.eleves && cls.eleves.length > 0
    );
    if (hasStudents) {
      // Count total students
      const totalStudents = user.classes.reduce((total, cls) => {
        return total + (cls.eleves ? cls.eleves.length : 0);
      }, 0);

      customTabs.push({
        id: "students",
        label: `Élèves (${totalStudents})`,
        icon: Users,
      });
    }
  }

  // Custom content for eleve-specific functionality
  const customContent = {
    // Function to fetch additional data specific to eleves
    fetchAdditionalData: async (userData, userType) => {
      if (
        userType === "eleve" &&
        userData.classes &&
        userData.classes.length > 0
      ) {
        const allStudents = [];
        for (const cls of userData.classes) {
          if (cls.eleves && cls.eleves.length > 0) {
            allStudents.push(
              ...cls.eleves.map((student) => ({
                ...student,
                className: cls.nom,
                establishment: cls.etablissement,
              }))
            );
          }
        }
        return { students: allStudents };
      }
      return {};
    },

    // Custom content for the info tab - Classes and Establishments section
    infoTabContent: (
      user,
      additionalData,
      { isDark, textColor, borderColor, primaryColor }
    ) => {
      if (!user.classes || user.classes.length === 0) return null;

      return (
        <div>
          <h4
            className={`text-lg font-semibold ${textColor} mb-4 flex items-center`}
          >
            <School className="w-5 h-5 mr-2" style={{ color: primaryColor }} />
            Établissements et classes
          </h4>

          <div className="space-y-4">
            {user.classes.map((cls) => (
              <div
                key={cls.id}
                className={`${
                  isDark ? "bg-gray-700" : "bg-white"
                } rounded-xl p-4 border ${borderColor} shadow-sm`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className={`font-medium ${textColor}`}>
                      {cls.nom} ({cls.niveau})
                    </h5>
                    {cls.etablissement && (
                      <div className="mt-2 space-y-2">
                        <div
                          className={`flex items-center text-sm ${
                            isDark ? "text-gray-300" : "text-slate-600"
                          }`}
                        >
                          <School
                            className={`w-4 h-4 mr-2 ${
                              isDark ? "text-gray-400" : "text-slate-400"
                            }`}
                          />
                          <span>{cls.etablissement.nom}</span>
                        </div>
                        <div
                          className={`flex items-center text-sm ${
                            isDark ? "text-gray-300" : "text-slate-600"
                          }`}
                        >
                          <MapPin
                            className={`w-4 h-4 mr-2 ${
                              isDark ? "text-gray-400" : "text-slate-400"
                            }`}
                          />
                          <span>
                            {cls.etablissement.localisation},{" "}
                            {cls.etablissement.pays}
                          </span>
                        </div>
                        <div
                          className={`flex items-center text-sm ${
                            isDark ? "text-gray-300" : "text-slate-600"
                          }`}
                        >
                          <Phone
                            className={`w-4 h-4 mr-2 ${
                              isDark ? "text-gray-400" : "text-slate-400"
                            }`}
                          />
                          <span>{cls.etablissement.telephone}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      cls.etat === "ACTIF"
                        ? isDark
                          ? "bg-emerald-900/50 text-emerald-300"
                          : "bg-emerald-100 text-emerald-800"
                        : isDark
                        ? "bg-amber-900/50 text-amber-300"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {cls.etat}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    },

    // Custom content for the students tab
    students: (
      user,
      additionalData,
      { isDark, textColor, borderColor, primaryColor, isMobile }
    ) => {
      const students = additionalData.students || [];

      if (students.length === 0) {
        return (
          <div className="text-center py-12">
            <div
              className={`mx-auto w-16 h-16 ${
                isDark ? "bg-gray-700" : "bg-slate-100"
              } rounded-full flex items-center justify-center mb-4`}
            >
              <Users
                className={`w-8 h-8 ${
                  isDark ? "text-gray-400" : "text-slate-400"
                }`}
              />
            </div>
            <h4 className={`text-lg font-medium ${textColor} mb-2`}>
              Aucun élève associé
            </h4>
            <p className={isDark ? "text-gray-400" : "text-slate-600"}>
              Aucun élève n'est associé à cet utilisateur pour le moment.
            </p>
          </div>
        );
      }

      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h3
              className={`text-xl font-semibold ${textColor} flex items-center`}
            >
              <Users className="w-5 h-5 mr-2" style={{ color: primaryColor }} />
              Élèves associés ({students.length})
            </h3>
          </div>

          <div className="space-y-4">
            {students.map((student) => (
              <div
                key={student.id}
                className={`${
                  isDark ? "bg-gray-800" : "bg-white"
                } rounded-xl p-4 border ${borderColor} shadow-sm hover:shadow-md transition-shadow`}
              >
                <div
                  className={`flex ${
                    isMobile
                      ? "flex-col space-y-4"
                      : "flex-row items-start space-x-4"
                  }`}
                >
                  <div className="flex-shrink-0">
                    <div
                      className="h-12 w-12 rounded-xl flex items-center justify-center"
                      style={{
                        background: `linear-gradient(to right, ${primaryColor}, ${
                          colorSchemes[currentTheme]?.light || "#6889c3"
                        })`,
                      }}
                    >
                      <span className="text-white font-medium">
                        {student.prenom?.charAt(0)}
                        {student.nom?.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium ${textColor}`}>
                      {student.prenom} {student.nom}
                    </h4>
                    <div
                      className={`mt-2 grid ${
                        isMobile ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
                      } gap-2 text-sm ${
                        isDark ? "text-gray-300" : "text-slate-600"
                      }`}
                    >
                      <div className="flex items-center">
                        <School
                          className={`w-4 h-4 mr-2 ${
                            isDark ? "text-gray-400" : "text-slate-400"
                          }`}
                        />
                        <span>{student.className}</span>
                      </div>
                      <div className="flex items-center">
                        <Mail
                          className={`w-4 h-4 mr-2 ${
                            isDark ? "text-gray-400" : "text-slate-400"
                          }`}
                        />
                        <span className="truncate">{student.email}</span>
                      </div>
                      {student.telephone && (
                        <div className="flex items-center">
                          <Phone
                            className={`w-4 h-4 mr-2 ${
                              isDark ? "text-gray-400" : "text-slate-400"
                            }`}
                          />
                          <span>{student.telephone}</span>
                        </div>
                      )}
                      {student.establishment && (
                        <div className="flex items-center">
                          <MapPin
                            className={`w-4 h-4 mr-2 ${
                              isDark ? "text-gray-400" : "text-slate-400"
                            }`}
                          />
                          <span className="truncate">
                            {student.establishment.nom}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        student.etat === "ACTIVE"
                          ? isDark
                            ? "bg-emerald-900/50 text-emerald-300"
                            : "bg-emerald-100 text-emerald-800"
                          : student.etat === "INACTIVE"
                          ? isDark
                            ? "bg-red-900/50 text-red-300"
                            : "bg-red-100 text-red-800"
                          : isDark
                          ? "bg-amber-900/50 text-amber-300"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {student.etat === "ACTIVE"
                        ? "Actif"
                        : student.etat === "INACTIVE"
                        ? "Inactif"
                        : student.etat}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    },
  };

  return (
    <UserModalTemplate
      user={user}
      onClose={onClose}
      userType={userType}
      modalTitle="Profil élève"
      modalSubtitle="Informations détaillées et documents"
      modalIcon={Users}
      isDark={isDark}
      currentTheme={currentTheme}
      showSidebar={showSidebar}
      customTabs={customTabs}
      customContent={customContent}
      colorSchemes={colorSchemes}
    />
  );
};

export default UserViewEleve;
