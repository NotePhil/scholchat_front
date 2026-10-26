import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "../hooks/useTranslation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faCircleCheck,
  faClock,
  faEnvelope,
  faExpand,
  faLocationDot,
  faMessage,
  faPaperPlane,
  faPhone,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import {
  faFacebook,
  faInstagram,
  faLinkedin,
  faXTwitter,
} from "@fortawesome/free-brands-svg-icons";
const Contact = ({ theme }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const getThemeClasses = () => {
    switch (theme) {
      case "dark":
        return {
          bg: "bg-gray-900",
          text: "text-gray-200",
          cardBg: "bg-gray-800",
          border: "border-gray-700",
          inputBg: "bg-gray-700",
          inputText: "text-gray-100",
          subtext: "text-gray-400",
          accent: "bg-blue-900/30",
        };
      case "light":
        return {
          bg: "bg-gray-50",
          text: "text-gray-800",
          cardBg: "bg-white",
          border: "border-gray-200",
          inputBg: "bg-white",
          inputText: "text-gray-900",
          subtext: "text-gray-600",
          accent: "bg-blue-50",
        };
      default:
        return {
          bg: "bg-gray-900",
          text: "text-gray-200",
          cardBg: "bg-gray-800",
          border: "border-gray-700",
          inputBg: "bg-gray-700",
          inputText: "text-gray-100",
          subtext: "text-gray-400",
          accent: "bg-blue-900/30",
        };
    }
  };
  const themeClasses = getThemeClasses();
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    setIsSubmitted(true);

    // Reset form after 3 seconds
    setTimeout(() => {
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
      setIsSubmitted(false);
    }, 3000);
  };
  const contactInfo = [
    {
      icon: <FontAwesomeIcon icon={faEnvelope} className="w-6 h-6" />,
      title: t("pages.contact.info.email.title"),
      value: t("pages.contact.info.email.value"),
      link: "mailto:contact@schoolchat.com",
      color: "text-blue-500",
    },
    {
      icon: <FontAwesomeIcon icon={faPhone} className="w-6 h-6" />,
      title: t("pages.contact.info.phone.title"),
      value: t("pages.contact.info.phone.value"),
      link: "tel:+1234567890",
      color: "text-green-500",
    },
    {
      icon: <FontAwesomeIcon icon={faLocationDot} className="w-6 h-6" />,
      title: t("pages.contact.info.address.title"),
      value: t("pages.contact.info.address.value"),
      color: "text-red-500",
    },
    {
      icon: <FontAwesomeIcon icon={faClock} className="w-6 h-6" />,
      title: t("pages.contact.info.hours.title"),
      value: t("pages.contact.info.hours.value"),
      color: "text-purple-500",
    },
  ];
  const socialLinks = [
    {
      icon: (
        <FontAwesomeIcon icon={faLinkedin} className="w-4 h-4 sm:w-5 sm:h-5" />
      ),
      name: "LinkedIn",
      url: "https://linkedin.com/company/scholchat",
      color: "hover:text-blue-600",
    },
    {
      icon: (
        <FontAwesomeIcon icon={faXTwitter} className="w-4 h-4 sm:w-5 sm:h-5" />
      ),
      name: "Twitter",
      url: "https://twitter.com/scholchat",
      color: "hover:text-sky-500",
    },
    {
      icon: (
        <FontAwesomeIcon icon={faFacebook} className="w-4 h-4 sm:w-5 sm:h-5" />
      ),
      name: "Facebook",
      url: "https://facebook.com/scholchat",
      color: "hover:text-blue-700",
    },
    {
      icon: (
        <FontAwesomeIcon icon={faInstagram} className="w-4 h-4 sm:w-5 sm:h-5" />
      ),
      name: "Instagram",
      url: "https://instagram.com/scholchat",
      color: "hover:text-pink-600",
    },
  ];
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        y: -20,
      }}
      transition={{
        duration: 0.4,
        ease: "easeOut",
      }}
      className={`py-20 ${themeClasses.bg} min-h-screen`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <motion.div
          className="text-center mb-16"
          initial={{
            opacity: 0,
            y: -20,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.6,
          }}
        >
          <div className="inline-block px-4 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-semibold tracking-wide uppercase mb-6">
            {t("pages.contact.badge")}
          </div>
          <h1
            className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 ${themeClasses.text} break-words hyphens-auto`}
          >
            {t("pages.contact.title")}
          </h1>
          <p
            className={`text-base sm:text-xl max-w-3xl mx-auto ${themeClasses.subtext} leading-relaxed`}
          >
            {t("pages.contact.subtitle")}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Contact Info Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:col-span-3">
            {contactInfo.map((info, index) => (
              <motion.a
                key={index}
                href={info.link}
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                viewport={{
                  once: true,
                }}
                transition={{
                  delay: index * 0.1,
                }}
                whileHover={{
                  y: -5,
                  scale: 1.02,
                }}
                className={`p-6 rounded-2xl ${themeClasses.cardBg} border ${themeClasses.border} shadow-lg hover:shadow-xl transition-all duration-300 group`}
              >
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${info.bgColor} flex items-center justify-center mb-4 ${info.color} group-hover:scale-110 transition-transform`}
                >
                  {info.icon}
                </div>
                <h3
                  className={`text-base sm:text-lg font-bold mb-2 ${themeClasses.text} break-words`}
                >
                  {info.title}
                </h3>
                <p
                  className={`${themeClasses.subtext} text-sm leading-relaxed break-words`}
                >
                  {info.value}
                </p>
              </motion.a>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div
            initial={{
              opacity: 0,
              x: -20,
            }}
            whileInView={{
              opacity: 1,
              x: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: 0.6,
            }}
            className={`p-8 rounded-3xl ${themeClasses.cardBg} border ${themeClasses.border} shadow-xl`}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faMessage}
                  className="w-5 h-5 text-white"
                />
              </div>
              <h2 className={`text-2xl font-bold ${themeClasses.text}`}>
                {t("pages.contact.form.title")}
              </h2>
            </div>

            {isSubmitted ? (
              <motion.div
                initial={{
                  scale: 0.8,
                  opacity: 0,
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                }}
                className="py-12 text-center"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faCircleCheck}
                    className="w-10 h-10 text-green-500"
                  />
                </div>
                <h3 className={`text-2xl font-bold mb-2 ${themeClasses.text}`}>
                  {t("pages.contact.form.successTitle")}
                </h3>
                <p className={themeClasses.subtext}>
                  {t("pages.contact.form.successMessage")}
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    className={`block text-sm font-semibold mb-2 ${themeClasses.text}`}
                  >
                    {t("pages.contact.form.name")}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 rounded-xl ${themeClasses.inputBg} ${themeClasses.inputText} border ${themeClasses.border} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                    placeholder={t("pages.contact.form.namePlaceholder")}
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-semibold mb-2 ${themeClasses.text}`}
                  >
                    {t("pages.contact.form.email")}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 rounded-xl ${themeClasses.inputBg} ${themeClasses.inputText} border ${themeClasses.border} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                    placeholder={t("pages.contact.form.emailPlaceholder")}
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-semibold mb-2 ${themeClasses.text}`}
                  >
                    {t("pages.contact.form.subject")}
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 rounded-xl ${themeClasses.inputBg} ${themeClasses.inputText} border ${themeClasses.border} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                    placeholder={t("pages.contact.form.subjectPlaceholder")}
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-semibold mb-2 ${themeClasses.text}`}
                  >
                    {t("pages.contact.form.message")}
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="5"
                    className={`w-full px-4 py-3 rounded-xl ${themeClasses.inputBg} ${themeClasses.inputText} border ${themeClasses.border} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none`}
                    placeholder={t("pages.contact.form.messagePlaceholder")}
                  />
                </div>

                <motion.button
                  whileHover={{
                    scale: 1.02,
                  }}
                  whileTap={{
                    scale: 0.98,
                  }}
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base whitespace-normal h-auto min-h-[44px]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t("pages.contact.form.sending")}
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon
                        icon={faPaperPlane}
                        className="w-5 h-5"
                      />
                      {t("pages.contact.form.send")}
                    </>
                  )}
                </motion.button>
              </form>
            )}
          </motion.div>

          {/* Map & Social Links */}
          <motion.div
            initial={{
              opacity: 0,
              x: 20,
            }}
            whileInView={{
              opacity: 1,
              x: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: 0.6,
            }}
            className="space-y-8"
          >
            {/* Interactive Map Preview */}
            <div
              className={`p-4 rounded-3xl ${themeClasses.cardBg} border ${themeClasses.border} shadow-xl overflow-hidden group`}
            >
              <div className="relative aspect-video rounded-2xl overflow-hidden">
                {/* Map Preview */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d254825.45263180394!2d9.547863!3d4.0510563!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x10610d0d64b0c1e1%3A0x9c6c72c6e1e6f0d0!2sDouala%2C%20Cameroon!5e0!3m2!1sen!2s!4v1707328800000!5m2!1sen!2s"
                    width="100%"
                    height="100%"
                    style={{
                      border: 0,
                    }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={t("pages.contact.map.title")}
                  />
                </div>

                {/* Expand Button Overlay */}
                <motion.button
                  onClick={() => setShowMapModal(true)}
                  whileHover={{
                    scale: 1.05,
                  }}
                  whileTap={{
                    scale: 0.95,
                  }}
                  className="absolute bottom-4 right-4 px-3 py-1.5 sm:px-4 sm:py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-lg shadow-lg font-semibold flex items-center gap-2 hover:shadow-xl transition-all z-10 text-xs sm:text-sm"
                >
                  <FontAwesomeIcon
                    icon={faExpand}
                    className="w-3 h-3 sm:w-4 sm:h-4"
                  />
                  {t("pages.contact.map.expand")}
                </motion.button>
              </div>
            </div>

            <div
              className={`p-4 sm:p-8 rounded-3xl ${themeClasses.cardBg} border ${themeClasses.border} shadow-xl`}
            >
              <h3
                className={`text-base sm:text-lg font-bold mb-4 sm:mb-6 ${themeClasses.text} border-b ${themeClasses.border} pb-3`}
              >
                {t("pages.contact.social.title")}
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:gap-4">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={index}
                    href={social.url}
                    onClick={(e) => {
                      if (social.url === "#") e.preventDefault();
                    }}
                    whileHover={{
                      scale: 1.02,
                      x: 5,
                    }}
                    whileTap={{
                      scale: 0.98,
                    }}
                    className={`flex items-center justify-between p-3 sm:p-4 rounded-xl ${themeClasses.accent} border ${themeClasses.border} ${themeClasses.subtext} ${social.color} transition-all duration-300 cursor-pointer group`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        {social.icon}
                      </div>
                      <span className="font-bold text-sm sm:text-base">
                        {social.name}
                      </span>
                    </div>
                    <FontAwesomeIcon
                      icon={faArrowRight}
                      className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                    />
                  </motion.a>
                ))}
              </div>
            </div>

            {/* FAQ Link */}
            <motion.div
              whileHover={{
                scale: 1.02,
              }}
              className={`p-6 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl cursor-pointer`}
            >
              <h3 className="text-lg font-bold mb-2">
                {t("pages.contact.faq.title")}
              </h3>
              <p className="text-blue-100 mb-4 text-sm sm:text-base">
                {t("pages.contact.faq.description")}
              </p>
              <button className="px-4 py-1.5 sm:px-6 sm:py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-xs sm:text-sm">
                {t("pages.contact.faq.button")}
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Map Modal */}
      {showMapModal && (
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
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowMapModal(false)}
        >
          <motion.div
            initial={{
              scale: 0.9,
              opacity: 0,
            }}
            animate={{
              scale: 1,
              opacity: 1,
            }}
            exit={{
              scale: 0.9,
              opacity: 0,
            }}
            transition={{
              type: "spring",
              duration: 0.5,
            }}
            className={`relative w-full max-w-6xl h-[80vh] ${themeClasses.cardBg} rounded-3xl overflow-hidden shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className={`flex items-center justify-between p-6 border-b ${themeClasses.border}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faLocationDot}
                    className="w-5 h-5 text-white"
                  />
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${themeClasses.text}`}>
                    {t("pages.contact.map.modalTitle")}
                  </h3>
                  <p className={`text-sm ${themeClasses.subtext}`}>
                    {t("pages.contact.info.address.value")}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{
                  scale: 1.1,
                  rotate: 90,
                }}
                whileTap={{
                  scale: 0.9,
                }}
                onClick={() => setShowMapModal(false)}
                className={`w-10 h-10 rounded-full ${themeClasses.accent} border ${themeClasses.border} flex items-center justify-center ${themeClasses.text} hover:bg-red-500 hover:text-white transition-colors`}
              >
                <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
              </motion.button>
            </div>

            {/* 3D Interactive Map */}
            <div className="w-full h-[calc(100%-88px)]">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d254825.45263180394!2d9.547863!3d4.0510563!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x10610d0d64b0c1e1%3A0x9c6c72c6e1e6f0d0!2sDouala%2C%20Cameroon!5e0!3m2!1sen!2s!4v1707328800000!5m2!1sen!2s&maptype=satellite"
                width="100%"
                height="100%"
                style={{
                  border: 0,
                }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={t("pages.contact.map.title")}
              />
            </div>

            {/* Quick Info Footer */}
            <div
              className={`absolute bottom-6 left-6 right-6 ${themeClasses.cardBg} rounded-2xl p-4 shadow-xl border ${themeClasses.border} backdrop-blur-sm bg-opacity-95`}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon
                    icon={faLocationDot}
                    className="w-5 h-5 text-red-500"
                  />
                  <div>
                    <p className={`text-xs ${themeClasses.subtext}`}>
                      {t("pages.contact.info.address.title")}
                    </p>
                    <p className={`text-sm font-semibold ${themeClasses.text}`}>
                      {t("pages.contact.info.address.value")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon
                    icon={faPhone}
                    className="w-5 h-5 text-green-500"
                  />
                  <div>
                    <p className={`text-xs ${themeClasses.subtext}`}>
                      {t("pages.contact.info.phone.title")}
                    </p>
                    <p className={`text-sm font-semibold ${themeClasses.text}`}>
                      {t("pages.contact.info.phone.value")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon
                    icon={faClock}
                    className="w-5 h-5 text-purple-500"
                  />
                  <div>
                    <p className={`text-xs ${themeClasses.subtext}`}>
                      {t("pages.contact.info.hours.title")}
                    </p>
                    <p className={`text-sm font-semibold ${themeClasses.text}`}>
                      {t("pages.contact.info.hours.value")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};
export default Contact;
