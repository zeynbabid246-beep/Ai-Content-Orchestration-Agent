import React from "react";
const features = [
  { text: "Generate AI-powered content instantly" },
  { text: "Customize tone, style, and audience" },
  { text: "Organize and manage content easily" },
  { text: "Improve productivity with automation" },
];

const benefits = [
  {
    num: "01", title: "Fast Content Creation",
    desc: "Generate high-quality content in seconds using AI.",
    icon: <path d="M7 1v6l3 2" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round"/>,
  },
  {
    num: "02", title: "Smart & Relevant Output",
    desc: "AI adapts to your needs and delivers optimized content.",
    icon: <><circle cx="7" cy="7" r="5" stroke="#c084fc" strokeWidth="1.4"/><path d="M5 7l1.5 1.5L9 5" stroke="#c084fc" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></>,
  },
  {
    num: "03", title: "Professional Workflow",
    desc: "Manage, organize, and scale your content efficiently.",
    icon: <><rect x="2" y="3" width="10" height="8" rx="2" stroke="#c084fc" strokeWidth="1.4"/><path d="M5 3V2M9 3V2" stroke="#c084fc" strokeWidth="1.4" strokeLinecap="round"/></>,
  },
];

const STATS = [
  { num: "10", unit: "x", label: "Faster Output" },
  { num: "50", unit: "k", label: "Active Users"  },
  { num: "99", unit: "%", label: "Satisfaction"  },
];

const Bodypage = () => {
  return (
    <section
      id="about"
      className="relative py-24 px-6 overflow-hidden
                 bg-[linear-gradient(135deg,#2B1E3F_0%,#4A2C4F_30%,#C34FA3_65%,#1A1A2E_100%)]"
    >

  
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px]
                      bg-[radial-gradient(circle,rgba(195,79,163,0.35),transparent_65%)]
                      blur-[80px] pointer-events-none" />

      <div className="absolute bottom-0 right-0 w-[500px] h-[500px]
                      bg-[radial-gradient(circle,rgba(155,89,182,0.25),transparent_70%)]
                      blur-[70px] pointer-events-none" />

      <div className="relative z-10 max-w-[1100px] mx-auto">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-[0.3rem] mb-5
                          rounded-full border border-purple-300/20 bg-white/5
                          text-[0.72rem] font-medium text-purple-300 tracking-[0.08em] uppercase">
            <span className="w-[5px] h-[5px] rounded-full bg-purple-300
                             shadow-[0_0_6px_#c084fc] animate-pulse" />
            About the Platform
          </div>

          <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-extrabold
                         leading-[1.08] tracking-[-0.025em] text-white"
              style={{ fontFamily: "'Syne', sans-serif" }}>
            About{" "}
            <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400
                             bg-clip-text text-transparent">
              AI Content Flow
            </span>
          </h2>

          <div className="w-10 h-[2px] mx-auto my-5
                          bg-gradient-to-r from-pink-400 to-indigo-400 rounded" />

          <p className="text-white/60 text-[1rem] leading-[1.75]
                        max-w-[520px] mx-auto font-light">
            A modern AI-powered platform designed to help creators, marketers,
            and businesses generate high-quality content faster, smarter, and more efficiently.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <div className="relative rounded-[18px] overflow-hidden border border-white/10">
              <img
                src="https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1200&auto=format&fit=crop"
                alt="AI Platform"
                className="w-full h-[260px] object-cover block"
                style={{ filter: "saturate(0.75) brightness(0.9)" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t
                              from-[#000000]/90 via-[#000000]/20 to-transparent" />
            </div>

            <h3 className="mt-7 mb-2 text-[1.2rem] font-bold text-white"
                style={{ fontFamily: "'Syne', sans-serif" }}>
              What You Can Do
            </h3>

            <div className="flex flex-col gap-[0.65rem]">
              {features.map((f, i) => (
                <div key={i}
                     className="flex items-start gap-3 px-4 py-[0.8rem]
                                rounded-xl bg-white/[0.05] border border-white/10">
                  <span className="flex-shrink-0 mt-[1px] w-7 h-7 rounded-[8px]
                                   bg-gradient-to-br from-purple-400/20 to-indigo-400/10
                                   border border-purple-400/30 flex items-center justify-center">
                    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#c084fc" strokeWidth="1.8"
                        strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <span className="text-[0.855rem] text-white/80">{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-5 text-[1.2rem] font-bold text-white"
                style={{ fontFamily: "'Syne', sans-serif" }}>
              Key Benefits
            </h3>

            <div className="flex flex-col gap-[0.85rem]">
              {benefits.map(({ num, title, desc, icon }) => (
                <div key={num}
                     className="group relative p-[1.3rem] rounded-2xl bg-white/[0.05]
                                border border-white/10 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br
                                  from-purple-400/10 to-transparent opacity-0
                                  group-hover:opacity-100 transition" />
                  <div className="relative flex items-center justify-between mb-2">
                    <div className="text-[0.65rem] font-extrabold text-purple-300/70">
                      {num}
                    </div>
                    <div className="w-7 h-7 flex items-center justify-center">
                      <svg className="w-[13px] h-[13px]" viewBox="0 0 14 14" fill="none">
                        {icon}
                      </svg>
                    </div>
                  </div>
                  <h4 className="text-[0.95rem] font-bold text-white mb-[0.35rem]">
                    {title}
                  </h4>
                  <p className="text-[0.83rem] text-white/60">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Bodypage;