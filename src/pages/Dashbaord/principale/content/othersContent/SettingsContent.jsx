import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Eye,
  EyeOff,
  Save,
  Edit3,
  Palette,
  Moon,
  Sun,
  CheckCircle,
  AlertCircle,
  Loader,
  Lock,
  Settings,
  Camera,
  Bell,
  Globe,
  Monitor,
  Smartphone,
} from "lucide-react";
import { scholchatService } from "../../../../../services/ScholchatService";
import "../../../../../CSS/settings.css";

const SettingsContent = ({
  isDark,
  setIsDark,
  currentTheme,
  setCurrentTheme,
}) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [profileData, setProfileData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    adresse: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const colorSchemes = {
    blue: {
      name: "Bleu",
      primary: "#3b82f6",
      light: "#60a5fa",
      gradient: "from-blue-500 to-blue-600",
    },
    green: {
      name: "Vert",
      primary: "#10b981",
      light: "#34d399",
      gradient: "from-green-500 to-green-600",
    },
    purple: {
      name: "Violet",
      primary: "#8b5cf6",
      light: "#a78bfa",
      gradient: "from-purple-500 to-purple-600",
    },
    orange: {
      name: "Orange",
      primary: "#f59e0b",
      light: "#fbbf24",
      gradient: "from-orange-500 to-orange-600",
    },
  };

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      // Try to get current user first, fallback to userId lookup
      let user;
      try {
        user = await scholchatService.getCurrentUser();
      } catch (error) {
        // Fallback to userId lookup if getCurrentUser fails
        const userId = localStorage.getItem("userId");
        if (userId) {
          user = await scholchatService.getUserById(userId);
        }
      }
      
      if (user) {
        setUserProfile(user);
        setProfileData({
          nom: user.nom || "",
          prenom: user.prenom || "",
          email: user.email || "",
          telephone: user.telephone || "",
          adresse: user.adresse || "",
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      setMessage({ text: "Erreur lors du chargement du profil", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      setSaving(true);
      setMessage({ text: "", type: "" });

      const userId = localStorage.getItem("userId");
      await scholchatService.updateUser(userId, profileData);

      setMessage({ text: "Profil mis à jour avec succès", type: "success" });
      setEditMode(false);
      await loadUserProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({ text: "Erreur lors de la mise à jour du profil", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    try {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setMessage({ text: "Les mots de passe ne correspondent pas", type: "error" });
        return;
      }

      if (passwordData.newPassword.length < 8) {
        setMessage({ text: "Le mot de passe doit contenir au moins 8 caractères", type: "error" });
        return;
      }

      setSaving(true);
      setMessage({ text: "", type: "" });

      // Call the password change API
      await scholchatService.changePassword(passwordData);

      setMessage({ text: "Mot de passe modifié avec succès", type: "success" });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      console.error("Error changing password:", error);
      setMessage({ text: "Erreur lors du changement de mot de passe", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const themeClass = isDark ? "dark" : "";
  const bgClass = isDark ? "bg-gray-900" : "bg-gray-50";
  const cardBgClass = isDark ? "bg-gray-800" : "bg-white";
  const textClass = isDark ? "text-white" : "text-gray-900";
  const textSecondaryClass = isDark ? "text-gray-300" : "text-gray-600";
  const borderClass = isDark ? "border-gray-700" : "border-gray-200";
  const inputBgClass = isDark ? "bg-gray-700" : "bg-gray-50";
  const inputTextClass = isDark ? "text-white" : "text-gray-900";

  const tabs = [
    { id: "profile", label: "Mon Profil", icon: User },
    { id: "security", label: "Sécurité", icon: Lock },
    { id: "appearance", label: "Apparence", icon: Palette },
  ];

  if (loading) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
        <div className="flex items-center gap-3">
          <Loader className="w-6 h-6 animate-spin text-blue-600" />
          <span className={textClass}>Chargement des paramètres...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass} transition-all duration-300`}>
      {/* Modern Header with Gradient */}
      <div className={`relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-white via-blue-50 to-indigo-100'}`}>
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-16 h-16 rounded-2xl ${isDark ? 'bg-gradient-to-br from-blue-600 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'} flex items-center justify-center shadow-lg`}>
              <Settings className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className={`text-4xl font-bold ${textClass} mb-2`}>Paramètres</h1>
              <p className={`text-lg ${textSecondaryClass}`}>Personnalisez votre expérience ScholChat</p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className={`${cardBgClass} rounded-xl p-4 border ${borderClass} backdrop-blur-sm`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${isDark ? 'bg-green-600' : 'bg-green-500'} flex items-center justify-center`}>
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className={`text-sm ${textSecondaryClass}`}>Profil</p>
                  <p className={`font-semibold ${textClass}`}>Complet</p>
                </div>
              </div>
            </div>
            <div className={`${cardBgClass} rounded-xl p-4 border ${borderClass} backdrop-blur-sm`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${isDark ? 'bg-blue-600' : 'bg-blue-500'} flex items-center justify-center`}>
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className={`text-sm ${textSecondaryClass}`}>Sécurité</p>
                  <p className={`font-semibold ${textClass}`}>Protégé</p>
                </div>
              </div>
            </div>
            <div className={`${cardBgClass} rounded-xl p-4 border ${borderClass} backdrop-blur-sm`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${isDark ? 'bg-purple-600' : 'bg-purple-500'} flex items-center justify-center`}>
                  <Palette className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className={`text-sm ${textSecondaryClass}`}>Thème</p>
                  <p className={`font-semibold ${textClass}`}>{colorSchemes[currentTheme]?.name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Message */}
        {message.text && (
          <div className={`mb-8 p-4 rounded-xl border flex items-center gap-3 backdrop-blur-sm ${
            message.type === "success"
              ? `bg-green-50 border-green-200 text-green-700 ${isDark ? "dark:bg-green-900/20 dark:border-green-800 dark:text-green-400" : ""}`
              : `bg-red-50 border-red-200 text-red-700 ${isDark ? "dark:bg-red-900/20 dark:border-red-800 dark:text-red-400" : ""}`
          }`}>
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          {/* Enhanced Sidebar */}
          <div className="xl:col-span-1">
            <div className={`${cardBgClass} rounded-2xl shadow-lg border ${borderClass} p-6 sticky top-6`}>
              <div className="mb-6">
                <div className={`w-20 h-20 rounded-2xl ${isDark ? 'bg-gradient-to-br from-blue-600 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <span className="text-2xl font-bold text-white">
                    {userProfile?.prenom?.charAt(0) || 'U'}{userProfile?.nom?.charAt(0) || 'S'}
                  </span>
                </div>
                <h3 className={`text-center font-semibold ${textClass}`}>
                  {userProfile?.prenom} {userProfile?.nom}
                </h3>
                <p className={`text-center text-sm ${textSecondaryClass} mt-1`}>
                  {userProfile?.role || 'Utilisateur'}
                </p>
              </div>
              
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-300 group ${
                        activeTab === tab.id
                          ? `bg-gradient-to-r ${colorSchemes[currentTheme]?.gradient || "from-blue-500 to-blue-600"} text-white shadow-lg transform scale-105`
                          : `${textClass} hover:${isDark ? "bg-gray-700/50" : "bg-gray-50"} hover:transform hover:scale-105`
                      }`}
                    >
                      <Icon className={`w-5 h-5 transition-transform duration-300 ${activeTab === tab.id ? '' : 'group-hover:scale-110'}`} />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Enhanced Content */}
          <div className="xl:col-span-4">
            <div className={`${cardBgClass} rounded-2xl shadow-lg border ${borderClass} overflow-hidden`}>
              {/* Enhanced Profile Tab */}
              {activeTab === "profile" && (
                <div className="p-8">
                  {/* Profile Header */}
                  <div className={`${isDark ? 'bg-gradient-to-r from-gray-800 to-gray-700' : 'bg-gradient-to-r from-blue-50 to-indigo-50'} rounded-2xl p-6 mb-8`}>
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <div className="relative">
                        <div className={`w-24 h-24 rounded-2xl ${isDark ? 'bg-gradient-to-br from-blue-600 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'} flex items-center justify-center shadow-xl`}>
                          <span className="text-3xl font-bold text-white">
                            {userProfile?.prenom?.charAt(0) || 'U'}{userProfile?.nom?.charAt(0) || 'S'}
                          </span>
                        </div>
                        <button className={`absolute -bottom-2 -right-2 w-8 h-8 ${isDark ? 'bg-gray-700' : 'bg-white'} rounded-full flex items-center justify-center shadow-lg border-2 ${borderClass} hover:scale-110 transition-transform`}>
                          <Camera className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                      <div className="text-center md:text-left flex-1">
                        <h2 className={`text-3xl font-bold ${textClass} mb-2`}>
                          {userProfile?.prenom} {userProfile?.nom}
                        </h2>
                        <p className={`${textSecondaryClass} mb-4`}>{userProfile?.email}</p>
                        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
                            {userProfile?.role || 'Utilisateur'}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${isDark ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800'}`}>
                            Compte Vérifié
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setEditMode(!editMode)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                          editMode
                            ? `bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg`
                            : `bg-gradient-to-r ${colorSchemes[currentTheme]?.gradient || "from-blue-500 to-blue-600"} text-white shadow-lg`
                        }`}
                      >
                        <Edit3 className="w-4 h-4" />
                        {editMode ? "Annuler" : "Modifier le Profil"}
                      </button>
                    </div>
                  </div>

                  {/* Profile Form */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Personal Information */}
                    <div className={`${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} rounded-2xl p-6`}>
                      <h3 className={`text-xl font-semibold ${textClass} mb-6 flex items-center gap-2`}>
                        <User className="w-5 h-5" />
                        Informations Personnelles
                      </h3>
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className={`block text-sm font-semibold ${textClass} mb-3`}>Prénom</label>
                            <input
                              type="text"
                              value={profileData.prenom}
                              onChange={(e) => setProfileData({ ...profileData, prenom: e.target.value })}
                              disabled={!editMode}
                              className={`w-full px-4 py-3 rounded-xl border-2 ${editMode ? 'border-blue-200 focus:border-blue-500' : borderClass} ${inputBgClass} ${inputTextClass} focus:ring-4 focus:ring-blue-100 transition-all duration-300 disabled:opacity-60`}
                              placeholder="Votre prénom"
                            />
                          </div>
                          <div>
                            <label className={`block text-sm font-semibold ${textClass} mb-3`}>Nom</label>
                            <input
                              type="text"
                              value={profileData.nom}
                              onChange={(e) => setProfileData({ ...profileData, nom: e.target.value })}
                              disabled={!editMode}
                              className={`w-full px-4 py-3 rounded-xl border-2 ${editMode ? 'border-blue-200 focus:border-blue-500' : borderClass} ${inputBgClass} ${inputTextClass} focus:ring-4 focus:ring-blue-100 transition-all duration-300 disabled:opacity-60`}
                              placeholder="Votre nom"
                            />
                          </div>
                        </div>
                        <div>
                          <label className={`block text-sm font-semibold ${textClass} mb-3 flex items-center gap-2`}>
                            <Mail className="w-4 h-4" />
                            Adresse Email
                          </label>
                          <input
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                            disabled={!editMode}
                            className={`w-full px-4 py-3 rounded-xl border-2 ${editMode ? 'border-blue-200 focus:border-blue-500' : borderClass} ${inputBgClass} ${inputTextClass} focus:ring-4 focus:ring-blue-100 transition-all duration-300 disabled:opacity-60`}
                            placeholder="votre.email@exemple.com"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className={`${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} rounded-2xl p-6`}>
                      <h3 className={`text-xl font-semibold ${textClass} mb-6 flex items-center gap-2`}>
                        <Phone className="w-5 h-5" />
                        Informations de Contact
                      </h3>
                      <div className="space-y-6">
                        <div>
                          <label className={`block text-sm font-semibold ${textClass} mb-3`}>Téléphone</label>
                          <input
                            type="tel"
                            value={profileData.telephone}
                            onChange={(e) => setProfileData({ ...profileData, telephone: e.target.value })}
                            disabled={!editMode}
                            className={`w-full px-4 py-3 rounded-xl border-2 ${editMode ? 'border-blue-200 focus:border-blue-500' : borderClass} ${inputBgClass} ${inputTextClass} focus:ring-4 focus:ring-blue-100 transition-all duration-300 disabled:opacity-60`}
                            placeholder="+33 1 23 45 67 89"
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-semibold ${textClass} mb-3 flex items-center gap-2`}>
                            <MapPin className="w-4 h-4" />
                            Adresse
                          </label>
                          <textarea
                            value={profileData.adresse}
                            onChange={(e) => setProfileData({ ...profileData, adresse: e.target.value })}
                            disabled={!editMode}
                            rows={3}
                            className={`w-full px-4 py-3 rounded-xl border-2 ${editMode ? 'border-blue-200 focus:border-blue-500' : borderClass} ${inputBgClass} ${inputTextClass} focus:ring-4 focus:ring-blue-100 transition-all duration-300 disabled:opacity-60 resize-none`}
                            placeholder="Votre adresse complète"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {editMode && (
                    <div className="flex justify-end mt-8">
                      <button
                        onClick={handleProfileUpdate}
                        disabled={saving}
                        className={`flex items-center gap-3 px-8 py-4 bg-gradient-to-r ${colorSchemes[currentTheme]?.gradient || "from-blue-500 to-blue-600"} text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none`}
                      >
                        {saving ? (
                          <Loader className="w-5 h-5 animate-spin" />
                        ) : (
                          <Save className="w-5 h-5" />
                        )}
                        {saving ? "Enregistrement en cours..." : "Enregistrer les Modifications"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Enhanced Security Tab */}
              {activeTab === "security" && (
                <div className="p-8">
                  {/* Security Header */}
                  <div className={`${isDark ? 'bg-gradient-to-r from-gray-800 to-gray-700' : 'bg-gradient-to-r from-red-50 to-orange-50'} rounded-2xl p-6 mb-8`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-2xl ${isDark ? 'bg-gradient-to-br from-red-600 to-orange-600' : 'bg-gradient-to-br from-red-500 to-orange-500'} flex items-center justify-center shadow-xl`}>
                        <Shield className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h2 className={`text-3xl font-bold ${textClass} mb-2`}>Sécurité du Compte</h2>
                        <p className={textSecondaryClass}>Protégez votre compte avec un mot de passe sécurisé</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Security Status */}
                    <div className={`${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} rounded-2xl p-6`}>
                      <h3 className={`text-xl font-semibold ${textClass} mb-6 flex items-center gap-2`}>
                        <Lock className="w-5 h-5" />
                        État de Sécurité
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-green-100 dark:bg-green-900/20">
                          <span className="text-green-800 dark:text-green-300 font-medium">Mot de passe</span>
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-green-100 dark:bg-green-900/20">
                          <span className="text-green-800 dark:text-green-300 font-medium">Email vérifié</span>
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20">
                          <span className="text-blue-800 dark:text-blue-300 font-medium">Connexion sécurisée</span>
                          <Shield className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                    </div>

                    {/* Password Change Form */}
                    <div className="lg:col-span-2">
                      <div className={`${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} rounded-2xl p-6`}>
                        <h3 className={`text-xl font-semibold ${textClass} mb-6`}>Modifier le Mot de Passe</h3>
                        <div className="space-y-6">
                          <div>
                            <label className={`block text-sm font-semibold ${textClass} mb-3`}>Mot de passe actuel</label>
                            <div className="relative">
                              <input
                                type={showPassword ? "text" : "password"}
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                className={`w-full px-4 py-4 pr-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 ${inputBgClass} ${inputTextClass} focus:ring-4 focus:ring-blue-100 transition-all duration-300`}
                                placeholder="Entrez votre mot de passe actuel"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className={`absolute right-4 top-1/2 transform -translate-y-1/2 ${textSecondaryClass} hover:${textClass} transition-colors`}
                              >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className={`block text-sm font-semibold ${textClass} mb-3`}>Nouveau mot de passe</label>
                            <div className="relative">
                              <input
                                type={showNewPassword ? "text" : "password"}
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                className={`w-full px-4 py-4 pr-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 ${inputBgClass} ${inputTextClass} focus:ring-4 focus:ring-blue-100 transition-all duration-300`}
                                placeholder="Entrez votre nouveau mot de passe"
                              />
                              <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className={`absolute right-4 top-1/2 transform -translate-y-1/2 ${textSecondaryClass} hover:${textClass} transition-colors`}
                              >
                                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                              </button>
                            </div>
                            {/* Password Strength Indicator */}
                            {passwordData.newPassword && (
                              <div className="mt-2">
                                <div className="flex gap-1 mb-2">
                                  <div className={`h-2 flex-1 rounded ${passwordData.newPassword.length >= 8 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                                  <div className={`h-2 flex-1 rounded ${passwordData.newPassword.length >= 8 && /[A-Z]/.test(passwordData.newPassword) ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                                  <div className={`h-2 flex-1 rounded ${passwordData.newPassword.length >= 8 && /[0-9]/.test(passwordData.newPassword) && /[A-Z]/.test(passwordData.newPassword) ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                                </div>
                                <p className={`text-xs ${textSecondaryClass}`}>Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre</p>
                              </div>
                            )}
                          </div>

                          <div>
                            <label className={`block text-sm font-semibold ${textClass} mb-3`}>Confirmer le nouveau mot de passe</label>
                            <div className="relative">
                              <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                className={`w-full px-4 py-4 pr-12 rounded-xl border-2 ${passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword ? 'border-red-300' : 'border-gray-200 focus:border-blue-500'} ${inputBgClass} ${inputTextClass} focus:ring-4 focus:ring-blue-100 transition-all duration-300`}
                                placeholder="Confirmez votre nouveau mot de passe"
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className={`absolute right-4 top-1/2 transform -translate-y-1/2 ${textSecondaryClass} hover:${textClass} transition-colors`}
                              >
                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                              </button>
                            </div>
                            {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                              <p className="text-red-500 text-sm mt-2">Les mots de passe ne correspondent pas</p>
                            )}
                          </div>

                          <button
                            onClick={handlePasswordChange}
                            disabled={saving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword || passwordData.newPassword !== passwordData.confirmPassword}
                            className={`w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r ${colorSchemes[currentTheme]?.gradient || "from-blue-500 to-blue-600"} text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none`}
                          >
                            {saving ? (
                              <Loader className="w-5 h-5 animate-spin" />
                            ) : (
                              <Lock className="w-5 h-5" />
                            )}
                            {saving ? "Modification en cours..." : "Modifier le Mot de Passe"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced Appearance Tab */}
              {activeTab === "appearance" && (
                <div className="p-8">
                  {/* Appearance Header */}
                  <div className={`${isDark ? 'bg-gradient-to-r from-gray-800 to-gray-700' : 'bg-gradient-to-r from-purple-50 to-pink-50'} rounded-2xl p-6 mb-8`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-2xl ${isDark ? 'bg-gradient-to-br from-purple-600 to-pink-600' : 'bg-gradient-to-br from-purple-500 to-pink-500'} flex items-center justify-center shadow-xl`}>
                        <Palette className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h2 className={`text-3xl font-bold ${textClass} mb-2`}>Personnalisation</h2>
                        <p className={textSecondaryClass}>Adaptez l'interface à vos préférences visuelles</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Theme Settings */}
                    <div className={`${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} rounded-2xl p-6`}>
                      <h3 className={`text-xl font-semibold ${textClass} mb-6 flex items-center gap-2`}>
                        {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        Mode d'Affichage
                      </h3>
                      
                      {/* Dark Mode Toggle */}
                      <div className={`p-6 rounded-xl border-2 ${isDark ? 'border-blue-500 bg-blue-900/20' : 'border-gray-200'} mb-6 transition-all duration-300`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-blue-600' : 'bg-yellow-500'} flex items-center justify-center`}>
                              {isDark ? <Moon className="w-6 h-6 text-white" /> : <Sun className="w-6 h-6 text-white" />}
                            </div>
                            <div>
                              <h4 className={`font-semibold ${textClass}`}>{isDark ? 'Mode Sombre' : 'Mode Clair'}</h4>
                              <p className={`text-sm ${textSecondaryClass}`}>
                                {isDark ? 'Interface sombre pour réduire la fatigue oculaire' : 'Interface claire et lumineuse'}
                              </p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={isDark}
                              onChange={() => setIsDark(!isDark)}
                            />
                            <div className="w-16 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-8 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-blue-600 shadow-lg"></div>
                          </label>
                        </div>
                      </div>

                      {/* Device Preferences */}
                      <div className="space-y-4">
                        <h4 className={`font-semibold ${textClass} mb-3`}>Préférences par Appareil</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className={`p-4 rounded-xl border ${borderClass} text-center hover:${isDark ? 'bg-gray-700' : 'bg-gray-50'} transition-colors cursor-pointer`}>
                            <Monitor className={`w-6 h-6 mx-auto mb-2 ${textSecondaryClass}`} />
                            <p className={`text-sm font-medium ${textClass}`}>Bureau</p>
                          </div>
                          <div className={`p-4 rounded-xl border ${borderClass} text-center hover:${isDark ? 'bg-gray-700' : 'bg-gray-50'} transition-colors cursor-pointer`}>
                            <Smartphone className={`w-6 h-6 mx-auto mb-2 ${textSecondaryClass}`} />
                            <p className={`text-sm font-medium ${textClass}`}>Mobile</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Color Schemes */}
                    <div className={`${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} rounded-2xl p-6`}>
                      <h3 className={`text-xl font-semibold ${textClass} mb-6 flex items-center gap-2`}>
                        <Palette className="w-5 h-5" />
                        Schémas de Couleurs
                      </h3>
                      <div className="grid grid-cols-1 gap-4">
                        {Object.entries(colorSchemes).map(([scheme, config]) => (
                          <div
                            key={scheme}
                            onClick={() => setCurrentTheme(scheme)}
                            className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                              currentTheme === scheme
                                ? `border-2 shadow-lg transform scale-105`
                                : `${borderClass} hover:${isDark ? "bg-gray-700/50" : "bg-white"}`
                            }`}
                            style={{
                              borderColor: currentTheme === scheme ? config.primary : undefined,
                              backgroundColor: currentTheme === scheme ? `${config.primary}10` : undefined
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="flex gap-1">
                                  <div
                                    className="w-8 h-8 rounded-lg shadow-sm"
                                    style={{ backgroundColor: config.primary }}
                                  ></div>
                                  <div
                                    className="w-8 h-8 rounded-lg shadow-sm"
                                    style={{ backgroundColor: config.light }}
                                  ></div>
                                </div>
                                <div>
                                  <h4 className={`font-semibold ${textClass}`}>{config.name}</h4>
                                  <p className={`text-sm ${textSecondaryClass}`}>Thème {config.name.toLowerCase()}</p>
                                </div>
                              </div>
                              {currentTheme === scheme && (
                                <CheckCircle className="w-6 h-6" style={{ color: config.primary }} />
                              )}
                            </div>
                            
                            {/* Color Preview Bar */}
                            <div className="mt-4 h-3 rounded-full overflow-hidden flex">
                              <div className="flex-1" style={{ backgroundColor: config.primary }}></div>
                              <div className="flex-1" style={{ backgroundColor: config.light }}></div>
                              <div className="flex-1" style={{ backgroundColor: `${config.primary}80` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Additional Settings */}
                  <div className={`${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} rounded-2xl p-6 mt-8`}>
                    <h3 className={`text-xl font-semibold ${textClass} mb-6 flex items-center gap-2`}>
                      <Settings className="w-5 h-5" />
                      Préférences Avancées
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center justify-between p-4 rounded-xl border ${borderClass}">
                        <div className="flex items-center gap-3">
                          <Bell className="w-5 h-5 text-blue-500" />
                          <div>
                            <h4 className={`font-medium ${textClass}`}>Animations</h4>
                            <p className={`text-sm ${textSecondaryClass}`}>Effets visuels et transitions</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl border ${borderClass}">
                        <div className="flex items-center gap-3">
                          <Globe className="w-5 h-5 text-green-500" />
                          <div>
                            <h4 className={`font-medium ${textClass}`}>Langue</h4>
                            <p className={`text-sm ${textSecondaryClass}`}>Français (France)</p>
                          </div>
                        </div>
                        <button className={`px-4 py-2 rounded-lg border ${borderClass} ${textClass} hover:${isDark ? 'bg-gray-700' : 'bg-gray-50'} transition-colors`}>
                          Modifier
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsContent;
