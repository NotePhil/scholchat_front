import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LogoImg from "../assets/images/logo.png";
import { NavLink } from "react-router-dom";
import { HiOutlineMenuAlt3, HiX } from "react-icons/hi";
import { IoIosArrowDown } from "react-icons/io";
import { FiSun, FiMoon } from "react-icons/fi";
import { useTranslation } from "../../hooks/useTranslation";

export const Header = ({ theme, setTheme }) => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [productsDropdown, setProductsDropdown] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, changeLanguage } = useTranslation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { name: t("navigation.home"), path: "/" },
    { name: t("navigation.about"), path: "/schoolchat/about" },
    { 
      name: t("navigation.products"), 
      path: "/schoolchat/courses",
      hasDropdown: true,
      dropdownItems: [
        { name: t("navigation.pricing"), path: "/schoolchat/functionalities" },
        { name: t("navigation.nurseries"), path: "/schoolchat/instructor" },
        { name: t("navigation.kindergartens"), path: "/schoolchat/courses" },
        { name: t("navigation.primarySchools"), path: "/schoolchat/courses" },
        { name: t("navigation.highSchools"), path: "/schoolchat/courses" }
      ]
    },
    { name: t("navigation.faq"), path: "/schoolchat/blog" },
  ];

  const getHeaderClasses = () => {
    const baseClasses = "fixed top-0 left-0 w-full z-50 transition-all duration-300";
    if (scrolled) {
      return `${baseClasses} bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/20`;
    }
    return `${baseClasses} bg-white/80 backdrop-blur-sm`;
  };

  return (
    <>
      <header className={getHeaderClasses()}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center">
              <img
                src={LogoImg}
                alt="SchoolChat"
                className="h-16 w-auto cursor-pointer hover:scale-105 transition-transform duration-200"
                onClick={() => navigate("/")}
              />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                item.hasDropdown ? (
                  <div 
                    key={item.path}
                    className="relative"
                    onMouseEnter={() => setProductsDropdown(true)}
                    onMouseLeave={() => setProductsDropdown(false)}
                  >
                    <button
                      className={`flex items-center space-x-1 text-lg font-medium transition-colors duration-200 hover:text-blue-600 ${
                        location.pathname.includes('/courses') || location.pathname.includes('/functionalities') || location.pathname.includes('/instructor') ? "text-blue-600" : "text-gray-700"
                      }`}
                    >
                      <span>{item.name}</span>
                      <IoIosArrowDown className={`w-4 h-4 transition-transform duration-200 ${
                        productsDropdown ? 'rotate-180' : ''
                      }`} />
                    </button>
                    
                    {productsDropdown && (
                      <div 
                        className="absolute top-full left-0 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                      >
                        {item.dropdownItems.map((dropdownItem) => (
                          <a
                            key={dropdownItem.path}
                            href={dropdownItem.path}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors duration-200"
                            onClick={() => setProductsDropdown(false)}
                          >
                            {dropdownItem.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `text-lg font-medium transition-colors duration-200 hover:text-blue-600 ${
                        isActive ? "text-blue-600" : "text-gray-700"
                      }`
                    }
                  >
                    {item.name}
                  </NavLink>
                )
              ))}
            </nav>

            {/* Right Side Actions */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                {theme === "dark" ? (
                  <FiSun className="w-6 h-6 text-gray-600" />
                ) : (
                  <FiMoon className="w-6 h-6 text-gray-600" />
                )}
              </button>

              {/* Language Toggle */}
              <button
                onClick={() => changeLanguage(language === "fr" ? "en" : "fr")}
                className="px-4 py-2 text-lg font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                {language === "fr" ? "EN" : "FR"}
              </button>

              {/* Auth Buttons */}
              <NavLink
                to="/schoolchat/login"
                className={({ isActive }) =>
                  `px-6 py-3 text-lg font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  }`
                }
              >
                {t("auth.login.signIn")}
              </NavLink>
              <NavLink
                to="/schoolchat/signup"
                className={({ isActive }) =>
                  `px-6 py-3 text-lg font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`
                }
              >
                {t("auth.login.signUp")}
              </NavLink>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              onClick={() => setOpen(!open)}
            >
              {open ? (
                <HiX className="w-6 h-6 text-gray-600" />
              ) : (
                <HiOutlineMenuAlt3 className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {open && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="space-y-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `block px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                        isActive
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700 hover:bg-gray-50"
                      }`
                    }
                    onClick={() => setOpen(false)}
                  >
                    {item.name}
                  </NavLink>
                ))}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <NavLink
                    to="/schoolchat/login"
                    className={({ isActive }) =>
                      `block px-4 py-3 text-lg font-medium rounded-lg transition-all duration-200 ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:bg-gray-50"
                      }`
                    }
                    onClick={() => setOpen(false)}
                  >
                    {t("auth.login.signIn")}
                  </NavLink>
                  <NavLink
                    to="/schoolchat/signup"
                    className={({ isActive }) =>
                      `block px-4 py-3 text-lg font-medium rounded-lg mt-2 transition-all duration-200 ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`
                    }
                    onClick={() => setOpen(false)}
                  >
                    {t("auth.login.signUp")}
                  </NavLink>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Spacer */}
      <div className="h-20"></div>
    </>
  );
};