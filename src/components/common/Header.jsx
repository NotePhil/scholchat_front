import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LogoImg from "../assets/images/logo.png";
import { LinkData } from "../assets/data/dummydata";
import { NavLink } from "react-router-dom";
import { HiOutlineMenuAlt3, HiX } from "react-icons/hi";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { FiGlobe, FiSun, FiMoon } from "react-icons/fi";

export const Header = ({ theme, setTheme }) => {
  const [open, setOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("Nos produits");
  const [language, setLanguage] = useState("Français");
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Routes existantes basées sur votre App.js
  const existingRoutes = [
    "/",
    "/schoolchat/about",
    "/schoolchat/courses",
    "/schoolchat/instructor",
    "/schoolchat/blog",
    "/schoolchat/functionalities",
    "/schoolchat/login",
    "/schoolchat/signup",
    "/schoolchat/manage-class",
    "/schoolchat/activity",
    "/schoolchat/single-blog",
  ];

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSelectChange = (e) => {
    const selectedOption = e.target.options[e.target.selectedIndex].text;
    setSelectedProduct(selectedOption);
    const url = e.target.value;
    if (url && existingRoutes.includes(url)) {
      navigate(url);
    } else if (url) {
      navigate("/");
    }
  };

  const handleNavClick = (url) => {
    if (existingRoutes.includes(url)) {
      navigate(url);
    } else {
      navigate("/");
    }
    setOpen(false);
  };

  const handleLogoClick = () => {
    navigate("/");
    setOpen(false);
  };

  useEffect(() => {
    const isSelectOption = LinkData.find(
      (link) =>
        link.isSelect &&
        link.options.some((option) => option.url === location.pathname)
    );
    if (!isSelectOption) {
      setSelectedProduct("Nos produits");
    }
  }, [location.pathname]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        open &&
        !event.target.closest(".mobile-menu") &&
        !event.target.closest(".menu-toggle")
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".language-dropdown")) {
        setIsLanguageDropdownOpen(false);
      }
      if (!event.target.closest(".theme-dropdown")) {
        setIsThemeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Theme configurations
  const getThemeClasses = () => {
    switch (theme) {
      case "dark":
        return {
          header: scrolled
            ? "bg-gray-900 border-b border-gray-700/50 shadow-xl"
            : "bg-gray-900 shadow-lg",
          text: "text-white",
          textSecondary: "text-gray-300",
          textHover: "hover:text-blue-400 hover:scale-105",
          textActive: "text-blue-400",
          button: "hover:bg-gray-800/60 active:scale-95",
          dropdown: "bg-gray-800/95 backdrop-blur-md border-gray-700/50",
          dropdownItem: "hover:bg-gray-700/60",
          mobileMenu: "bg-gray-900",
          select:
            "bg-gray-800/60 text-white focus:ring-blue-500 focus:bg-gray-700/80",
          logo: "brightness-110 contrast-110",
        };
      case "light":
        return {
          header: scrolled
            ? "bg-white border-b border-gray-200/60 shadow-xl"
            : "bg-white shadow-lg",
          text: "text-gray-800",
          textSecondary: "text-gray-600",
          textHover: "hover:text-blue-600 hover:scale-105",
          textActive: "text-blue-600",
          button: "hover:bg-gray-100/80 active:scale-95",
          dropdown: "bg-white/95 backdrop-blur-md border-gray-200/60",
          dropdownItem: "hover:bg-gray-50/80",
          mobileMenu: "bg-white",
          select:
            "bg-gray-50/80 text-gray-700 focus:ring-blue-500 focus:bg-white/90",
          logo: "brightness-100 contrast-100",
        };
      default:
        return {
          header: scrolled
            ? "bg-white border-b border-blue-100/60 shadow-xl"
            : "bg-gradient-to-r from-white to-blue-50 shadow-lg",
          text: "text-gray-700",
          textSecondary: "text-gray-600",
          textHover: "hover:text-blue-600 hover:scale-105",
          textActive: "text-blue-600",
          button: "hover:bg-blue-50/80 active:scale-95",
          dropdown: "bg-white/95 backdrop-blur-md border-blue-100/60",
          dropdownItem: "hover:bg-blue-50/60",
          mobileMenu: "bg-white",
          select:
            "bg-blue-50/60 text-gray-700 focus:ring-blue-500 focus:bg-white/90",
          logo: "brightness-105 contrast-105",
        };
    }
  };

  const themeClasses = getThemeClasses();

  const getThemeIcon = () => {
    switch (theme) {
      case "dark":
        return <FiMoon className="w-4 h-4" />;
      case "light":
        return <FiSun className="w-4 h-4" />;
      default:
        return (
          <div className="w-4 h-4 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-sm" />
        );
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case "dark":
        return "Sombre";
      case "light":
        return "Clair";
      default:
        return "Auto";
    }
  };

  return (
    <>
      {/* Logo positioned in front of header - Fixed positioning */}
      <div
        className="fixed top-2 sm:top-3 md:top-4 left-2 sm:left-4 md:left-6 lg:left-8 z-[60] cursor-pointer group"
        onClick={handleLogoClick}
      >
        <img
          src={LogoImg}
          alt="Scholchat"
          className={`h-12 sm:h-14 md:h-16 lg:h-20 xl:h-24 w-auto object-contain transition-all duration-300 ${themeClasses.logo} group-hover:scale-110 group-hover:brightness-110 drop-shadow-lg`}
        />
      </div>

      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ease-out ${themeClasses.header}`}
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex justify-between items-center h-16 sm:h-18 md:h-20 lg:h-24 xl:h-28">
            {/* Logo space - Responsive width */}
            <div className="flex-shrink-0 w-12 sm:w-14 md:w-16 lg:w-20 xl:w-24"></div>

            {/* Desktop Navigation - Hidden on mobile and tablet */}
            <nav className="hidden xl:flex items-center space-x-2 2xl:space-x-4">
              {LinkData.map((link) =>
                link.isSelect ? (
                  <div key={link.id} className="relative group">
                    <select
                      value=""
                      className={`appearance-none bg-transparent ${themeClasses.text} ${themeClasses.textHover} font-medium text-sm 2xl:text-base px-3 2xl:px-4 py-2 2xl:py-3 pr-8 2xl:pr-10 cursor-pointer focus:outline-none transition-all duration-300 rounded-lg ${themeClasses.button}`}
                      onChange={handleSelectChange}
                    >
                      <option value="">{selectedProduct}</option>
                      {link.options.map((option) => (
                        <option key={option.id} value={option.url}>
                          {option.title}
                        </option>
                      ))}
                    </select>
                    <IoIosArrowDown
                      className={`absolute right-2 2xl:right-3 top-1/2 transform -translate-y-1/2 ${themeClasses.textSecondary} pointer-events-none text-sm group-hover:text-blue-500 transition-colors duration-200`}
                    />
                  </div>
                ) : (
                  <NavLink
                    key={link.id}
                    className={({ isActive }) =>
                      `relative px-3 2xl:px-4 py-2 2xl:py-3 font-medium text-sm 2xl:text-base transition-all duration-300 rounded-lg ${
                        isActive
                          ? `${themeClasses.textActive} bg-blue-50/50 ${
                              theme === "dark" ? "bg-blue-900/20" : ""
                            }`
                          : `${themeClasses.text} ${themeClasses.textHover} ${themeClasses.button}`
                      }`
                    }
                    to={link.url}
                    onClick={(e) => {
                      if (!existingRoutes.includes(link.url)) {
                        e.preventDefault();
                        handleNavClick(link.url);
                      }
                    }}
                  >
                    {({ isActive }) => (
                      <>
                        {link.title}
                        {isActive && (
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                        )}
                      </>
                    )}
                  </NavLink>
                )
              )}
            </nav>

            {/* Right Side Actions - Responsive spacing */}
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
              {/* Theme Selector - Responsive */}
              <div className="relative theme-dropdown">
                <button
                  className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl ${themeClasses.button} transition-all duration-300 focus:outline-none group`}
                  onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                >
                  <div className="group-hover:rotate-12 transition-transform duration-300">
                    {getThemeIcon()}
                  </div>
                  <span
                    className={`text-xs sm:text-sm font-medium ${themeClasses.text} hidden md:block`}
                  >
                    {getThemeLabel()}
                  </span>
                  {isThemeDropdownOpen ? (
                    <IoIosArrowUp
                      className={`w-3 h-3 ${themeClasses.textSecondary} transition-transform duration-200 hidden sm:block`}
                    />
                  ) : (
                    <IoIosArrowDown
                      className={`w-3 h-3 ${themeClasses.textSecondary} transition-transform duration-200 hidden sm:block`}
                    />
                  )}
                </button>

                {isThemeDropdownOpen && (
                  <div
                    className={`absolute top-12 sm:top-14 right-0 ${themeClasses.dropdown} rounded-xl sm:rounded-2xl shadow-2xl border overflow-hidden z-50 min-w-[140px] sm:min-w-[160px] animate-in slide-in-from-top-2 duration-300`}
                  >
                    {[
                      {
                        key: "default",
                        label: "Auto",
                        icon: (
                          <div className="w-4 h-4 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full"></div>
                        ),
                      },
                      {
                        key: "light",
                        label: "Clair",
                        icon: <FiSun className="w-4 h-4" />,
                      },
                      {
                        key: "dark",
                        label: "Sombre",
                        icon: <FiMoon className="w-4 h-4" />,
                      },
                    ].map((themeOption) => (
                      <button
                        key={themeOption.key}
                        className={`flex items-center w-full px-3 sm:px-4 py-2.5 sm:py-3 ${themeClasses.dropdownItem} text-xs sm:text-sm font-medium transition-all duration-200 ${themeClasses.text} hover:scale-105 active:scale-95`}
                        onClick={() => {
                          setTheme(themeOption.key);
                          setIsThemeDropdownOpen(false);
                        }}
                      >
                        <div className="mr-2 sm:mr-3 transition-transform duration-200 hover:rotate-12">
                          {themeOption.icon}
                        </div>
                        {themeOption.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Language Selector - Responsive */}
              <div className="relative language-dropdown">
                <button
                  className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl ${themeClasses.button} transition-all duration-300 focus:outline-none group`}
                  onClick={() =>
                    setIsLanguageDropdownOpen(!isLanguageDropdownOpen)
                  }
                >
                  <div className="relative overflow-hidden rounded-sm group-hover:scale-110 transition-transform duration-300">
                    <img
                      src={
                        language === "Français"
                          ? require("../assets/images/fr.jpeg")
                          : require("../assets/images/en.jpeg")
                      }
                      alt={language}
                      className="w-4 h-4 object-cover"
                    />
                  </div>
                  <span
                    className={`text-xs sm:text-sm font-medium ${themeClasses.text} hidden md:block`}
                  >
                    {language}
                  </span>
                  <span
                    className={`text-xs font-medium ${themeClasses.text} md:hidden`}
                  >
                    {language === "Français" ? "FR" : "EN"}
                  </span>
                  {isLanguageDropdownOpen ? (
                    <IoIosArrowUp
                      className={`w-3 h-3 ${themeClasses.textSecondary} hidden sm:block`}
                    />
                  ) : (
                    <IoIosArrowDown
                      className={`w-3 h-3 ${themeClasses.textSecondary} hidden sm:block`}
                    />
                  )}
                </button>

                {isLanguageDropdownOpen && (
                  <div
                    className={`absolute top-12 sm:top-14 right-0 ${themeClasses.dropdown} rounded-xl sm:rounded-2xl shadow-2xl border overflow-hidden z-50 min-w-[140px] sm:min-w-[160px] animate-in slide-in-from-top-2 duration-300`}
                  >
                    {[
                      { key: "Français", flag: "fr.jpeg", label: "Français" },
                      { key: "English", flag: "en.jpeg", label: "English" },
                    ].map((lang) => (
                      <button
                        key={lang.key}
                        className={`flex items-center w-full px-3 sm:px-4 py-2.5 sm:py-3 ${themeClasses.dropdownItem} text-xs sm:text-sm font-medium transition-all duration-200 ${themeClasses.text} hover:scale-105 active:scale-95`}
                        onClick={() => {
                          setLanguage(lang.key);
                          setIsLanguageDropdownOpen(false);
                        }}
                      >
                        <div className="mr-2 sm:mr-3 overflow-hidden rounded-sm transition-transform duration-200 hover:scale-110">
                          <img
                            src={require(`../assets/images/${lang.flag}`)}
                            alt={lang.label}
                            className="w-4 h-4 object-cover"
                          />
                        </div>
                        {lang.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Auth Buttons - Desktop only (xl and up) */}
              <div className="hidden xl:flex items-center space-x-2 2xl:space-x-3">
                <button
                  onClick={() => navigate("/schoolchat/login")}
                  className={`px-4 2xl:px-5 py-2 2xl:py-2.5 ${themeClasses.text} ${themeClasses.textHover} font-medium text-sm 2xl:text-base transition-all duration-300 rounded-lg 2xl:rounded-xl ${themeClasses.button}`}
                >
                  Connexion
                </button>
                <button
                  onClick={() => navigate("/schoolchat/signup")}
                  className="px-4 2xl:px-5 py-2 2xl:py-2.5 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white font-medium text-sm 2xl:text-base rounded-lg 2xl:rounded-xl hover:from-blue-700 hover:via-blue-800 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:scale-95"
                >
                  Inscription
                </button>
              </div>

              {/* Mobile Menu Toggle - Visible on tablet and mobile */}
              <button
                className={`xl:hidden p-2 sm:p-2.5 rounded-lg sm:rounded-xl ${themeClasses.button} transition-all duration-300 menu-toggle group`}
                onClick={() => setOpen(!open)}
                aria-label="Toggle menu"
              >
                <div className="w-5 h-5 flex flex-col justify-center items-center">
                  {open ? (
                    <HiX
                      className={`w-5 h-5 ${
                        theme === "dark" ? "text-white" : "text-gray-700"
                      } group-hover:rotate-90 transition-transform duration-300`}
                    />
                  ) : (
                    <HiOutlineMenuAlt3
                      className={`w-5 h-5 ${
                        theme === "dark" ? "text-white" : "text-gray-700"
                      } group-hover:scale-110 transition-transform duration-300`}
                    />
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Mobile Navigation - Responsive design */}
          <div
            className={`xl:hidden mobile-menu transition-all duration-500 ease-out ${
              open
                ? "max-h-[70vh] opacity-100 pb-4 sm:pb-6"
                : "max-h-0 opacity-0 overflow-hidden"
            }`}
          >
            <div className="pt-4 sm:pt-6 space-y-2 sm:space-y-3">
              {LinkData.map((link) =>
                link.isSelect ? (
                  <div key={link.id} className="px-2 sm:px-4 py-1 sm:py-2">
                    <select
                      value=""
                      className={`w-full ${themeClasses.select} font-medium text-sm sm:text-base px-3 sm:px-4 py-3 sm:py-4 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300`}
                      onChange={handleSelectChange}
                    >
                      <option value="">{selectedProduct}</option>
                      {link.options.map((option) => (
                        <option key={option.id} value={option.url}>
                          {option.title}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div key={link.id} className="px-2 sm:px-4">
                    <NavLink
                      className={({ isActive }) =>
                        `block px-3 sm:px-4 py-3 sm:py-4 font-medium text-sm sm:text-base rounded-lg sm:rounded-xl transition-all duration-300 ${
                          isActive
                            ? `${
                                theme === "dark"
                                  ? "bg-blue-900/30"
                                  : "bg-blue-50"
                              } ${
                                themeClasses.textActive
                              } border-l-4 border-blue-600 scale-105`
                            : `${themeClasses.text} ${themeClasses.button} ${themeClasses.textHover} hover:scale-105 active:scale-95`
                        }`
                      }
                      to={link.url}
                      onClick={(e) => {
                        if (!existingRoutes.includes(link.url)) {
                          e.preventDefault();
                          handleNavClick(link.url);
                        } else {
                          setOpen(false);
                        }
                      }}
                    >
                      {link.title}
                    </NavLink>
                  </div>
                )
              )}

              {/* Mobile Auth Buttons */}
              <div
                className={`px-2 sm:px-4 pt-4 sm:pt-6 space-y-3 sm:space-y-4 border-t ${
                  theme === "dark" ? "border-gray-700/50" : "border-gray-200/50"
                }`}
              >
                <button
                  onClick={() => {
                    navigate("/schoolchat/login");
                    setOpen(false);
                  }}
                  className={`w-full px-3 sm:px-4 py-3 sm:py-4 ${themeClasses.text} ${themeClasses.textHover} font-medium text-sm sm:text-base text-left rounded-lg sm:rounded-xl ${themeClasses.button} transition-all duration-300 hover:scale-105 active:scale-95`}
                >
                  Connexion
                </button>
                <button
                  onClick={() => {
                    navigate("/schoolchat/signup");
                    setOpen(false);
                  }}
                  className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white font-medium text-sm sm:text-base rounded-lg sm:rounded-xl hover:from-blue-700 hover:via-blue-800 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:scale-95"
                >
                  Inscription
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer to prevent content from being hidden behind fixed header */}
      <div className="h-16 sm:h-18 md:h-20 lg:h-24 xl:h-28"></div>
    </>
  );
};
