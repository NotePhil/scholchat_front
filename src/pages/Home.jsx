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
    <h1 className="text-4xl leading-tight text-black font-semibold h-24">
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
    <section className="bg-secondary py-10 h-[92vh] md:h-full">
      <div className="container">
        <div className="flex items-center justify-center md:flex-col">
          <div className="left w-1/2 text-black md:w-full">
            <div style={{ marginTop: "-250px" }}>
              <AnimatedText texts={texts} />
            </div>
            <div className="relative text-gray-600 focus-within:text-gray-400 mt-5">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2">
                <button
                  type="submit"
                  className="p-1 focus:outline-none focus:shadow-outline"
                ></button>
              </span>
            </div>
          </div>
          <div className="right w-1/2 md:w-full relative">
            <div className="images relative">
              <img
                src={heroImgback}
                alt=""
                className="absolute top-32 left-10 w-96 md:left-10"
              />

              <div className="img h-[85vh] w-full">
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
      <input
        type="search"
        className="py-3 text-sm bg-white rounded-md pl-10 focus:outline-none w-full"
        placeholder="Search..."
        autoComplete="off"
        style={{backgroundColor:"white"}}
      />
    </section>
  );
};

export const Home = () => {
  return (
    <>
      <HomeContent />
      <About />
      <br />
      <br />
      <br />
      <Courses />
      <Instructor />
      <Blog />
    </>
  );
};

export default Home;
