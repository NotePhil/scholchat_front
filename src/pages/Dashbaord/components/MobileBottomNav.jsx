import React, { useState } from "react";
import {
  LayoutDashboard,
  MessageSquare,
  Plus,
  Bell,
  User,
  X,
  PlusCircle,
  Users,
  Building2,
  BookOpen,
  GraduationCap,
  School,
  Settings,
  Activity,
  LogOut,
  AlertCircle,
  Book,
  ClipboardList,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../hooks/useAuth";
import { useTranslation } from "../../../hooks/useTranslation";

const MobileBottomNav = ({
  activeTab,
  setActiveTab,
  isDark,
  currentTheme,
  colorSchemes,
  onLogout,
}) => {
  const [showQuickActions, setShowQuickActions] = useState(false);
  const { t } = useTranslation();
  const {
    isAdmin,
    isProfessor,
    isParent,
    isStudent,
    isTutor,
    isGestionnaire,
    isParentOrStudent,
  } = useAuth();

  const primaryColor = colorSchemes?.[currentTheme]?.primary || "#3b82f6";

  const [showMore, setShowMore] = useState(false);

  const getQuickActions = () => {
    let items = [];

    if (!showMore) {
      // Main menu — matches Sidebar exactly
        items = [
          { icon: LayoutDashboard, label: "Dashboard", color: "bg-indigo-500", tab: "dashboard" },
          { icon: Activity, label: "Activités", color: "bg-blue-500", tab: "activities" },
          { icon: PlusCircle, label: "Événement", color: "bg-pink-500", tab: "activities", action: "create-event" },
        ];

      if (isAdmin) {
        items.push(
          { icon: Users, label: "Utilisateurs", color: "bg-violet-600", isToggle: "users" },
          { icon: GraduationCap, label: "Matières", color: "bg-purple-500", tab: "matieres" },
          { icon: AlertCircle, label: "Motifs Rejet", color: "bg-orange-500", tab: "motifs-de-rejet" },
          { icon: Building2, label: "Classes", color: "bg-cyan-600", isToggle: "classes" },
          { icon: School, label: "Écoles", color: "bg-teal-600", isToggle: "establishments" },
          { icon: MessageSquare, label: "Messagerie", color: "bg-sky-500", tab: "messages" }
        );
      } else if (isProfessor || isTutor) {
        items.push(
          { icon: Book, label: "Cours", color: "bg-emerald-500", isToggle: "courses" },
          { icon: GraduationCap, label: "Matières", color: "bg-purple-500", tab: "matieres" },
          { icon: ClipboardList, label: "Exercices", color: "bg-amber-500", tab: "manage-exercises" },
          { icon: Users, label: "Utilisateurs", color: "bg-violet-500", isToggle: "users" },
          { icon: Building2, label: "Classes", color: "bg-cyan-500", isToggle: "classes" },
          { icon: MessageSquare, label: "Messagerie", color: "bg-sky-500", tab: "messages" }
        );
      } else if (isParentOrStudent) {
        items.push(
          { icon: ClipboardList, label: "Exercices", color: "bg-amber-500", tab: "manage-exercises" },
          { icon: FileText, label: "Devoirs", color: "bg-blue-700", tab: "devoirs" },
          { icon: Building2, label: "Classes", color: "bg-emerald-500", tab: "classes" },
          { icon: BookOpen, label: "Mes Cours", color: "bg-violet-500", tab: "cours" },
        );
        if (isParent) {
          items.push({ icon: Users, label: "Enfants", color: "bg-purple-500", tab: "my-children" });
        }
        items.push(
          { icon: MessageSquare, label: "Messagerie", color: "bg-sky-500", tab: "messages" }
        );
      } else if (isGestionnaire) {
        items.push(
          { icon: School, label: "Écoles", color: "bg-teal-500", isToggle: "establishments" },
          { icon: Building2, label: "Classes", color: "bg-emerald-500", isToggle: "classes" },
          { icon: MessageSquare, label: "Messagerie", color: "bg-sky-500", tab: "messages" }
        );
      }

      items.push({ icon: Settings, label: "Paramètres", color: "bg-slate-500", tab: "settings" });
    } else {
      // Sub-menu level — matches Sidebar dropdown items exactly
      if (showMore === "users") {
        if (isAdmin) {
          items = [
            { icon: User, label: "Admin", color: "bg-red-500", tab: "admin" },
            { icon: Users, label: "Profs", color: "bg-violet-500", tab: "professors" },
            { icon: Users, label: "Parents", color: "bg-amber-500", tab: "parents" },
            { icon: Users, label: "Élèves", color: "bg-blue-600", tab: "students" },
            { icon: Plus, label: "Autres", color: "bg-slate-400", tab: "others" },
          ];
        } else if (isProfessor || isTutor) {
          items = [
            { icon: Users, label: "Profs", color: "bg-violet-500", tab: "professors" },
            { icon: Users, label: "Parents", color: "bg-amber-500", tab: "parents" },
            { icon: Users, label: "Élèves", color: "bg-blue-600", tab: "students" },
          ];
        }
      } else if (showMore === "classes") {
        items = [
          { icon: PlusCircle, label: "Créer Classe", color: "bg-emerald-500", tab: "create-class" },
          { icon: Building2, label: "Gérer Classe", color: "bg-cyan-500", tab: "manage-class" },
        ];
      } else if (showMore === "establishments") {
        items = [
          { icon: School, label: "Créer École", color: "bg-teal-500", tab: "create-establishment" },
          { icon: School, label: "Gérer École", color: "bg-emerald-500", tab: "manage-establishment" },
        ];
      } else if (showMore === "courses") {
        items = [
          { icon: BookOpen, label: "Cours", color: "bg-emerald-500", tab: "courses" },
          { icon: Book, label: "Programmer", color: "bg-cyan-500", tab: "schedule-course" },
        ];
      }

      // Always add back button in sub-menu
      items.push({ icon: X, label: "Retour", color: "bg-slate-700", isToggle: false });
    }

    return items;
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Home", tab: "dashboard" },
    { icon: MessageSquare, label: "Messages", tab: "messages", hasIndicator: true },
    { icon: Plus, label: "Actions", isCenter: true },
    { icon: Bell, label: "Alerts", tab: "activities", neverActive: true },
    { icon: User, label: "Profile", tab: "settings" },
  ];

  const quickActions = getQuickActions();

  return (
    <>
      {/* Quick Actions Overlay */}
      <AnimatePresence>
        {showQuickActions && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000]"
              onClick={() => setShowQuickActions(false)}
            />
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-[40px] p-8 z-[1001] shadow-2xl safe-area-bottom pb-32 max-h-[85vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-black dark:text-white">Accès Rapide</h3>
                  <p className="text-sm text-gray-500">Raccourcis vers vos tâches quotidiennes</p>
                </div>
                <button 
                  onClick={() => setShowQuickActions(false)}
                  className="p-3 bg-gray-100 dark:bg-slate-800 rounded-2xl transition-transform hover:rotate-90"
                >
                  <X size={24} className="dark:text-white" />
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                {quickActions.map((action, index) => (
                  <motion.button
                    key={index}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (action.isToggle !== undefined) {
                        setShowMore(action.isToggle);
                        return;
                      }
                      setActiveTab(action.tab);
                      setShowQuickActions(false);
                      setShowMore(false);
                    }}
                    className="flex flex-col items-center p-3 rounded-2xl bg-gray-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-blue-500/30 transition-all group"
                  >
                    <div className={`p-3 rounded-xl ${action.color} text-white shadow-lg mb-2 group-hover:scale-110 transition-transform`}>
                      <action.icon size={18} />
                    </div>
                    <span className="font-bold text-[10px] dark:text-white text-center line-clamp-1">{action.label}</span>
                  </motion.button>
                ))}
              </div>

              <button 
                onClick={() => {
                  onLogout();
                  setShowQuickActions(false);
                }}
                className="w-full mt-6 p-5 flex items-center justify-center space-x-3 bg-red-50 dark:bg-red-900/10 text-red-600 rounded-3xl font-bold"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-t border-gray-100 dark:border-white/5 z-[999] flex items-center justify-around px-4" style={{ height: 'calc(80px + env(safe-area-inset-bottom, 16px))', paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}>
        {navItems.map((item, index) => {
          if (item.isCenter) {
            return (
              <div key={index} className="relative -top-6">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowQuickActions(!showQuickActions)}
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-2xl relative z-10"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
                    boxShadow: `0 10px 25px -5px ${primaryColor}77`
                  }}
                >
                  {showQuickActions ? (
                    <X size={28} className="transition-transform duration-500" />
                  ) : (
                    <LayoutDashboard size={28} className="transition-transform duration-500" />
                  )}
                </motion.button>
              </div>
            );
          }

          const active = !item.neverActive && activeTab === item.tab;
          
          return (
            <button
              key={index}
              onClick={() => setActiveTab(item.tab)}
              className="flex flex-col items-center justify-center space-y-1 py-2 rounded-2xl transition-all duration-300 relative"
            >
              <div className={`relative p-2 rounded-xl transition-all duration-300 ${active ? 'scale-110' : 'text-gray-400 opacity-60'}`}>
                <item.icon 
                  size={24} 
                  strokeWidth={active ? 2.5 : 2} 
                  color={active ? primaryColor : undefined}
                />
                
                {item.hasIndicator && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm animate-pulse" />
                )}
              </div>
              
              <span className={`text-[10px] font-black uppercase tracking-tighter ${active ? 'opacity-100 transform -translate-y-1' : 'opacity-0'} transition-all duration-300`} style={{ color: primaryColor }}>
                {item.label}
              </span>
              
              {active && (
                <motion.div
                  layoutId="activeNavIndicator"
                  className="absolute -bottom-1 w-1 h-1 rounded-full"
                  style={{ backgroundColor: primaryColor }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};

export default MobileBottomNav;
