import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LogoImg from "../assets/images/logo.png";
import { LinkData } from "../assets/data/dummydata";
import { NavLink } from "react-router-dom";
import { HiOutlineMenuAlt3, HiX } from "react-icons/hi";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { FiGlobe, FiSun, FiMoon } from "react-icons/fi";
import { useTranslation } from "../../hooks/useTranslation";

export const Header = ({ theme, setTheme }) => {
  const [open, setOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const [isProductsDropdownOpen, setIsProductsDropdownOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, changeLanguage } = useTranslation();
  const productsDropdownRef = useRef(null);

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

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleProductClick = (url) => {
    if (url && existingRoutes.includes(url)) {
      navigate(url);
    } else if (url) {
      navigate("/");
    }
    setIsProductsDropdownOpen(false);
    setMobileProductsOpen(false);
    setOpen(false);
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
    const handleClickOutside = (event) => {
      if (productsDropdownRef.current && !productsDropdownRef.current.contains(event.target)) {
        setIsProductsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getNavTitle = (linkTitle) => {
    const titleMap = {
      "accueil": t("navigation.home"),
      "À propos": t("navigation.about"),
      "Nos produits": t("navigation.products"),
      "FAQ": t("navigation.faq")
    };
    return titleMap[linkTitle] || linkTitle;
  };

  const getOptionTitle = (optionTitle) => {
    const optionMap = {
      "Nos tarifs": t("navigation.pricing"),
      "Crèches": t("navigation.nurseries"),
      "écoles maternelles": t("navigation.kindergartens"),
      "écoles primaires": t("navigation.primarySchools"),
      "lycées": t("navigation.highSchools")
    };
    return optionMap[optionTitle] || optionTitle;
  };

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
        return language === "fr" ? "Sombre" : "Dark";
      case "light":
        return language === "fr" ? "Clair" : "Light";
      default:
        return "Auto";
    }
  };

  const isLoginActive = location.pathname === "/schoolchat/login";
  const isSignupActive = location.pathname === "/schoolchat/signup";

  return (
    <>
      <div
        className="fixed top-2 sm:top-3 md:top-4 left-2 sm:left-4 md:left-6 lg:left-8 z-[60] cursor-pointer group"
        onClick={handleLogoClick}
      >
        <img
          src={LogoImg}
          alt="Scholchat"
          className={`h-20 sm:h-24 md:h-28 lg:h-32 xl:h-36 w-auto object-contain transition-all duration-300 ${themeClasses.logo} group-hover:scale-110 group-hover:brightness-110 drop-shadow-lg`}
        />
      </div>

      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ease-out ${themeClasses.header}`}
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex justify-between items-center h-20 sm:h-24 md:h-28 lg:h-32 xl:h-36">
            <div className="flex-shrink-0 w-20 sm:w-24 md:w-28 lg:w-32 xl:w-36"></div>

            <nav className="hidden xl:flex items-center space-x-3 2xl:space-x-5">
              {LinkData.map((link) =>
                link.isSelect ? (
                  <div 
                    key={link.id} 
                    className="relative"
                    ref={productsDropdownRef}
                    onMouseEnter={() => setIsProductsDropdownOpen(true)}
                    onMouseLeave={() => setIsProductsDropdownOpen(false)}
                  >
                    <button
                      className={`flex items-center space-x-2 px-4 2xl:px-5 py-3 2xl:py-4 font-semibold text-base 2xl:text-lg transition-all duration-300 rounded-lg ${themeClasses.text} ${themeClasses.textHover} ${themeClasses.button} group`}
                    >
                      <span>{getNavTitle(link.title)}</span>
                      <IoIosArrowDown
                        className={`w-5 h-5 transition-transform duration-300 ${
                          isProductsDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    
                    <div
                      className={`absolute top-full left-0 mt-2 w-64 ${themeClasses.dropdown} rounded-xl shadow-2xl border overflow-hidden z-50 transition-all duration-300 origin-top ${
                        isProductsDropdownOpen
                          ? 'opacity-100 scale-100 visible'
                          : 'opacity-0 scale-95 invisible'
                      }`}
                    >
                      {link.options.map((option, index) => (
                        <button
                          key={option.id}
                          onClick={() => handleProductClick(option.url)}
                          className={`w-full text-left px-5 py-3.5 ${themeClasses.dropdownItem} ${themeClasses.text} text-base font-semibold transition-all duration-200 hover:pl-7 ${
                            index !== link.options.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                          }`}
                        >
                          {getOptionTitle(option.title)}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <NavLink
                    key={link.id}
                    className={({ isActive }) =>
                      `relative px-4 2xl:px-5 py-3 2xl:py-4 font-semibold text-base 2xl:text-lg transition-all duration-300 rounded-lg ${
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
                        {getNavTitle(link.title)}
                        {isActive && (
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                        )}
                      </>
                    )}
                  </NavLink>
                )
              )}
            </nav>

            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
              <div className="relative theme-dropdown">
                <button
                  className={`flex items-center space-x-2 sm:space-x-2.5 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl ${themeClasses.button} transition-all duration-300 focus:outline-none group`}
                  onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                >
                  <div className="group-hover:rotate-12 transition-transform duration-300">
                    {getThemeIcon()}
                  </div>
                  <span
                    className={`text-sm sm:text-base font-semibold ${themeClasses.text} hidden md:block`}
                  >
                    {getThemeLabel()}
                  </span>
                  {isThemeDropdownOpen ? (
                    <IoIosArrowUp
                      className={`w-4 h-4 ${themeClasses.textSecondary} transition-transform duration-200 hidden sm:block`}
                    />
                  ) : (
                    <IoIosArrowDown
                      className={`w-4 h-4 ${themeClasses.textSecondary} transition-transform duration-200 hidden sm:block`}
                    />
                  )}
                </button>

                {isThemeDropdownOpen && (
                  <div
                    className={`absolute top-12 sm:top-14 right-0 ${themeClasses.dropdown} rounded-xl sm:rounded-2xl shadow-2xl border overflow-hidden z-50 min-w-[160px] sm:min-w-[180px] animate-in slide-in-from-top-2 duration-300`}
                  >
                    {[
                      {
                        key: "default",
                        labelFr: "Auto",
                        labelEn: "Auto",
                        icon: (
                          <div className="w-4 h-4 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full"></div>
                        ),
                      },
                      {
                        key: "light",
                        labelFr: "Clair",
                        labelEn: "Light",
                        icon: <FiSun className="w-4 h-4" />,
                      },
                      {
                        key: "dark",
                        labelFr: "Sombre",
                        labelEn: "Dark",
                        icon: <FiMoon className="w-4 h-4" />,
                      },
                    ].map((themeOption) => (
                      <button
                        key={themeOption.key}
                        className={`flex items-center w-full px-4 sm:px-5 py-3 sm:py-3.5 ${themeClasses.dropdownItem} text-sm sm:text-base font-semibold transition-all duration-200 ${themeClasses.text} hover:scale-105 active:scale-95`}
                        onClick={() => {
                          setTheme(themeOption.key);
                          setIsThemeDropdownOpen(false);
                        }}
                      >
                        <div className="mr-2 sm:mr-3 transition-transform duration-200 hover:rotate-12">
                          {themeOption.icon}
                        </div>
                        {language === "fr"
                          ? themeOption.labelFr
                          : themeOption.labelEn}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative language-dropdown">
                <button
                  className={`flex items-center space-x-2 sm:space-x-2.5 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl ${themeClasses.button} transition-all duration-300 focus:outline-none group`}
                  onClick={() =>
                    setIsLanguageDropdownOpen(!isLanguageDropdownOpen)
                  }
                >
                  <div className="relative overflow-hidden rounded-sm group-hover:scale-110 transition-transform duration-300">
                    <img
                      src={
                        language === "fr"
                          ? require("../assets/images/fr.jpeg")
                          : require("../assets/images/en.jpeg")
                      }
                      alt={language}
                      className="w-4 h-4 object-cover"
                    />
                  </div>
                  <span
                    className={`text-sm sm:text-base font-semibold ${themeClasses.text} hidden md:block`}
                  >
                    {language === "fr" ? "Français" : "English"}
                  </span>
                  <span
                    className={`text-sm font-semibold ${themeClasses.text} md:hidden`}
                  >
                    {language === "fr" ? "FR" : "EN"}
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
                    className={`absolute top-12 sm:top-14 right-0 ${themeClasses.dropdown} rounded-xl sm:rounded-2xl shadow-2xl border overflow-hidden z-50 min-w-[160px] sm:min-w-[180px] animate-in slide-in-from-top-2 duration-300`}
                  >
                    {[
                      { key: "fr", flag: "fr.jpeg", label: "Français" },
                      { key: "en", flag: "en.jpeg", label: "English" },
                    ].map((lang) => (
                      <button
                        key={lang.key}
                        className={`flex items-center w-full px-4 sm:px-5 py-3 sm:py-3.5 ${themeClasses.dropdownItem} text-sm sm:text-base font-semibold transition-all duration-200 ${themeClasses.text} hover:scale-105 active:scale-95`}
                        onClick={() => {
                          changeLanguage(lang.key);
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

              <div className="hidden xl:flex items-center space-x-3 2xl:space-x-4">
                <button
                  onClick={() => navigate("/schoolchat/login")}
                  className={`px-5 2xl:px-6 py-3 2xl:py-3.5 font-semibold text-base 2xl:text-lg transition-all duration-300 rounded-lg 2xl:rounded-xl ${
                    isLoginActive
                      ? "bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white shadow-lg"
                      : `${themeClasses.text} ${themeClasses.textHover} hover:bg-transparent`
                  }`}
                >
                  {t("auth.login.signIn")}
                </button>
                <button
                  onClick={() => navigate("/schoolchat/signup")}
                  className={`px-5 2xl:px-6 py-3 2xl:py-3.5 font-semibold text-base 2xl:text-lg transition-all duration-300 rounded-lg 2xl:rounded-xl ${
                    isSignupActive
                      ? "bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white shadow-lg"
                      : `${themeClasses.text} ${themeClasses.textHover} hover:bg-transparent`
                  }`}
                >
                  {t("auth.login.signUp")}
                </button>
              </div>

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
                  <div key={link.id} className="px-2 sm:px-4">
                    <button
                      onClick={() => setMobileProductsOpen(!mobileProductsOpen)}
                      className={`w-full flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4 font-medium text-sm sm:text-base rounded-lg sm:rounded-xl transition-all duration-300 ${themeClasses.text} ${themeClasses.button}`}
                    >
                      <span>{getNavTitle(link.title)}</span>
                      {mobileProductsOpen ? (
                        <IoIosArrowUp className="w-4 h-4" />
                      ) : (
                        <IoIosArrowDown className="w-4 h-4" />
                      )}
                    </button>
                    
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        mobileProductsOpen ? 'max-h-96 mt-2' : 'max-h-0'
                      }`}
                    >
                      <div className="space-y-1 pl-4">
                        {link.options.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => handleProductClick(option.url)}
                            className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-xs sm:text-sm rounded-lg transition-all duration-300 ${themeClasses.text} ${themeClasses.button} ${themeClasses.textHover} hover:scale-105 active:scale-95`}
                          >
                            {getOptionTitle(option.title)}
                          </button>
                        ))}
                      </div>
                    </div>
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
                      {getNavTitle(link.title)}
                    </NavLink>
                  </div>
                )
              )}

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
                  className={`w-full px-3 sm:px-4 py-3 sm:py-4 font-medium text-sm sm:text-base text-left rounded-lg sm:rounded-xl transition-all duration-300 ${
                    isLoginActive
                      ? "bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white shadow-lg"
                      : `${themeClasses.text} ${themeClasses.textHover} hover:bg-transparent`
                  }`}
                >
                  {t("auth.login.signIn")}
                </button>
                <button
                  onClick={() => {
                    navigate("/schoolchat/signup");
                    setOpen(false);
                  }}
                  className={`w-full px-3 sm:px-4 py-3 sm:py-4 font-medium text-sm sm:text-base rounded-lg sm:rounded-xl transition-all duration-300 ${
                    isSignupActive
                      ? "bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white shadow-lg"
                      : `${themeClasses.text} ${themeClasses.textHover} hover:bg-transparent`
                  }`}
                >
                  {t("auth.login.signUp")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="h-20 sm:h-24 md:h-28 lg:h-32 xl:h-36"></div>
    </>
  );
};
