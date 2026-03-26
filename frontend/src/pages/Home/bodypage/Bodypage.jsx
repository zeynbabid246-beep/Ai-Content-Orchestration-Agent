import React from "react";
import ugcvideo from "../video/ugc.mp4";

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

const stats = [
  { num: "10", unit: "x", label: "Faster Output" },
  { num: "50", unit: "k", label: "Active Users"  },
  { num: "99", unit: "%", label: "Satisfaction"  },
];

const Bodypage = () => {
  return (
    <section id="about" className="relative py-24 px-6 bg-[#04040a] overflow-hidden">

      {/* Orbs */}
      <div className="absolute -top-20 -left-28 w-[500px] h-[500px] rounded-full
                      bg-[radial-gradient(circle,rgba(192,132,252,0.1),transparent_70%)]
                      blur-[60px] pointer-events-none" />
      <div className="absolute bottom-0 -right-24 w-[400px] h-[400px] rounded-full
                      bg-[radial-gradient(circle,rgba(99,102,241,0.09),transparent_70%)]
                      blur-[60px] pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 100% 80% at 50% 40%,black,transparent 90%)",
        }}
      />

      <div className="relative z-10 max-w-[1100px] mx-auto">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-[0.3rem] mb-5
                          rounded-full border border-purple-400/20 bg-purple-400/7
                          text-[0.72rem] font-medium text-purple-400 tracking-[0.08em] uppercase">
            <span className="w-[5px] h-[5px] rounded-full bg-purple-400
                             shadow-[0_0_6px_theme(colors.purple.400)] animate-pulse" />
            About the Platform
          </div>

          <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-extrabold
                         leading-[1.08] tracking-[-0.025em] text-white"
              style={{ fontFamily: "'Syne', sans-serif" }}>
            About{" "}
            <span className="bg-gradient-to-r from-fuchsia-400 via-purple-400 to-indigo-400
                             bg-clip-text text-transparent">
              AI Content Flow
            </span>
          </h2>

          <div className="w-10 h-[2px] mx-auto my-5
                          bg-gradient-to-r from-purple-400 to-indigo-400 rounded" />

          <p className="text-white/45 text-[1rem] leading-[1.75]
                        max-w-[520px] mx-auto font-light">
            A modern AI-powered platform designed to help creators, marketers,
            and businesses generate high-quality content faster, smarter, and more efficiently.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <div className="relative rounded-[18px] overflow-hidden border border-white/7">
              <img
                src="https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1200&auto=format&fit=crop"
                alt="AI Platform"
                className="w-full h-[260px] object-cover block"
                style={{ filter: "saturate(0.75) brightness(0.9)" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t
                              from-[#04040a]/95 via-[#04040a]/15 to-transparent" />
              <div className="absolute bottom-4 left-5 flex items-center gap-2">
                <span className="w-[6px] h-[6px] rounded-full bg-green-400
                                 shadow-[0_0_8px_#4ade80]" />
                <span className="text-[0.7rem] font-medium text-white/45
                                 tracking-[0.06em] uppercase">
                  AI-Powered Platform
                </span>
              </div>
            </div>

            <h3 className="mt-7 mb-2 text-[1.2rem] font-bold text-white"
                style={{ fontFamily: "'Syne', sans-serif" }}>
              What You Can Do
            </h3>
            <p className="text-white/45 text-[0.88rem] leading-relaxed mb-5">
              Generate articles, ads, social posts, and more using advanced AI —
              tailored to your voice and audience.
            </p>

            {/* Features */}
            <div className="flex flex-col gap-[0.65rem]">
              {features.map((f, i) => (
                <div key={i}
                     className="flex items-start gap-3 px-4 py-[0.8rem]
                                rounded-xl bg-white/[0.035] border border-white/7
                                hover:border-purple-400/25 transition-colors duration-250">
                  <span className="flex-shrink-0 mt-[1px] w-7 h-7 rounded-[8px]
                                   bg-gradient-to-br from-purple-400/15 to-indigo-400/10
                                   border border-purple-400/20
                                   flex items-center justify-center">
                    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#c084fc" strokeWidth="1.8"
                        strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <span className="text-[0.855rem] text-white/70 leading-snug">{f.text}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 mt-8 rounded-2xl overflow-hidden
                            border border-white/7 divide-x divide-white/7">
              {stats.map(({ num, unit, label }) => (
                <div key={label} className="py-5 text-center bg-white/[0.035]">
                  <div className="font-extrabold text-[1.7rem] text-white leading-none"
                       style={{ fontFamily: "'Syne', sans-serif" }}>
                    {num}<span className="text-purple-400">{unit}</span>
                  </div>
                  <div className="text-[0.7rem] text-white/40 mt-1
                                  tracking-[0.05em] uppercase">{label}</div>
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
                     className="group relative p-[1.3rem] rounded-2xl bg-white/[0.035]
                                border border-white/7 overflow-hidden
                                transition-all duration-300 hover:-translate-y-0.5
                                hover:border-purple-400/28
                                hover:shadow-[0_12px_40px_rgba(0,0,0,0.3),0_0_24px_rgba(192,132,252,0.05)]">
                  <div className="absolute inset-0 bg-gradient-to-br
                                  from-purple-400/4 to-transparent
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-center justify-between mb-2">
                    <div className="text-[0.65rem] font-extrabold tracking-[0.12em]
                                    uppercase text-purple-400/50"
                         style={{ fontFamily: "'Syne', sans-serif" }}>
                      {num}
                    </div>
                    <div className="w-7 h-7 rounded-[8px] flex items-center justify-center
                                    bg-purple-400/8 border border-purple-400/15">
                      <svg className="w-[13px] h-[13px]" viewBox="0 0 14 14" fill="none">
                        {icon}
                      </svg>
                    </div>
                  </div>
                  <h4 className="relative text-[0.95rem] font-bold text-white mb-[0.35rem]
                                 group-hover:text-purple-400 transition-colors duration-200"
                      style={{ fontFamily: "'Syne', sans-serif" }}>
                    {title}
                  </h4>
                  <p className="relative text-[0.83rem] text-white/45 leading-relaxed">{desc}</p>
                </div>
              ))}
              <div className="relative p-[1.3rem] rounded-2xl overflow-hidden
                              border border-purple-400/18
                              bg-gradient-to-br from-purple-400/8 to-indigo-500/5">
                <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full
                                bg-[radial-gradient(circle,rgba(192,132,252,0.18),transparent_70%)]
                                pointer-events-none" />
                <h4 className="relative text-[0.95rem] font-bold text-white mb-[0.35rem]"
                    style={{ fontFamily: "'Syne', sans-serif" }}>
                  Built for Scalability
                </h4>
                <p className="relative text-[0.83rem] text-white/45 leading-relaxed">
                  Designed to support individuals and teams at every stage of their content journey.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-20">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/7" />
            <span className="text-[0.7rem] font-extrabold tracking-[0.1em]
                             uppercase text-white/25 whitespace-nowrap"
                  style={{ fontFamily: "'Syne', sans-serif" }}>
              Platform in Action
            </span>
            <div className="flex-1 h-px bg-white/7" />
          </div>

          <div className="flex justify-center">
            <div className="relative w-[340px] rounded-[24px] overflow-hidden
                            border border-white/12
                            shadow-[0_0_80px_rgba(0,0,0,0.7),0_0_40px_rgba(192,132,252,0.08)]">
              {["top-[10px] left-[10px] border-t-[1.5px] border-l-[1.5px] rounded-tl-[3px]",
                "top-[10px] right-[10px] border-t-[1.5px] border-r-[1.5px] rounded-tr-[3px]",
                "bottom-[10px] left-[10px] border-b-[1.5px] border-l-[1.5px] rounded-bl-[3px]",
                "bottom-[10px] right-[10px] border-b-[1.5px] border-r-[1.5px] rounded-br-[3px]",
              ].map((cls, i) => (
                <div key={i}
                     className={`absolute w-4 h-4 border-purple-400/70 z-10 ${cls}`} />
              ))}

              <video
                src={ugcvideo}
                autoPlay loop muted playsInline controls
                className="w-full block object-contain"
                style={{ aspectRatio: "9/16" }}
              />
            </div>
          </div>

          <p className="text-center text-[0.8rem] text-white/35 mt-4">
            See <span className="text-white/60 font-medium">AI Content Flow</span> in action — real workflow, real results.
          </p>
        </div>

      </div>
    </section>
  );
};

export default Bodypage;