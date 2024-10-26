import React from "react";
import aboutImg from "../components/assets/images/about.jpg";
import aboutImgBanner from "../components/assets/images/about-banner.jpg";
import imgs from "../components/assets/images/join1.png";
import {
  FaBookDead,
  FaGraduationCap,
  FaUserFriends,
  FaChalkboardTeacher,
} from "react-icons/fa";
import { AiOutlineCheck } from "react-icons/ai";

export const About = () => {
  return (
    <>
      <section className="about py-16">
        <div className="container">
          <div className="heading text-center py-12">
            <h1 className="text-3xl font-semibold text-black">
              Pourquoi Notre Guide Étudiant Est Exceptionnel
            </h1>
            <span className="text-sm mt-2 block">
              Vous n'avez pas à lutter seul, nous sommes là pour vous aider et
              vous assister.
            </span>
          </div>
          <div className="grid grid-cols-4 gap-5 mt-5 md:grid-cols-2">
            <AboutCard
              color="bg-[#2D69F0]"
              icon={<FaGraduationCap size={50} />}
              title="Orientation académique"
              desc="Conseils pour choisir votre parcours"
            />
            <AboutCard
              color="bg-[#DD246E]"
              icon={<FaUserFriends size={50} />}
              title="Soutien psychologique"
              desc="Un accompagnement personnalisé"
            />
            <AboutCard
              color="bg-[#8007E6]"
              icon={<FaChalkboardTeacher size={50} />}
              title="Tutorat en ligne"
              desc="Des cours particuliers à la demande"
            />
            <AboutCard
              color="bg-[#0CAE74]"
              icon={<FaBookDead size={50} />}
              title="Ressources pédagogiques"
              desc="Une bibliothèque numérique complète"
            />
          </div>
        </div>
      </section>
      <AboutContent />
    </>
  );
};

export const AboutCard = (props) => {
  return (
    <div
      className={`box shadow-md p-5 py-8 rounded-md text-white ${props.color} cursor-pointer transition ease-in-out delay-150 hover:-translate-y-4 duration-300 `}
    >
      <div className="icon">{props.icon}</div>
      <div className="text mt-5">
        <h4 className="text-lg font-semibold my-3">{props.title}</h4>
        <p className="text-sm">{props.desc}</p>
      </div>
    </div>
  );
};

export const AboutContent = () => {
  return (
    <section className="mb-16">
      <div className="container flex md:flex-col">
        <div className="left w-1/3 md:w-full mr-8 md:mr-0 relative">
          <img src={aboutImg} alt="aboutImg" className=" rounded-xl" />
          {/* <img
            src={aboutImgBanner}
            alt="aboutImg"
            className="rounded-xl absolute -bottom-14 -left-24 h-56 md:left-80"
          /> */}
          <div className="img-group ml-24 mt-3">
            <img src={imgs} alt="" />
            <span className="text-[14px]">
              Rejoignez plus de{" "}
              <label className="text-black text-sm">4,000+</label> étudiants
            </span>
          </div>
        </div>
        <div className="right w-2/3 md:w-full md:mt-16">
          <div className="heading w-4/5 md:w-full">
            <h1 className="text-3xl font-semibold text-black">
              Atteignez Vos Objectifs Avec Notre Guide
            </h1>
            <span className="text-sm mt-2 block leading-6">
              Notre plateforme de guidage étudiant est conçue pour vous
              accompagner tout au long de votre parcours académique. Que vous
              ayez besoin d'aide pour choisir votre orientation, gérer votre
              stress, ou améliorer vos méthodes d'apprentissage, nous sommes là
              pour vous.
            </span>
            <ul className="my-5">
              <li className="text-sm flex items-center gap-5">
                <AiOutlineCheck className="text-green-500" /> Développez vos
                compétences.
              </li>
              <li className="text-sm flex items-center gap-5 my-2">
                <AiOutlineCheck className="text-green-500" />
                Accédez à des ressources pédagogiques exclusives
              </li>
              <li className="text-sm flex items-center gap-5">
                <AiOutlineCheck className="text-green-500" />
                Bénéficiez d'un soutien personnalisé
              </li>
            </ul>
            <button className="px-5 py-2 border border-gray-300 rounded-md text-sm">
              Inscrivez-vous maintenant
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
