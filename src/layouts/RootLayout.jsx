import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/layout/Navbar";
import BottomTabs from "../components/layout/BottomTabs";
import StatStrip from "../components/StatStrip";

export default function RootLayout() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }, [location.pathname]);
  return (
    <div className="min-h-dvh bg-(--color-bg)">
      <Navbar />
      <div className="max-w-215 mx-auto px-5 pt-5 pb-10 w-full max-[768px]:pb-22">
        <StatStrip />
        <main className="block">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <BottomTabs />
    </div>
  );
}
