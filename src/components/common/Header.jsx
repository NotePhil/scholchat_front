import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LogoImg from "../assets/images/logoscholchat.png";
import { LinkData } from "../assets/data/dummydata";
import { NavLink } from "react-router-dom";
import { HiOutlineMenuAlt1 } from "react-icons/hi";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";

export const Header = () => {
  const [open, setOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("Nos produits");
  const [language, setLanguage] = useState("Français");
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSelectChange = (e) => {
    const selectedOption = e.target.options[e.target.selectedIndex].text;
    setSelectedProduct(selectedOption);
    const url = e.target.value;
    if (url) {
      navigate(url);
    }
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

  return (
    <header className="bg-white py-5 text-black sticky z-50 shadow-md top-0 left-0 w-full">
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Logo Only (Increased Logo Size) */}
        <div className="flex items-center gap-1">
          <img src={LogoImg} alt="Scholchat logo" className="h-32 w-24" />
        </div>

        {/* Navigation Links */}
        <nav className={open ? "mobile-view" : "desktop-view"}>
          <ul className="flex items-center gap-8">
            {LinkData.map((link) =>
              link.isSelect ? (
                <li key={link.id} onClick={() => setOpen(null)}>
                  <select
                    value=""
                    className="text-[16px] cursor-pointer bg-white px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary transition duration-150 ease-in-out"
                    onChange={handleSelectChange}
                  >
                    <option value="">{selectedProduct}</option>
                    {link.options.map((option) => (
                      <option key={option.id} value={option.url}>
                        {option.title}
                      </option>
                    ))}
                  </select>
                </li>
              ) : (
                <li key={link.id} onClick={() => setOpen(null)}>
                  <NavLink
                    className={({ isActive }) =>
                      isActive
                        ? "text-primary font-semibold text-[16px]"
                        : "text-gray-700 font-semibold text-[16px]"
                    }
                    to={link.url}
                  >
                    {link.title}
                  </NavLink>
                </li>
              )
            )}
          </ul>
        </nav>

        {/* Connexion / Inscription Button and Language Selector at the Right */}
        <div className="account flex items-center gap-6">
          <div className="flex items-center bg-teal-500 text-white font-semibold px-4 py-2 rounded-full shadow-md hover:bg-teal-600 transition cursor-pointer">
            {/* Connexion Button */}
            <span
              onClick={() => navigate("/login")}
              className="cursor-pointer font-semibold text-md"
            >
              Connexion
            </span>
            <span className="text-gray-700 font-semibold mx-2">/</span>
            {/* Inscription Button */}
            <span
              onClick={() => navigate("/signup")}
              className="cursor-pointer font-semibold text-md"
            >
              Inscription
            </span>
          </div>

          {/* Language Selector */}
          <div className="relative">
            <button
              className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm focus:outline-none"
              onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
            >
              <img
                src={
                  language === "Français"
                    ? require("../assets/images/fr.jpeg")
                    : require("../assets/images/en.jpeg")
                }
                alt={language}
                className="w-6 h-6 mr-2"
              />
              <span className="text-gray-700 font-medium text-md mr-1">
                {language}
              </span>
              {isLanguageDropdownOpen ? (
                <IoIosArrowUp className="text-gray-700" />
              ) : (
                <IoIosArrowDown className="text-gray-700" />
              )}
            </button>

            {/* Language Dropdown */}
            {isLanguageDropdownOpen && (
              <div className="absolute top-12 right-0 bg-white rounded-md shadow-lg overflow-hidden z-50">
                <button
                  className="flex items-center w-full px-4 py-2 hover:bg-gray-100 text-md"
                  onClick={() => {
                    setLanguage("Français");
                    setIsLanguageDropdownOpen(false);
                  }}
                >
                  <img
                    src={require("../assets/images/fr.jpeg")}
                    alt="Français"
                    className="w-5 h-5 mr-2"
                  />
                  Français
                </button>
                <button
                  className="flex items-center w-full px-4 py-2 hover:bg-gray-100 text-md"
                  onClick={() => {
                    setLanguage("English");
                    setIsLanguageDropdownOpen(false);
                  }}
                >
                  <img
                    src={require("../assets/images/en.jpeg")}
                    alt="English"
                    className="w-5 h-5 mr-2"
                  />
                  English
                </button>
              </div>
            )}
          </div>

          <button className="open-menu" onClick={() => setOpen(!open)}>
            <HiOutlineMenuAlt1 size={28} className="text-gray-600" />
          </button>
        </div>
      </div>
    </header>
  );
};

