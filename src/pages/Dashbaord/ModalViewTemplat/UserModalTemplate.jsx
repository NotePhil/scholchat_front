import React, { useState, useEffect } from "react";
import {
  X,
  AlertCircle,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Search,
  Filter,
  ChevronDown,
  Download,
  Eye,
  Grid,
  List,
  Users,
  School,
  ChevronRight,
} from "lucide-react";

const UserModalTemplate = ({
  user,
  onClose,
  userType = "eleve",
  modalTitle = "Profil utilisateur",
  modalSubtitle = "Informations détaillées et documents",
  modalIcon: ModalIcon = Users,
  isDark = false,
  currentTheme = "blue",
  showSidebar = true,
  customTabs = [],
  customContent = {},
  colorSchemes = {
    blue: { primary: "#4a6da7", light: "#6889c3" },
    green: { primary: "#2e7d32", light: "#4caf50" },
  },
}) => {
  const [userDocuments, setUserDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [documentSearchTerm, setDocumentSearchTerm] = useState("");
  const [documentFilter, setDocumentFilter] = useState("all");
  const [documentViewMode, setDocumentViewMode] = useState("grid");
  const [activeTab, setActiveTab] = useState("info");
  const [additionalData, setAdditionalData] = useState({});

  // Responsive breakpoints
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);

      // Fetch documents
      const documents = [];
      const documentFields = [
        { field: "cniUrlFront", title: "CNI recto", type: "identity" },
        { field: "cniUrlBack", title: "CNI verso", type: "identity" },
        {
          field: "photoFullPicture",
          title: "Photo de profil",
          type: "profile",
        },
      ];

      documentFields.forEach(({ field, title, type }) => {
        if (user[field]) {
          documents.push({
            id: field,
            title,
            url: user[field],
            type,
            uploadedDate: user.dateCreation || new Date().toISOString(),
          });
        }
      });

      setUserDocuments(documents);
      setFilteredDocuments(documents);

      // Handle additional data based on user type
      if (customContent.fetchAdditionalData) {
        const additional = await customContent.fetchAdditionalData(
          user,
          userType
        );
        setAdditionalData(additional);
      }
    } catch (err) {
      console.error("Failed to load user data:", err);
      setError("Failed to load user data");
    } finally {
      setIsLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = userDocuments;

    if (documentSearchTerm) {
      filtered = filtered.filter((doc) =>
        doc.title.toLowerCase().includes(documentSearchTerm.toLowerCase())
      );
    }

    if (documentFilter !== "all") {
      filtered = filtered.filter((doc) => doc.type === documentFilter);
    }

    setFilteredDocuments(filtered);
  };

  useEffect(() => {
    filterDocuments();
  }, [documentSearchTerm, documentFilter]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      ACTIVE: {
        className: `${
          isDark
            ? "bg-emerald-900/50 text-emerald-300 border-emerald-700"
            : "bg-emerald-50 text-emerald-700 border-emerald-200"
        }`,
        text: "Actif",
      },
      INACTIVE: {
        className: `${
          isDark
            ? "bg-red-900/50 text-red-300 border-red-700"
            : "bg-red-50 text-red-700 border-red-200"
        }`,
        text: "Inactif",
      },
      PENDING: {
        className: `${
          isDark
            ? "bg-amber-900/50 text-amber-300 border-amber-700"
            : "bg-amber-50 text-amber-700 border-amber-200"
        }`,
        text: "En attente",
      },
      default: {
        className: `${
          isDark
            ? "bg-slate-700 text-slate-300 border-slate-600"
            : "bg-slate-50 text-slate-700 border-slate-200"
        }`,
        text: status || "Non défini",
      },
    };

    const config = statusConfig[status] || statusConfig.default;

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.className}`}
      >
        <div
          className={`w-1.5 h-1.5 rounded-full mr-2 ${
            status === "ACTIVE"
              ? "bg-emerald-500"
              : status === "INACTIVE"
              ? "bg-red-500"
              : status === "PENDING"
              ? "bg-amber-500"
              : "bg-slate-500"
          }`}
        ></div>
        {config.text}
      </span>
    );
  };

  const getDocumentTypeBadge = (type) => {
    const typeConfig = {
      identity: {
        className: `${
          isDark
            ? "bg-blue-900/50 text-blue-300 border-blue-700"
            : "bg-blue-50 text-blue-700 border-blue-200"
        }`,
        text: "Identité",
      },
      profile: {
        className: `${
          isDark
            ? "bg-purple-900/50 text-purple-300 border-purple-700"
            : "bg-purple-50 text-purple-700 border-purple-200"
        }`,
        text: "Profil",
      },
      academic: {
        className: `${
          isDark
            ? "bg-green-900/50 text-green-300 border-green-700"
            : "bg-green-50 text-green-700 border-green-200"
        }`,
        text: "Académique",
      },
    };

    const config = typeConfig[type] || {
      className: `${
        isDark
          ? "bg-slate-700 text-slate-300 border-slate-600"
          : "bg-slate-50 text-slate-700 border-slate-200"
      }`,
      text: "Autre",
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${config.className}`}
      >
        {type === "identity" ? (
          <User className="w-4 h-4 mr-1" />
        ) : type === "profile" ? (
          <User className="w-4 h-4 mr-1" />
        ) : (
          <FileText className="w-4 h-4 mr-1" />
        )}
        {config.text}
      </span>
    );
  };

  const handleDocumentView = (document) => {
    window.open(document.url, "_blank");
  };

  const handleDocumentDownload = (document) => {
    const link = document.createElement("a");
    link.href = document.url;
    link.download = `${document.title}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate modal width based on sidebar state
  const getModalWidth = () => {
    if (isMobile) return "w-full mx-4";
    if (isTablet)
      return showSidebar ? "w-[85%] max-w-3xl" : "w-[95%] max-w-4xl";
    return showSidebar ? "w-full max-w-3xl" : "w-full max-w-5xl";
  };

  const getModalHeight = () => {
    return isMobile ? "max-h-[90vh]" : "max-h-[95vh]";
  };

  // Default tabs
  const defaultTabs = [
    { id: "info", label: "Informations", icon: User },
    {
      id: "documents",
      label: `Documents (${userDocuments.length})`,
      icon: FileText,
    },
  ];

  const allTabs = [...defaultTabs, ...customTabs];

  // Theme-based styles
  const bgColor = isDark ? "bg-gray-900" : "bg-white";
  const textColor = isDark ? "text-white" : "text-slate-900";
  const borderColor = isDark ? "border-gray-700" : "border-slate-200";
  const cardBg = isDark ? "bg-gray-800" : "bg-white";
  const headerBg = isDark
    ? "bg-gradient-to-r from-gray-800 to-gray-700"
    : "bg-gradient-to-r from-slate-50 to-blue-50";

  const primaryColor = colorSchemes[currentTheme]?.primary || "#4a6da7";

  return (
    <div className="fixed inset-0 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div
        className={`
          ${bgColor} ${textColor} rounded-2xl shadow-2xl 
          ${getModalWidth()} ${getModalHeight()} 
          overflow-hidden flex flex-col 
          transition-all duration-300 ease-in-out
          ${showSidebar ? "transform translate-x-0" : "transform translate-x-0"}
        `}
        style={{
          paddingTop: isMobile ? "60px" : "0px",
          marginTop: isMobile ? "0px" : "20px",
        }}
      >
        {/* Header */}
        <div
          className={`${headerBg} px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b ${borderColor}`}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div
                className="p-2 sm:p-3 rounded-xl shadow-lg"
                style={{
                  background: `linear-gradient(to right, ${primaryColor}, ${
                    colorSchemes[currentTheme]?.light || "#6889c3"
                  })`,
                }}
              >
                <ModalIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h2 className={`text-xl sm:text-2xl font-bold ${textColor}`}>
                  {modalTitle}
                </h2>
                <p
                  className={`${
                    isDark ? "text-gray-300" : "text-slate-600"
                  } mt-1 text-sm sm:text-base`}
                >
                  {modalSubtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {getStatusBadge(user?.etat)}
              <button
                onClick={onClose}
                className={`p-2 ${
                  isDark
                    ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                } rounded-xl transition-all duration-200`}
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div
          className={`border-b ${borderColor} px-4 sm:px-6 lg:px-8 overflow-x-auto`}
        >
          <div className="flex space-x-4 sm:space-x-6 min-w-max">
            {allTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm sm:text-base transition-all duration-200 whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.id
                    ? `border-[${primaryColor}] text-[${primaryColor}]`
                    : `border-transparent ${
                        isDark
                          ? "text-gray-400 hover:text-gray-200 hover:border-gray-600"
                          : "text-slate-500 hover:text-slate-700 hover:border-slate-300"
                      }`
                }`}
                style={{
                  borderBottomColor:
                    activeTab === tab.id ? primaryColor : "transparent",
                  color: activeTab === tab.id ? primaryColor : undefined,
                }}
              >
                {tab.icon && <tab.icon className="w-4 h-4" />}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {error && (
            <div
              className={`mx-4 sm:mx-6 lg:mx-8 mt-6 p-4 ${
                isDark
                  ? "bg-red-900/50 text-red-300 border-red-700"
                  : "bg-red-50 text-red-700 border-red-200"
              } rounded-xl flex items-center border`}
            >
              <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center p-8 sm:p-12">
              <div className="relative">
                <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-blue-200 rounded-full animate-spin"></div>
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 border-4 rounded-full animate-spin absolute top-0 left-0"
                  style={{
                    borderColor: `${primaryColor} transparent transparent transparent`,
                    clipPath: "polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)",
                  }}
                ></div>
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-6 lg:p-8">
              {/* Personal Info Tab */}
              {activeTab === "info" && (
                <div className="space-y-6 sm:space-y-8">
                  <div
                    className={`${cardBg} rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border ${borderColor}`}
                  >
                    <h3
                      className={`text-lg sm:text-xl font-semibold ${textColor} mb-4 sm:mb-6 flex items-center`}
                    >
                      <User
                        className="w-5 h-5 mr-2"
                        style={{ color: primaryColor }}
                      />
                      Informations personnelles
                    </h3>

                    <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
                      {/* Avatar and basic info */}
                      <div className="flex-shrink-0">
                        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                          <div className="relative">
                            <div
                              className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl flex items-center justify-center shadow-xl"
                              style={{
                                background: `linear-gradient(to right, ${primaryColor}, ${
                                  colorSchemes[currentTheme]?.light || "#6889c3"
                                })`,
                              }}
                            >
                              <span className="text-white font-bold text-lg sm:text-2xl">
                                {user?.nom?.charAt(0)}
                                {user?.prenom?.charAt(0)}
                              </span>
                            </div>
                            <div className="absolute -bottom-2 -right-2">
                              <div
                                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-4 border-white ${
                                  user?.etat === "ACTIVE"
                                    ? "bg-emerald-500"
                                    : user?.etat === "INACTIVE"
                                    ? "bg-red-500"
                                    : "bg-amber-500"
                                }`}
                              ></div>
                            </div>
                          </div>
                          <div className="text-center sm:text-left">
                            <div
                              className={`text-xl sm:text-2xl font-bold ${textColor}`}
                            >
                              {user?.nom} {user?.prenom}
                            </div>
                            <div
                              className={`${
                                isDark ? "text-gray-300" : "text-slate-600"
                              } font-medium mt-1`}
                            >
                              {userType.charAt(0).toUpperCase() +
                                userType.slice(1)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Details grid */}
                      <div className="flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                          <div className="space-y-3 sm:space-y-4">
                            <div className="flex items-center space-x-3">
                              <div
                                className={`p-2 ${
                                  isDark ? "bg-blue-900/50" : "bg-blue-50"
                                } rounded-lg`}
                              >
                                <Mail
                                  className="w-4 h-4"
                                  style={{ color: primaryColor }}
                                />
                              </div>
                              <div>
                                <p
                                  className={`text-xs sm:text-sm ${
                                    isDark ? "text-gray-400" : "text-slate-500"
                                  } font-medium`}
                                >
                                  Email
                                </p>
                                <p
                                  className={`${textColor} text-sm sm:text-base break-all`}
                                >
                                  {user?.email}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3">
                              <div
                                className={`p-2 ${
                                  isDark ? "bg-green-900/50" : "bg-green-50"
                                } rounded-lg`}
                              >
                                <Phone className="w-4 h-4 text-green-600" />
                              </div>
                              <div>
                                <p
                                  className={`text-xs sm:text-sm ${
                                    isDark ? "text-gray-400" : "text-slate-500"
                                  } font-medium`}
                                >
                                  Téléphone
                                </p>
                                <p
                                  className={`${textColor} text-sm sm:text-base`}
                                >
                                  {user?.telephone || "Non fourni"}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3 sm:space-y-4">
                            <div className="flex items-center space-x-3">
                              <div
                                className={`p-2 ${
                                  isDark ? "bg-purple-900/50" : "bg-purple-50"
                                } rounded-lg`}
                              >
                                <MapPin className="w-4 h-4 text-purple-600" />
                              </div>
                              <div>
                                <p
                                  className={`text-xs sm:text-sm ${
                                    isDark ? "text-gray-400" : "text-slate-500"
                                  } font-medium`}
                                >
                                  Adresse
                                </p>
                                <p
                                  className={`${textColor} text-sm sm:text-base`}
                                >
                                  {user?.adresse || "Non fournie"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3">
                              <div
                                className={`p-2 ${
                                  isDark ? "bg-amber-900/50" : "bg-amber-50"
                                } rounded-lg`}
                              >
                                <Calendar className="w-4 h-4 text-amber-600" />
                              </div>
                              <div>
                                <p
                                  className={`text-xs sm:text-sm ${
                                    isDark ? "text-gray-400" : "text-slate-500"
                                  } font-medium`}
                                >
                                  Date d'inscription
                                </p>
                                <p
                                  className={`${textColor} text-sm sm:text-base`}
                                >
                                  {user?.dateCreation
                                    ? new Date(
                                        user.dateCreation
                                      ).toLocaleDateString("fr-FR")
                                    : "Non disponible"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Custom content for specific user types */}
                    {customContent.infoTabContent && (
                      <div
                        className={`mt-6 sm:mt-8 pt-6 border-t ${borderColor}`}
                      >
                        {customContent.infoTabContent(user, additionalData, {
                          isDark,
                          textColor,
                          borderColor,
                          primaryColor,
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Custom tabs content */}
              {customTabs.map(
                (tab) =>
                  activeTab === tab.id && (
                    <div key={tab.id}>
                      {customContent[tab.id] ? (
                        customContent[tab.id](user, additionalData, {
                          isDark,
                          textColor,
                          borderColor,
                          primaryColor,
                          isMobile,
                          isTablet,
                        })
                      ) : (
                        <div className="text-center py-12">
                          <p
                            className={
                              isDark ? "text-gray-400" : "text-slate-500"
                            }
                          >
                            Contenu non disponible pour cet onglet
                          </p>
                        </div>
                      )}
                    </div>
                  )
              )}

              {/* Documents Tab */}
              {activeTab === "documents" && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
                    <h3
                      className={`text-lg sm:text-xl font-semibold ${textColor} flex items-center`}
                    >
                      <FileText
                        className="w-5 h-5 mr-2"
                        style={{ color: primaryColor }}
                      />
                      Documents ({filteredDocuments.length})
                    </h3>

                    {/* Document Controls */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
                      {/* Search */}
                      <div className="relative flex-1 sm:flex-none">
                        <Search
                          className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                            isDark ? "text-gray-400" : "text-slate-400"
                          }`}
                          size={16}
                        />
                        <input
                          type="text"
                          placeholder="Rechercher..."
                          value={documentSearchTerm}
                          onChange={(e) =>
                            setDocumentSearchTerm(e.target.value)
                          }
                          className={`pl-10 pr-4 py-2 ${
                            isDark
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-slate-200"
                          } border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 text-sm w-full sm:w-auto`}
                          style={{
                            "--tw-ring-color": primaryColor + "33",
                          }}
                        />
                      </div>

                      {/* Filter */}
                      <div className="relative">
                        <Filter
                          className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                            isDark ? "text-gray-400" : "text-slate-400"
                          }`}
                          size={16}
                        />
                        <select
                          value={documentFilter}
                          onChange={(e) => setDocumentFilter(e.target.value)}
                          className={`pl-10 pr-8 py-2 ${
                            isDark
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-slate-200"
                          } border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 text-sm appearance-none cursor-pointer`}
                        >
                          <option value="all">Tous</option>
                          <option value="identity">Identité</option>
                          <option value="profile">Profil</option>
                        </select>
                        <ChevronDown
                          className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                            isDark ? "text-gray-400" : "text-slate-400"
                          }`}
                          size={16}
                        />
                      </div>

                      {/* View Mode Toggle */}
                      <div
                        className={`flex ${
                          isDark ? "bg-gray-700" : "bg-slate-100"
                        } rounded-lg p-1`}
                      >
                        <button
                          onClick={() => setDocumentViewMode("grid")}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                            documentViewMode === "grid"
                              ? `${
                                  isDark
                                    ? "bg-gray-600 text-white"
                                    : "bg-white text-blue-600"
                                } shadow-sm`
                              : `${
                                  isDark
                                    ? "text-gray-300 hover:text-white"
                                    : "text-slate-600 hover:text-slate-900"
                                }`
                          }`}
                        >
                          <Grid className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDocumentViewMode("list")}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                            documentViewMode === "list"
                              ? `${
                                  isDark
                                    ? "bg-gray-600 text-white"
                                    : "bg-white text-blue-600"
                                } shadow-sm`
                              : `${
                                  isDark
                                    ? "text-gray-300 hover:text-white"
                                    : "text-slate-600 hover:text-slate-900"
                                }`
                          }`}
                        >
                          <List className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Documents Content */}
                  {filteredDocuments.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <div
                        className={`mx-auto w-12 h-12 sm:w-16 sm:h-16 ${
                          isDark ? "bg-gray-700" : "bg-slate-100"
                        } rounded-full flex items-center justify-center mb-4`}
                      >
                        <FileText
                          className={`w-6 h-6 sm:w-8 sm:h-8 ${
                            isDark ? "text-gray-400" : "text-slate-400"
                          }`}
                        />
                      </div>
                      <h4
                        className={`text-base sm:text-lg font-medium ${textColor} mb-2`}
                      >
                        {documentSearchTerm || documentFilter !== "all"
                          ? "Aucun document trouvé"
                          : "Aucun document disponible"}
                      </h4>
                      <p
                        className={isDark ? "text-gray-400" : "text-slate-600"}
                      >
                        {documentSearchTerm || documentFilter !== "all"
                          ? "Essayez de modifier vos critères de recherche."
                          : "Aucun document n'a été téléchargé pour cet utilisateur."}
                      </p>
                    </div>
                  ) : documentViewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {filteredDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className={`${cardBg} rounded-xl p-4 shadow-md border ${borderColor} hover:shadow-lg transition-all duration-200`}
                        >
                          <div className="aspect-square relative overflow-hidden rounded-lg mb-4 group">
                            <img
                              src={doc.url}
                              alt={doc.title}
                              className="object-cover w-full h-full transition-transform duration-200 group-hover:scale-105"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src =
                                  "https://via.placeholder.com/300x300?text=Document+Non+Trouvé";
                              }}
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center space-x-2">
                              <button
                                onClick={() => handleDocumentView(doc)}
                                className={`p-2 ${
                                  isDark
                                    ? "bg-gray-700 hover:bg-gray-600"
                                    : "bg-white hover:bg-slate-100"
                                } rounded-lg transition-colors`}
                                title="Voir le document"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDocumentDownload(doc)}
                                className={`p-2 ${
                                  isDark
                                    ? "bg-gray-700 hover:bg-gray-600"
                                    : "bg-white hover:bg-slate-100"
                                } rounded-lg transition-colors`}
                                title="Télécharger"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4
                                className={`font-medium ${textColor} truncate text-sm sm:text-base`}
                              >
                                {doc.title}
                              </h4>
                              {getDocumentTypeBadge(doc.type)}
                            </div>
                            <p
                              className={`text-xs ${
                                isDark ? "text-gray-400" : "text-slate-500"
                              }`}
                            >
                              Téléchargé le{" "}
                              {new Date(doc.uploadedDate).toLocaleDateString(
                                "fr-FR"
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className={`${cardBg} rounded-lg p-4 shadow-md border ${borderColor} hover:shadow-lg transition-all duration-200`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                              <div className="flex-shrink-0">
                                <img
                                  src={doc.url}
                                  alt={doc.title}
                                  className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-lg"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src =
                                      "https://via.placeholder.com/48x48?text=Doc";
                                  }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4
                                  className={`font-medium ${textColor} truncate text-sm sm:text-base`}
                                >
                                  {doc.title}
                                </h4>
                                <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mt-1">
                                  {getDocumentTypeBadge(doc.type)}
                                  <span
                                    className={`text-xs ${
                                      isDark
                                        ? "text-gray-400"
                                        : "text-slate-500"
                                    }`}
                                  >
                                    {new Date(
                                      doc.uploadedDate
                                    ).toLocaleDateString("fr-FR")}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleDocumentView(doc)}
                                className={`p-2 ${
                                  isDark
                                    ? "text-gray-400 hover:text-blue-400 hover:bg-blue-900/50"
                                    : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                } rounded-lg transition-all duration-200`}
                                title="Voir le document"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDocumentDownload(doc)}
                                className={`p-2 ${
                                  isDark
                                    ? "text-gray-400 hover:text-green-400 hover:bg-green-900/50"
                                    : "text-slate-400 hover:text-green-600 hover:bg-green-50"
                                } rounded-lg transition-all duration-200`}
                                title="Télécharger"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserModalTemplate;
