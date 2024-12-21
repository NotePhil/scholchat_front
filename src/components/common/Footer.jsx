import React from "react";
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
  return (
    <>
      <style>
        {`
        .app {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          background-color: #007BFF;
          color: white;
          margin: 2rem auto;
          padding: 2rem;
          border-radius: 1rem;
        }

        .app .left {
          flex: 1 1 60%;
        }

        .app .right {
          flex: 1 1 40%;
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .app .box {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border: 1px solid white;
          border-radius: 0.5rem;
          cursor: pointer;
        }

        .app .box:hover {
          background-color: white;
          color: #007BFF;
        }

        footer {
          background-color: #f3f4f8;
          padding: 4rem 1rem;
        }

        footer .container {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
        }

        footer h4 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          color: #000;
        }

        footer p {
          font-size: 1rem;
          color: #555;
        }

        footer .logo img {
          display: block;
          margin: 0 auto 1rem;
        }

        footer .flex {
          display: flex;
          justify-content: center;
          gap: 1rem;
        }

        footer .flex a {
          color: #555;
          transition: color 0.3s;
        }

        footer .flex a:hover {
          color: #007BFF;
        }

        @media (max-width: 768px) {
          .app {
            flex-direction: column;
            text-align: center;
          }

          .app .left,
          .app .right {
            flex: 1 1 100%;
          }

          footer .container {
            grid-template-columns: 1fr;
            text-align: center;
          }

          footer h4 {
            font-size: 1.25rem;
          }

          footer p {
            font-size: 0.875rem;
          }

          footer .flex {
            justify-content: center;
          }
        }
      `}
      </style>

      {/* App Download Section */}
      <section className="app">
        <div className="left">
          <h1 className="text-3xl md:text-2xl font-bold">
            Restez Connecté avec Votre Communauté Scolaire !
          </h1>
          <p className="mt-4 text-base md:text-sm text-gray-200">
            Téléchargez l'application ScholChat pour rejoindre les discussions,
            accéder aux ressources, et rester informé des actualités scolaires.
          </p>
        </div>
        {/* <div className="right">
          <div className="box">
            <BsApple size={24} />
            <span>App Store</span>
          </div>
          <div className="box">
            <BsGooglePlay size={24} />
            <span>Play Store</span>
          </div>
        </div> */}
      </section>

      {/* Footer Section */}
      <footer>
        <div className="container">
          {/* Logo and About Section */}
          <div className="logo">
            <img src={logImg} alt="Logo ScholChat" />
            <p>
              ScholChat réunit les étudiants, enseignants, et parents dans une
              application sécurisée, facilitant la communication et l'engagement
              scolaire.
            </p>
          </div>

          {/* Contact Section */}
          <div>
            <h4>Contact</h4>
            <p>
              Vous avez des questions ou besoin de support ? Notre équipe est là
              pour vous aider.
            </p>
            <NavLink to="#" className="text-primary font-semibold block mt-4">
              Nous Contacter
            </NavLink>
          </div>

          {/* Mentions Légales Section */}
          <div>
            <h4>Mentions Légales</h4>
            <p>
              ScholChat respecte votre vie privée et garantit un environnement
              en ligne sécurisé.
            </p>
            <NavLink to="#" className="text-primary font-semibold block mt-4">
              Politique de Confidentialité
            </NavLink>
            <NavLink to="#" className="text-primary font-semibold block">
              Conditions Générales
            </NavLink>
          </div>

          {/* Suivez-nous Section */}
          <div>
            <h4>Suivez-nous</h4>
            <p>
              Suivez-nous sur les réseaux sociaux pour rester informé des
              dernières actualités.
            </p>
            <div className="flex">
              <a href="https://facebook.com">
                <BsFacebook size={28} />
              </a>
              <a href="https://twitter.com">
                <BsTwitter size={28} />
              </a>
              <a href="https://instagram.com">
                <BsInstagram size={28} />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
