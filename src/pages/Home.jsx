import React, { useState, useEffect } from "react";
import heroImg from "../components/assets/images/hero.png";
import heroImgback from "../components/assets/images/hero-shape-purple.png";
import { FiSearch } from "react-icons/fi";
import { About } from "./About";
import { Courses } from "./Courses";
import { Instructor } from "./Instructor";
import { Blog } from "./Blog";
import "../CSS/animations.css";

const AnimatedText = ({ texts }) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isWriting, setIsWriting] = useState(true);

  useEffect(() => {
    const currentFullText = texts[currentTextIndex];
    let timer;

    if (isWriting) {
      if (displayText.length < currentFullText.length) {
        timer = setTimeout(() => {
          setDisplayText(currentFullText.slice(0, displayText.length + 1));
        }, 200);
      } else {
        setIsWriting(false);
        timer = setTimeout(() => {
          setIsWriting(false);
        }, 1000);
      }
    } else {
      if (displayText.length > 0) {
        timer = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, 50);
      } else {
        setIsWriting(true);
        setCurrentTextIndex((prevIndex) => (prevIndex + 1) % texts.length);
      }
    }

    return () => clearTimeout(timer);
  }, [displayText, isWriting, currentTextIndex, texts]);

  return (
    <h1 className="text-3xl leading-tight text-black font-semibold h-24 md:text-4xl lg:text-5xl">
      {displayText}
      <span className="animate-blink">|</span>
    </h1>
  );
};

export const HomeContent = () => {
  const texts = [
    "La réussite scolaire commence par une bonne communication",
    "Simplifier les échanges pour la réussite de vos enfants",
    "Un lien direct pour mieux accompagner vos enfants",
  ];

  return (
    <section className="bg-secondary py-10 h-auto md:h-[92vh] lg:h-full">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col-reverse md:flex-row items-center justify-between">
          <div className="left w-full md:w-1/2 text-black mt-10 md:mt-0">
            <div>
              <AnimatedText texts={texts} />
            </div>
          </div>
          <div className="right w-full md:w-1/2 relative mb-10 md:mb-0">
            <div className="images relative w-full flex justify-center md:justify-end">
              <img
                src={heroImgback}
                alt=""
                className="absolute top-10 left-10 w-72 md:w-96 lg:top-20 md:left-20"
              />
              <div className="img h-[45vh] md:h-[60vh] lg:h-[85vh] w-auto">
                <img
                  src={heroImg}
                  alt=""
                  className="h-full w-full object-contain z-20 relative shake"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export const Home = () => {
  return (
    <>
      <HomeContent />
      <About />
      <Courses />
      <Instructor />
      <Blog />
    </>
  );
};

export default Home;
