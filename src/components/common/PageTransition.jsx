import React from "react";
import { motion } from "framer-motion";

/**
 * PageTransition Component
 * Provides smooth, professional page transitions for all routes
 * Prevents flash of home page during navigation
 */
export const PageTransition = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.3,
        ease: [0.43, 0.13, 0.23, 0.96] // Custom easing for professional feel
      }}
      style={{
        width: "100%",
        minHeight: "100vh"
      }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
