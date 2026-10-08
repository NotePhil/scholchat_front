import React from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

export const Layout = ({ children, theme, setTheme }) => {
  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark bg-gray-900' : 'bg-white'}`}>
      <Header theme={theme} setTheme={setTheme} />
      <main>{children}</main>
      <Footer theme={theme} />
    </div>
  );
};
