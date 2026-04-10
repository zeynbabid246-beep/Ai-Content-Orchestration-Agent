import React, { useState, useEffect, useRef } from "react";
import { navbarMenu } from "../../mockdata/data";
import logo from "../../assets/Logo.png";
import { CiMenuBurger } from "react-icons/ci";
import { IoClose } from "react-icons/io5";
import ResponsiveMenu from "./ResponsiveMenu";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CgProfile } from "react-icons/cg";
import { HiOutlineUser, HiOutlineCog, HiOutlineLogout } from "react-icons/hi";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

 
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

         
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="Logo"
              className="w-11 h-11 rounded-full ring-2 ring-pink-500/40"
            />
            <span className="text-white font-semibold text-lg tracking-wide">
              AI_content-flow
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
                      isActive ? "text-white" : "text-gray-300 hover:text-white"
                    }`}
                  >
                    {item.title}
                    <span
                      className={`absolute left-0 -bottom-1 h-[2px] bg-pink-500 transition-all duration-300 ${
                        isActive ? "w-full" : "w-0 opacity-0"
                      }`}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center gap-4">

           
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className={`flex items-center gap-2 px-3 py-[6px] rounded-full border transition-all duration-200
                  ${dropdownOpen
                    ? "border-pink-500/60 bg-pink-500/10 text-pink-400"
                    : "border-white/10 bg-white/5 text-gray-300 hover:border-pink-500/40 hover:text-white"
                  }`}
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-purple-600
                                flex items-center justify-center text-white text-sm">
                  <CgProfile />
                </div>
                <button className="hidden md:block text-sm font-medium">Account</button>
                
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl border border-white/10
                                bg-black/80 backdrop-blur-xl shadow-xl shadow-black/40 overflow-hidden
                                animate-in fade-in slide-in-from-top-2 duration-150">

                  <div className="px-4 py-3 border-b border-white/8">
                    <p className="text-white text-sm font-semibold">My Account</p>
                    <p className="text-gray-400 text-xs mt-0.5">Manage your profile</p>
                  </div>

                
                  <div className="py-1.5">
                    <button
                      onClick={() => { navigate("/profile"); setDropdownOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300
                                 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <HiOutlineUser className="text-pink-400 text-base" />
                      Profile
                    </button>
                    <button
                      onClick={() => { navigate("/settings"); setDropdownOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300
                                 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <HiOutlineCog className="text-purple-400 text-base" />
                      Settings
                    </button>
                  </div>
                  <div className="border-t border-white/8 py-1.5">
                    <button
                      onClick={() => { navigate("/login"); setDropdownOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400
                                 hover:text-red-300 hover:bg-red-500/5 transition-colors"
                    >
                      <HiOutlineLogout className="text-base" />
                      Log out
                    </button>
                  </div>

                </div>
              )}
            </div>

          
            <button
              onClick={() => setOpen((prev) => !prev)}
              className="md:hidden text-2xl text-white"
            >
              {open ? <IoClose /> : <CiMenuBurger />}
            </button>

          </div>
        </div>
      </nav>

      <ResponsiveMenu open={open} setOpen={setOpen} />
    </>
  );
};

export default Navbar;