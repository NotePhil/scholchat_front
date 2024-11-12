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
      {/* App Download Section */}
      <section className="app w-4/5 m-auto rounded-lg shadow-lg text-white flex md:flex-col bg-primary mt-16 relative z-10">
        <div className="left w-[60%] md:w-full p-10">
          <h1 className="text-5xl font-bold leading-tight">
            Restez Connecté avec Votre Communauté Scolaire !
          </h1>
          <p className="mt-4 text-lg text-gray-200">
            Téléchargez l'application ScholChat pour rejoindre les discussions,
            accéder aux ressources, et rester informé des actualités scolaires.
          </p>
        </div>
        <div className="right w-[40%] md:w-full flex items-center px-5 rounded-r-lg rounded-bl-[500px] gap-8 bg-[#FF7C54] md:bg-transparent md:p-8">
          <div className="box flex gap-2 items-center px-5 py-3 border text-white border-gray-50 hover:bg-white hover:text-black shadow-lg rounded-sm">
            <BsApple size={24} />
            <label className="text-lg">App Store</label>
          </div>
          <div className="box flex gap-2 items-center px-5 py-3 bg-white text-black shadow-lg rounded-sm">
            <BsGooglePlay size={24} />
            <label className="text-lg">Play Store</label>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-[#F3F4F8] py-16 pt-32 -mt-24">
        <div className="container grid grid-cols-4 gap-10 md:grid-cols-2 text-center md:text-left">
          {/* Logo and About Section */}
          <div className="logo">
            <img
              src={logImg}
              alt="Logo ScholChat"
              className="h-12 mb-4 mx-auto md:mx-0"
            />
            <span className="text-lg text-gray-700">
              ScholChat réunit les étudiants, enseignants, et parents dans une
              application sécurisée, facilitant la communication et l'engagement
              scolaire.
            </span>
          </div>

          {/* Contact Section */}
          <div>
            <h4 className="text-black text-2xl font-bold mb-4">Contact</h4>
            <p className="text-gray-600 text-lg">
              Vous avez des questions ou besoin de support ? Notre équipe est là
              pour vous aider à rester connecté avec votre école.
            </p>
            <NavLink
              to="#"
              className="text-primary font-semibold text-lg block mt-4"
            >
              Nous Contacter
            </NavLink>
          </div>

          {/* Mentions Légales Section */}
          <div>
            <h4 className="text-black text-2xl font-bold mb-4">
              Mentions Légales
            </h4>
            <p className="text-gray-600 text-lg">
              ScholChat respecte votre vie privée et garantit un environnement
              en ligne sécurisé. Consultez nos conditions et politiques pour en
              savoir plus.
            </p>
            <NavLink
              to="#"
              className="text-primary font-semibold text-lg block mt-4"
            >
              Politique de Confidentialité
            </NavLink>
            <NavLink
              to="#"
              className="text-primary font-semibold text-lg block"
            >
              Conditions Générales
            </NavLink>
          </div>

          {/* Suivez-nous Section */}
          <div>
            <h4 className="text-black text-2xl font-bold mb-4">Suivez-nous</h4>
            <p className="text-gray-600 text-lg">
              Suivez-nous sur les réseaux sociaux pour rester informé des
              dernières actualités et conseils pour utiliser ScholChat
              efficacement.
            </p>
            <div className="flex justify-center md:justify-start space-x-4 mt-4">
              <a
                href="https://facebook.com"
                className="text-gray-600 hover:text-blue-600"
              >
                <BsFacebook size={28} />
              </a>
              <a
                href="https://twitter.com"
                className="text-gray-600 hover:text-blue-400"
              >
                <BsTwitter size={28} />
              </a>
              <a
                href="https://instagram.com"
                className="text-gray-600 hover:text-pink-500"
              >
                <BsInstagram size={28} />
              </a>
            </div>
          </div>

          {/* Nos Produits Section */}
          <div>
            <h4 className="text-black text-2xl font-bold mb-4">Nos Produits</h4>
            <p className="text-gray-600 text-lg">
              Téléchargez ScholChat sur votre plateforme préférée et commencez à
              vous connecter avec votre communauté scolaire dès aujourd'hui !
            </p>
            <div className="flex flex-col items-center md:items-start space-y-2 mt-4">
              <a
                href="https://apple.com"
                className="flex items-center gap-2 text-gray-600 hover:text-black"
              >
                <BsApple size={28} /> <span className="text-lg">App Store</span>
              </a>
              <a
                href="https://play.google.com"
                className="flex items-center gap-2 text-gray-600 hover:text-black"
              >
                <BsGooglePlay size={28} />{" "}
                <span className="text-lg">Play Store</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
