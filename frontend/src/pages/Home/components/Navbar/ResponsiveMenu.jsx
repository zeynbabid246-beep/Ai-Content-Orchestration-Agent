import { motion, AnimatePresence } from "framer-motion";
import React from "react";
import { useNavigate } from "react-router-dom";

const ResponsiveMenu = ({ open, setOpen }) => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
    setOpen(false);
  };

  const menuItems = [
    { label: "Overview", path: "/" },
    { label: "Interests", path: "/interests" },
    { label: "Content Type", path: "/content-type" },
    { label: "Content Feed", path: "/content-feed" },
    { label: "Social Media", path: "/social-media" },
    { label: "Publish", path: "/publish" },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/40 z-40"
          />

          {/* Menu */}
          <motion.div
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            transition={{ duration: 0.25 }}
            className="fixed top-24 left-0 right-0 z-50 px-4"
          >
            <div className="bg-white/95 backdrop-blur-md text-black py-8 rounded-3xl shadow-xl">
              <ul className="flex flex-col items-center gap-6">

                {menuItems.map((item) => (
                  <li key={item.path}>
                    <button
                      onClick={() => handleNavigation(item.path)}
                      className="text-lg font-medium hover:text-pink-500 transition"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}

              </ul>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ResponsiveMenu;