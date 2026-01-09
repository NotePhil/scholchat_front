import React from "react";
import { BsFacebook, BsTwitter, BsInstagram, BsLinkedin } from "react-icons/bs";
import { NavLink } from "react-router-dom";
import { useTranslation } from "../../hooks/useTranslation";

export const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* About Section */}
          <div>
            <h4 className="text-white font-semibold text-lg mb-4">ScholChat</h4>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              {t("footer.about.description")}
            </p>
            <div className="flex gap-3">
              <a href="https://facebook.com" className="w-10 h-10 flex items-center justify-center bg-gray-800 hover:bg-blue-600 rounded-full transition-all duration-300 hover:scale-110">
                <BsFacebook size={18} />
              </a>
              <a href="https://twitter.com" className="w-10 h-10 flex items-center justify-center bg-gray-800 hover:bg-blue-400 rounded-full transition-all duration-300 hover:scale-110">
                <BsTwitter size={18} />
              </a>
              <a href="https://instagram.com" className="w-10 h-10 flex items-center justify-center bg-gray-800 hover:bg-pink-600 rounded-full transition-all duration-300 hover:scale-110">
                <BsInstagram size={18} />
              </a>
              <a href="https://linkedin.com" className="w-10 h-10 flex items-center justify-center bg-gray-800 hover:bg-blue-700 rounded-full transition-all duration-300 hover:scale-110">
                <BsLinkedin size={18} />
              </a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-base mb-4">{t("footer.contact.title")}</h4>
            <div className="space-y-2.5">
              <NavLink to="#" className="block text-gray-400 hover:text-blue-400 text-sm transition-colors">
                {t("footer.contact.contactUs")}
              </NavLink>
              <NavLink to="#" className="block text-gray-400 hover:text-blue-400 text-sm transition-colors">
                {t("footer.contact.support")}
              </NavLink>
              <NavLink to="#" className="block text-gray-400 hover:text-blue-400 text-sm transition-colors">
                {t("footer.contact.helpCenter")}
              </NavLink>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold text-base mb-4">{t("footer.legal.title")}</h4>
            <div className="space-y-2.5">
              <NavLink to="#" className="block text-gray-400 hover:text-blue-400 text-sm transition-colors">
                {t("footer.legal.privacy")}
              </NavLink>
              <NavLink to="#" className="block text-gray-400 hover:text-blue-400 text-sm transition-colors">
                {t("footer.legal.terms")}
              </NavLink>
              <NavLink to="#" className="block text-gray-400 hover:text-blue-400 text-sm transition-colors">
                {t("footer.legal.legalNotice")}
              </NavLink>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold text-base mb-4">{t("footer.resources.title")}</h4>
            <div className="space-y-2.5">
              <NavLink to="#" className="block text-gray-400 hover:text-blue-400 text-sm transition-colors">
                {t("footer.resources.userGuide")}
              </NavLink>
              <NavLink to="#" className="block text-gray-400 hover:text-blue-400 text-sm transition-colors">
                {t("footer.resources.blog")}
              </NavLink>
              <NavLink to="#" className="block text-gray-400 hover:text-blue-400 text-sm transition-colors">
                {t("footer.resources.faq")}
              </NavLink>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 pt-6 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} ScholChat. {t("footer.copyright")}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
