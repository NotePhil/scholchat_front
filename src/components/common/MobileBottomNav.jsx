import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faXmark,
  faHouse,
  faMessage,
  faBell,
  faUser,
  faBookOpen,
  faCalendarDays,
  faGear,
  faCircleQuestion,
} from "@fortawesome/free-solid-svg-icons";
import { asIconComponent } from "../../utils/faIconAdapter";
const Bell = asIconComponent(faBell);
const BookOpen = asIconComponent(faBookOpen);
const Calendar = asIconComponent(faCalendarDays);
const HelpCircle = asIconComponent(faCircleQuestion);
const Home = asIconComponent(faHouse);
const MessageSquare = asIconComponent(faMessage);
const Plus = asIconComponent(faPlus);
const Settings = asIconComponent(faGear);
const User = asIconComponent(faUser);
const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState(null);
  const navItems = [
    {
      icon: Home,
      label: "Home",
      path: "/schoolchat/principal/etablissement",
    },
    {
      icon: MessageSquare,
      label: "Messages",
      path: "/schoolchat/messages",
      hasSubMenu: true,
    },
    {
      icon: Plus,
      label: "Action",
      isCenter: true,
    },
    {
      icon: Bell,
      label: "Alerts",
      path: "/schoolchat/notifications",
    },
    {
      icon: User,
      label: "Profile",
      path: "/schoolchat/profile",
    },
  ];
  const quickActions = [
    {
      icon: BookOpen,
      label: "New Class",
      color: "bg-blue-500",
    },
    {
      icon: Calendar,
      label: "Schedule",
      color: "bg-purple-500",
    },
    {
      icon: Settings,
      label: "Settings",
      color: "bg-gray-500",
    },
    {
      icon: HelpCircle,
      label: "Help",
      color: "bg-orange-500",
    },
  ];
  const isActive = (path) => location.pathname === path;
  return (
    <div className="md:hidden">
      {/* Quick Actions Overlay */}
      <AnimatePresence>
        {showQuickActions && (
          <>
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
              onClick={() => setShowQuickActions(false)}
            />
            <motion.div
              initial={{
                y: "100%",
                opacity: 0,
              }}
              animate={{
                y: 0,
                opacity: 1,
              }}
              exit={{
                y: "100%",
                opacity: 0,
              }}
              className="fixed bottom-24 left-4 right-4 bg-white dark:bg-gray-800 rounded-3xl p-6 z-[101] shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold dark:text-white">
                  Quick Actions
                </h3>
                <button
                  onClick={() => setShowQuickActions(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <FontAwesomeIcon
                    icon={faXmark}
                    className="dark:text-white"
                    style={{
                      fontSize: 24,
                    }}
                  />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <motion.button
                    key={index}
                    whileHover={{
                      scale: 1.02,
                    }}
                    whileTap={{
                      scale: 0.98,
                    }}
                    className="flex items-center space-x-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                  >
                    <div
                      className={`p-3 rounded-xl ${action.color} text-white shadow-lg shadow-blue-500/20`}
                    >
                      <action.icon size={20} />
                    </div>
                    <span className="font-semibold dark:text-white">
                      {action.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Bottom Nav Bar */}
      <nav className="fixed bottom-6 left-6 right-6 h-20 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 dark:border-gray-800 rounded-[32px] shadow-2xl z-[90] flex items-center justify-around px-2">
        {navItems.map((item, index) => {
          if (item.isCenter) {
            return (
              <div key={index} className="relative -top-8">
                <motion.button
                  whileHover={{
                    scale: 1.1,
                  }}
                  whileTap={{
                    scale: 0.9,
                  }}
                  onClick={() => setShowQuickActions(!showQuickActions)}
                  className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-blue-500/40 relative z-10"
                >
                  <FontAwesomeIcon
                    icon={faPlus}
                    className={`transition-transform duration-300 ${showQuickActions ? "rotate-45" : ""}`}
                    style={{
                      fontSize: 32,
                    }}
                  />
                </motion.button>
                <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 -z-10 animate-pulse"></div>
              </div>
            );
          }
          const ActiveIcon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center space-y-1 relative group w-12"
            >
              <div
                className={`p-2 rounded-2xl transition-all duration-300 ${active ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`}
              >
                <ActiveIcon size={24} strokeWidth={active ? 2.5 : 2} />
                {item.hasSubMenu && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-pink-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                )}
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-widest ${active ? "text-blue-600" : "text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"}`}
              >
                {item.label}
              </span>
              {active && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-1 w-1 h-1 bg-blue-600 rounded-full"
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
export default MobileBottomNav;
