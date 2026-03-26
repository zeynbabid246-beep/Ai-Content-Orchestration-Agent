import React, { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import aiVideo from "../../video/ai.mp4";
import { motion } from "framer-motion";

const Hero = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden pt-24">

     
      <video
        ref={videoRef}
        src={aiVideo}
        muted
        loop
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-50"
      />
      <div className="absolute inset-0 bg-black/70" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_30%_40%,rgba(255,0,150,0.2),transparent_50%)]" />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative z-10 text-center max-w-4xl px-6"
      >
        <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
          Generate & Publish
          <span className="block mt-4 bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">
            Content with AI
          </span>
        </h1>

        <p className="mt-6 text-gray-300 text-lg max-w-2xl mx-auto">
          Automate content creation, manage interests, and publish across platforms
          — all from one powerful dashboard.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <button
            onClick={() => navigate("/login")}
            className="px-8 py-3 rounded-xl bg-white text-black font-semibold hover:bg-pink-500 hover:text-white transition"
          >
            Get Started
          </button>
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;