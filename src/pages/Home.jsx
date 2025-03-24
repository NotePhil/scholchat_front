import React, { useState, useEffect } from "react";
import heroImg from "../components/assets/images/heronew.png";
import { About } from "./About";
import { Courses } from "./Courses";
import { Instructor } from "./Instructor";
import { Blog } from "./Blog";
import { FunctionalitiesSection } from "./FunctionalitiesSection"; // Import the new component
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
    <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold min-h-[96px] md:min-h-[128px] lg:min-h-[160px] leading-tight text-black">
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
    <section className="bg-secondary py-10 md:py-20 lg:py-24 min-h-screen">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex flex-col items-center space-y-8 md:space-y-10">
          {/* Text Content - Always on top */}
          <div className="w-full text-center max-w-2xl mx-auto">
            <AnimatedText texts={texts} />
          </div>

          {/* Image Content - Always below */}
          <div className="relative w-full flex justify-center mt-4 md:mt-8">
            <div className="relative w-full max-w-md shake">
              <div className="relative z-20">
                <img
                  src={heroImg}
                  alt="Hero"
                  className="w-4/5 md:w-full max-w-xs md:max-w-sm lg:max-w-md mx-auto object-contain"
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
      <FunctionalitiesSection />
      <About />
      <Courses />
      <Instructor />
      <Blog />
    </>
  );
};

export default Home;
