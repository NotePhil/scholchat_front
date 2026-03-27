import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LogoImg from "../assets/images/logo.png";
import { NavLink } from "react-router-dom";
import { HiOutlineMenuAlt3, HiX } from "react-icons/hi";
import { IoIosArrowDown } from "react-icons/io";
import { FiSun, FiMoon, FiGlobe, FiDownload } from "react-icons/fi";
import { useTranslation } from "../../hooks/useTranslation";
import { motion, AnimatePresence } from "framer-motion";
import { useInstallApp } from "../PWAInstallPrompt";

export const Header = ({ theme, setTheme }) => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [productsDropdown, setProductsDropdown] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, changeLanguage } = useTranslation();
  const { canInstall, install: installApp } = useInstallApp();

  const handleInstallClick = () => {
    if (canInstall) {
      installApp();
    }
    // On production with HTTPS, canInstall will be true and native prompt shows
    // On localhost without HTTPS, button is hidden
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Force re-render when language changes
  }, [language]);

  const navItems = [
    { name: t("navigation.home"), path: "/" },
    { name: t("navigation.about"), path: "/schoolchat/about" },
    { 
      name: t("navigation.products"), 
      path: "/schoolchat/courses",
      hasDropdown: true,
      dropdownItems: [
        { name: t("navigation.pricing"), path: "/schoolchat/functionalities" },
        { name: t("navigation.nurseries"), path: "/schoolchat/nursery" },
        { name: t("navigation.kindergartens"), path: "/schoolchat/kindergarten" },
        { name: t("navigation.primarySchools"), path: "/schoolchat/primary-school" },
        { name: t("navigation.highSchools"), path: "/schoolchat/high-school" },
        { name: t("navigation.university"), path: "/schoolchat/university" }
      ]
    },
    { name: t("navigation.faq"), path: "/schoolchat/blog" },
    { name: t("navigation.contact"), path: "/schoolchat/contact" },
  ];

  const getHeaderClasses = () => {
    const baseClasses = "fixed top-0 left-0 w-full z-50 transition-all duration-500";
    if (scrolled) {
      return `${baseClasses} bg-white/80 dark:bg-gray-900/90 backdrop-blur-xl shadow-2xl shadow-blue-500/5 border-b border-gray-200/50 dark:border-gray-700/50`;
    }
    return `${baseClasses} bg-white/60 dark:bg-gray-900/60 backdrop-blur-md`;
  };

  const linkVariants = {
    hover: { y: -2 },
    tap: { scale: 0.98 }
  };

  const dropdownVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    },
    exit: { 
      opacity: 0, 
      y: -10, 
      scale: 0.95,
      transition: { duration: 0.2 }
    }
  };

  return (
    <>
      <header className={getHeaderClasses()}>
        {/* Gradient accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            {/* Logo Section */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center cursor-pointer group"
              onClick={() => navigate("/")}
            >
              <div className="relative">
                {/* Glow effect behind logo */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
                <img
                  src={LogoImg}
                  alt="SchoolChat"
                  className="h-28 md:h-32 w-auto object-contain relative z-10 transform group-hover:scale-105 transition-all duration-300 drop-shadow-lg"
                />
              </div>
            </motion.div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navItems.map((item, index) => (
                item.hasDropdown ? (
                  <div 
                    key={item.path}
                    className="relative"
                    onMouseEnter={() => setProductsDropdown(true)}
                    onMouseLeave={() => setProductsDropdown(false)}
                  >
                    <motion.button
                      className={`flex items-center space-x-1.5 px-4 py-2.5 text-[15px] font-semibold rounded-xl transition-all duration-300 ${
                         location.pathname.includes('/courses') || location.pathname.includes('/functionalities') || location.pathname.includes('/instructor') 
                         ? "text-white bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/30" 
                         : "text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      }`}
                      variants={linkVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <span>{item.name}</span>
                      <IoIosArrowDown className={`w-4 h-4 transition-transform duration-300 ${
                        productsDropdown ? 'rotate-180' : ''
                      }`} />
                    </motion.button>
                    
                    <AnimatePresence>
                      {productsDropdown && (
                        <motion.div 
                          variants={dropdownVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden backdrop-blur-xl bg-opacity-95"
                        >
                          <div className="p-2">
                            {item.dropdownItems.map((dropdownItem, idx) => (
                              <motion.a
                                key={dropdownItem.path}
                                href={dropdownItem.path}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group flex items-center space-x-3 px-4 py-3.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-all duration-200 relative overflow-hidden"
                                onClick={() => setProductsDropdown(false)}
                              >
                                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                                <span className="flex-1">{dropdownItem.name}</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                              </motion.a>
                            ))}
                          </div>
                          {/* Bottom gradient accent */}
                          <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <NavLink
                    key={item.path}
                    to={item.path}
                  >
                    {({ isActive }) => (
                      <motion.span
                        className={`px-4 py-2.5 text-[15px] font-semibold rounded-xl transition-all duration-300 block ${
                          isActive 
                            ? "text-white bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/30" 
                            : "text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        }`}
                        variants={linkVariants}
                        whileHover="hover"
                        whileTap="tap"
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </NavLink>
                )
              ))}
            </nav>

            {/* Right Side Actions */}
            <div className="hidden lg:flex items-center space-x-3">
              {/* Theme Toggle */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-indigo-900/30 dark:to-purple-900/30 hover:from-amber-100 hover:to-orange-100 dark:hover:from-indigo-800/30 dark:hover:to-purple-800/30 transition-all duration-300 text-amber-600 dark:text-indigo-400 border border-amber-200 dark:border-indigo-700/50 shadow-lg"
              >
                <AnimatePresence mode="wait">
                  {theme === "dark" ? (
                    <motion.div
                      key="sun"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FiSun className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="moon"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FiMoon className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Language Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => changeLanguage(language === "fr" ? "en" : "fr")}
                className="flex items-center space-x-2 px-4 py-2.5 text-sm font-bold bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-800/30 dark:hover:to-pink-800/30 transition-all duration-300 border border-purple-200 dark:border-purple-700/50 rounded-xl shadow-lg"
              >
                <FiGlobe className="w-4 h-4" />
                <span className="w-8 text-center">{language === "fr" ? "EN" : "FR"}</span>
              </motion.button>

              {/* Install App Button */}
              {canInstall && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleInstallClick}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-700/50 hover:bg-green-100 dark:hover:bg-green-900/30 transition-all"
                >
                  <FiDownload size={16} />
                  Installer
                </motion.button>
              )}

              {/* Auth Buttons */}
              <div className="flex items-center space-x-3 pl-2 border-l border-gray-200 dark:border-gray-700 ml-3">
                <NavLink to="/schoolchat/login">
                   {({ isActive }) => (
                      <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${
                          isActive
                            ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-xl shadow-blue-500/40"
                            : "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-700/50"
                        }`}
                      >
                        {t("auth.login.signIn")}
                      </motion.button>
                   )}
                </NavLink>
                <NavLink to="/schoolchat/signup">
                   {({ isActive }) => (
                      <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${
                          isActive
                            ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-xl shadow-blue-500/40"
                            : "text-gray-700 dark:text-gray-200 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 border-2 border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        {t("auth.login.signUp")}
                      </motion.button>
                   )}
                </NavLink>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="lg:hidden p-3 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 border border-gray-200 dark:border-gray-700"
              onClick={() => setOpen(!open)}
            >
              <AnimatePresence mode="wait">
                {open ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <HiX className="w-7 h-7" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <HiOutlineMenuAlt3 className="w-7 h-7" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {open && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="lg:hidden border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl max-h-[85vh] overflow-y-auto custom-scrollbar"
              >
                <div className="py-6 space-y-3 px-4">
                  {navItems.map((item, itemIdx) => (
                    item.hasDropdown ? (
                      <motion.div 
                        key={item.path} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: itemIdx * 0.05 }}
                        className="space-y-2"
                      >
                        <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider py-2 px-4 flex items-center space-x-2">
                          <div className="w-1 h-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                          <span>{item.name}</span>
                        </div>
                        <div className="space-y-1.5 pl-4">
                          {item.dropdownItems.map((dropdownItem, dropIdx) => (
                            <NavLink
                              key={dropdownItem.path}
                              to={dropdownItem.path}
                              className={({ isActive }) =>
                                `block px-4 py-3 text-[15px] font-medium rounded-xl transition-all duration-200 ${
                                  isActive
                                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                                    : "text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20"
                                }`
                              }
                              onClick={() => setOpen(false)}
                            >
                              {dropdownItem.name}
                            </NavLink>
                          ))}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key={item.path}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: itemIdx * 0.05 }}
                      >
                        <NavLink
                          to={item.path}
                          className={({ isActive }) =>
                            `block px-4 py-3.5 text-[15px] font-semibold rounded-xl transition-all duration-300 ${
                              isActive
                                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl shadow-blue-500/30"
                                : "text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20"
                            }`
                          }
                          onClick={() => setOpen(false)}
                        >
                          {item.name}
                        </NavLink>
                      </motion.div>
                    )
                  ))}

                  {/* Mobile Actions */}
                  <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setTheme(theme === "dark" ? "light" : "dark");
                          setOpen(false);
                        }}
                        className="flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-indigo-900/30 dark:to-purple-900/30 border border-amber-200 dark:border-indigo-700/50 shadow-lg transition-all duration-200"
                      >
                        {theme === "dark" ? 
                          <FiSun className="text-amber-500 w-5 h-5" /> : 
                          <FiMoon className="text-indigo-500 w-5 h-5" />
                        }
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                          {theme === "dark" ? "Light" : "Dark"}
                        </span>
                      </motion.button>
                      
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          changeLanguage(language === "fr" ? "en" : "fr");
                          setOpen(false);
                        }}
                        className="flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border border-purple-200 dark:border-purple-700/50 shadow-lg transition-all duration-200"
                      >
                        <FiGlobe className="text-purple-600 dark:text-purple-400 w-5 h-5" />
                        <span className="text-sm font-bold text-purple-700 dark:text-purple-300 w-8">
                          {language === "fr" ? "EN" : "FR"}
                        </span>
                      </motion.button>
                    </div>

                    {canInstall && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { handleInstallClick(); setOpen(false); }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 mb-3 text-sm font-bold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700/50"
                      >
                        <FiDownload size={16} />
                        Installer l'application
                      </motion.button>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <NavLink
                        to="/schoolchat/login"
                        className="block px-4 py-3.5 text-sm font-bold text-center text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 border border-blue-200 dark:border-blue-700/50"
                        onClick={() => setOpen(false)}
                      >
                        {t("auth.login.signIn")}
                      </NavLink>
                      <NavLink
                        to="/schoolchat/signup"
                        className={({ isActive }) => 
                          `block px-4 py-3.5 text-sm font-bold text-center rounded-xl transition-all duration-200 ${
                            isActive
                              ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-xl shadow-blue-500/40"
                              : "text-gray-700 dark:text-gray-200 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 border-2 border-gray-300 dark:border-gray-600"
                          }`
                        }
                        onClick={() => setOpen(false)}
                      >
                        {t("auth.login.signUp")}
                      </NavLink>
                    </div>
                  </div>
                </div>
                {/* Bottom gradient accent */}
                <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>
      <div className="h-24"></div>

    </>
  );
};