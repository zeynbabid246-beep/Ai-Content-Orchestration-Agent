import React, { useState, useEffect } from "react";
import { navbarMenu } from "../../mockdata/data";
import logo from "../../assets/Logo.png";
import { CiMenuBurger } from "react-icons/ci";
import { IoClose } from "react-icons/io5";
import ResponsiveMenu from "./ResponsiveMenu";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? "bg-black/40 backdrop-blur-xl shadow-lg"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="Logo"
              className="w-11 h-11 rounded-full ring-2 ring-pink-500/40"
            />
            <span className="text-white font-semibold text-lg tracking-wide">
              Ai_content-flow
            </span>
          </div>
          <ul className="hidden md:flex items-center gap-8 text-sm font-medium">
            {navbarMenu.map((item) => {
              const isActive = location.pathname === item.link;

              return (
                <li key={item.id}>
                  <Link
                    to={item.link}
                    className={`relative transition ${
                      isActive
                        ? "text-white"
                        : "text-gray-300 hover:text-white"
                    }`}
                  >
                    {item.title}

                    {/* animated underline */}
                    <span
                      className={`absolute left-0 -bottom-1 h-[2px] bg-pink-500 transition-all duration-300 ${
                        isActive
                          ? "w-full"
                          : "w-0 group-hover:w-full group-hover:opacity-100 opacity-0"
                      }`}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Mobile Toggle */}
          <button
            onClick={() => setOpen((prev) => !prev)}
            className="md:hidden text-3xl text-white"
          >
            {open ? <IoClose /> : <CiMenuBurger />}
          </button>
        </div>
      </nav>

      <ResponsiveMenu open={open} setOpen={setOpen} />
    </>
  );
};

export default Navbar;