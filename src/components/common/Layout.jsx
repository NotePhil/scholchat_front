import React from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

export const Layout = ({ children, theme, setTheme }) => {
  return (
    <>
      <Header theme={theme} setTheme={setTheme} />
      <main>{children}</main>
      <Footer theme={theme} />
    </>
  );
};
