import React, { useState, useEffect } from "react";
import logImg from "../assets/images/logo.png";
import {
  BsApple,
  BsGooglePlay,
  BsFacebook,
  BsTwitter,
  BsInstagram,
} from "react-icons/bs";
import { NavLink } from "react-router-dom";

export const Footer = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const footer = document.querySelector(".footer-container");
      if (footer) {
        const rect = footer.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <>
      <style>
        {`
        .footer-container {
          background: linear-gradient(135deg, #0f0f23 0%, #1a0b3d 50%, #2563eb 100%);
          position: relative;
          overflow: hidden;
          margin-top: 4rem;
        }

        .app-download {
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 1.5rem;
          margin: 2rem auto;
          padding: 2rem;
          max-width: 900px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          position: relative;
        }

        .app-download .left {
          flex: 1;
        }

        .app-download .left h3 {
          font-size: 1.5rem;
          font-weight: bold;
          background: linear-gradient(135deg, #06b6d4, #a855f7, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
        }

        .app-download .left p {
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
          margin: 0;
        }

        .app-download .right {
          display: flex;
          gap: 1rem;
          flex-shrink: 0;
        }

        .download-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 0.75rem;
          color: white;
          text-decoration: none;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          font-size: 0.9rem;
        }

        .download-btn:hover {
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(168, 85, 247, 0.2));
          transform: translateY(-2px);
        }

        .footer-main {
          padding: 2.5rem 1.5rem 1.5rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .footer-section h4 {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #06b6d4, #a855f7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .footer-section p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
          line-height: 1.5;
          margin-bottom: 1rem;
        }

        .footer-link {
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }

        .footer-link:hover {
          color: #06b6d4;
          transform: translateX(5px);
        }

        .logo-section {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .logo-section img {
          width: 120px;
          margin-bottom: 1rem;
          filter: brightness(1.1);
        }

        .social-links {
          display: flex;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .social-link {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.25rem;
          height: 2.25rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .social-link:hover {
          background: linear-gradient(135deg, #06b6d4, #a855f7);
          color: white;
          transform: translateY(-2px);
        }

        .footer-bottom {
          text-align: center;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .footer-bottom p {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.85rem;
          margin: 0;
        }

        .mouse-glow {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          opacity: 0.3;
        }

        @media (max-width: 768px) {
          .app-download {
            flex-direction: column;
            text-align: center;
            padding: 1.5rem;
            margin: 1rem;
          }

          .app-download .left h3 {
            font-size: 1.25rem;
          }

          .app-download .right {
            justify-content: center;
            flex-wrap: wrap;
          }

          .footer-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
            text-align: center;
          }

          .logo-section {
            align-items: center;
          }

          .social-links {
            justify-content: center;
          }

          .footer-main {
            padding: 2rem 1rem 1rem;
          }
        }

        @media (max-width: 480px) {
          .download-btn {
            padding: 0.5rem 1rem;
            font-size: 0.8rem;
          }

          .download-btn svg {
            width: 16px;
            height: 16px;
          }
        }
      `}
      </style>

      <footer className="footer-container">
        {/* Mouse Glow Effect */}
        <div
          className="mouse-glow"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(6, 182, 212, 0.15) 0%, transparent 50%)`,
          }}
        />

        {/* App Download Section */}
        <div className="app-download">
          <div className="left">
            <h3>Restez Connecté !</h3>
            <p>Téléchargez ScholChat pour une expérience éducative optimale</p>
          </div>
          <div className="right">
            <a href="#" className="download-btn">
              <BsApple size={20} />
              <span>App Store</span>
            </a>
            <a href="#" className="download-btn">
              <BsGooglePlay size={20} />
              <span>Play Store</span>
            </a>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="footer-main">
          <div className="footer-grid">
            {/* Logo and About Section */}
            <div className="footer-section logo-section">
              <img src={logImg} alt="Logo ScholChat" />
              <p>
                ScholChat réunit étudiants, enseignants et parents dans une
                plateforme sécurisée pour faciliter la communication scolaire.
              </p>
              <div className="social-links">
                <a href="https://facebook.com" className="social-link">
                  <BsFacebook size={16} />
                </a>
                <a href="https://twitter.com" className="social-link">
                  <BsTwitter size={16} />
                </a>
                <a href="https://instagram.com" className="social-link">
                  <BsInstagram size={16} />
                </a>
              </div>
            </div>

            {/* Contact Section */}
            <div className="footer-section">
              <h4>Contact</h4>
              <NavLink to="#" className="footer-link">
                Nous Contacter
              </NavLink>
              <NavLink to="#" className="footer-link">
                Support
              </NavLink>
              <NavLink to="#" className="footer-link">
                Centre d'Aide
              </NavLink>
            </div>

            {/* Legal Section */}
            <div className="footer-section">
              <h4>Légal</h4>
              <NavLink to="#" className="footer-link">
                Confidentialité
              </NavLink>
              <NavLink to="#" className="footer-link">
                Conditions
              </NavLink>
              <NavLink to="#" className="footer-link">
                Mentions Légales
              </NavLink>
            </div>

            {/* Resources Section */}
            <div className="footer-section">
              <h4>Ressources</h4>
              <NavLink to="#" className="footer-link">
                Guide Utilisateur
              </NavLink>
              <NavLink to="#" className="footer-link">
                Blog
              </NavLink>
              <NavLink to="#" className="footer-link">
                FAQ
              </NavLink>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="footer-bottom">
            <p>© 2024 ScholChat. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
