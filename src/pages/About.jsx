import React, { useState, useEffect } from "react";
import aboutImg from "../components/assets/images/about.jpg";
import imgs from "../components/assets/images/join1.png";
import {
  FaBookDead,
  FaGraduationCap,
  FaUserFriends,
  FaChalkboardTeacher,
} from "react-icons/fa";
import { AiOutlineCheck } from "react-icons/ai";

export const About = () => {
  const cards = [
    {
      color: "bg-[#2D69F0]",
      icon: <FaGraduationCap size={50} />,
      title: "Orientation académique",
      desc: "Conseils pour choisir votre parcours",
    },
    {
      color: "bg-[#DD246E]",
      icon: <FaUserFriends size={50} />,
      title: "Soutien psychologique",
      desc: "Un accompagnement personnalisé",
    },
    {
      color: "bg-[#8007E6]",
      icon: <FaChalkboardTeacher size={50} />,
      title: "Tutorat en ligne",
      desc: "Des cours particuliers à la demande",
    },
    {
      color: "bg-[#0CAE74]",
      icon: <FaBookDead size={50} />,
      title: "Ressources pédagogiques",
      desc: "Une bibliothèque numérique complète",
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-play functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % cards.length);
    }, 3000); // Change every 3 seconds
    return () => clearInterval(interval);
  }, [cards.length]);

  // Navigate to a specific card
  const goToCard = (index) => {
    setCurrentIndex(index);
  };

  return (
    <>
      <style>
        {`
        .about .grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
        }

        @media (max-width: 768px) {
          .about .grid {
            display: flex;
            overflow-x: hidden;
          }

          .about .box {
            flex: 0 0 100%;
            scroll-snap-align: start;
          }
        }

        .carousel {
          position: relative;
          width: 100%;
        }

        .slides {
          display: flex;
          transition: transform 0.5s ease-in-out;
        }

        .dot {
          width: 12px;
          height: 12px;
          margin: 0 5px;
          background-color: gray;
          border-radius: 50%;
          cursor: pointer;
        }

        .dot.active {
          background-color: #2d69f0; /* Active dot color */
        }

        .box {
          transition: transform 0.3s ease-in-out;
        }

        .box:hover {
          transform: translateY(-1rem);
        }
      `}
      </style>
      <section className="about py-16">
        <div className="container relative">
          <div className="heading text-center py-12">
            <h1 className="text-3xl font-semibold text-black">
              Pourquoi Notre Guide Étudiant Est Exceptionnel
            </h1>
            <span className="text-sm mt-2 block">
              Vous n'avez pas à lutter seul, nous sommes là pour vous aider et
              vous assister.
            </span>
          </div>

          {/* Carousel */}
          <div className="carousel overflow-hidden">
            <div
              className="slides"
              style={{
                transform: `translateX(-${currentIndex * 100}%)`,
              }}
            >
              {cards.map((card, index) => (
                <div
                  key={index}
                  className={`box w-full flex-shrink-0 shadow-md p-5 py-8 rounded-md text-white ${card.color}`}
                >
                  <div className="icon">{card.icon}</div>
                  <div className="text mt-5">
                    <h4 className="text-lg font-semibold my-3">{card.title}</h4>
                    <p className="text-sm">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Dots */}
          <div className="dots flex justify-center mt-5">
            {cards.map((_, index) => (
              <div
                key={index}
                className={`dot ${currentIndex === index ? "active" : ""}`}
                onClick={() => goToCard(index)}
              ></div>
            ))}
          </div>
        </div>
      </section>
      <AboutContent />
    </>
  );
};

export const AboutContent = () => {
  return (
    <section className="mb-16">
      <div className="container flex md:flex-col">
        <div className="left w-1/3 md:w-full mr-8 md:mr-0 relative">
          <img src={aboutImg} alt="aboutImg" className="rounded-xl" />
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
