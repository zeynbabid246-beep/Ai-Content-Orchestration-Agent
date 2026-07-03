import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import {
  Sparkles,
  Zap,
  BarChart3,
  Users,
  CalendarDays,
  Target,
  ArrowRight,
  Check,
  Globe,
  Brain,
  TrendingUp,
  Menu,
  X,
  ChevronRight,
  Lightbulb,
  ImageIcon,
  Megaphone,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────────
   Platform SVGs
──────────────────────────────────────────────────────────────── */
const LinkedInSvg = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M19 0H5C2.239 0 0 2.239 0 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5V5c0-2.761-2.238-5-5-5zM8 19H5V8h3v11zM6.5 6.732c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zM20 19h-3v-5.604c0-3.368-4-3.113-4 0V19h-3V8h3v1.765c1.396-2.586 7-2.777 7 2.476V19z" />
  </svg>
);
const FacebookSvg = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M24 12.073C24 5.446 18.627 0 12 0S0 5.446 0 12.073c0 6.027 4.388 11.025 10.125 11.927v-8.438H7.078V12.07h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953h-1.513c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.437C19.612 23.1 24 18.1 24 12.073z" />
  </svg>
);
const InstagramSvg = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);
const ThreadsSvg = () => (
  <svg viewBox="0 0 192 192" fill="currentColor" className="w-6 h-6">
    <path d="M141.537 88.988a66.667 66.667 0 00-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.348-10.548h.229c8.249.053 14.474 2.452 18.503 7.129 2.932 3.405 4.893 8.111 5.864 14.05-7.314-1.243-15.224-1.626-23.68-1.14-23.82 1.371-39.134 15.264-38.105 34.568.522 9.792 5.4 18.216 13.735 23.719 7.047 4.652 16.124 6.927 25.557 6.412 12.458-.683 22.231-5.436 29.049-14.127 5.178-6.6 8.453-15.153 9.899-25.93 5.937 3.583 10.337 8.298 12.767 13.966 4.132 9.635 4.373 25.468-8.546 38.376-11.319 11.308-24.925 16.2-45.488 16.351-22.809-.169-40.06-7.484-51.275-21.742C35.236 139.966 29.808 120.682 29.605 96c.203-24.682 5.63-43.966 16.133-57.317C56.954 24.425 74.204 17.11 97.013 16.94c22.975.17 40.526 7.52 52.171 21.847 5.71 7.026 10.015 15.86 12.853 26.162l16.147-4.308c-3.44-12.68-8.853-23.606-16.219-32.668C147.036 9.607 125.202.195 97.07 0h-.113C68.882.195 47.292 9.57 32.788 27.983 19.882 44.514 13.223 67.459 13.01 95.989v.023c.213 28.53 6.872 51.476 19.778 68.007C47.292 182.43 68.882 191.805 96.957 192h.113c24.96-.173 42.554-6.708 57.048-21.189 18.963-18.945 18.392-42.692 12.142-57.27-4.484-10.454-13.033-18.945-24.723-24.553zM98.44 129.507c-10.44.588-21.286-4.098-21.82-14.135-.397-7.442 5.277-15.745 22.303-16.725 1.953-.113 3.868-.168 5.745-.168 6.333 0 12.26.61 17.658 1.81-2.01 25.696-13.29 28.63-23.886 29.218z" />
  </svg>
);

/* ────────────────────────────────────────────────────────────────
   Data
──────────────────────────────────────────────────────────────── */
const NAV_LINKS = [
  { label: "Fonctionnalités", href: "#features" },
  { label: "Comment ça marche", href: "#how-it-works" },
  { label: "Plateformes", href: "#platforms" },
];

const FEATURES = [
  {
    Icon: Brain,
    title: "Génération de contenu IA",
    desc: "Générez des posts parfaits pour chaque plateforme en quelques secondes, avec une IA entraînée sur les contenus les plus performants.",
    accent: "#2563eb",
    bg: "#eff6ff",
  },
  {
    Icon: Globe,
    title: "Publication multi-plateforme",
    desc: "Publiez simultanément sur LinkedIn, Facebook, Instagram et Threads depuis un seul espace de travail unifié.",
    accent: "#7c3aed",
    bg: "#f5f3ff",
  },
  {
    Icon: CalendarDays,
    title: "Planification intelligente",
    desc: "Programmez vos publications aux meilleurs moments d'engagement et gérez tout votre calendrier en un coup d'œil.",
    accent: "#059669",
    bg: "#ecfdf5",
  },
  {
    Icon: BarChart3,
    title: "Analytics en temps réel",
    desc: "Suivez les impressions, la portée et l'engagement sur toutes les plateformes depuis un tableau de bord centralisé.",
    accent: "#dc2626",
    bg: "#fef2f2",
  },
  {
    Icon: Target,
    title: "Gestion de campagnes",
    desc: "Organisez votre contenu en campagnes ciblées avec des timelines, objectifs et suivi de performance intégrés.",
    accent: "#d97706",
    bg: "#fffbeb",
  },
  {
    Icon: Users,
    title: "Collaboration d'équipe",
    desc: "Invitez votre équipe, attribuez des rôles et collaborez sur le contenu avec des contrôles d'accès basés sur les rôles.",
    accent: "#0891b2",
    bg: "#ecfeff",
  },
];

const PLATFORMS = [
  { Svg: LinkedInSvg, name: "LinkedIn", desc: "Réseau professionnel", color: "#0A66C2", bg: "#EBF3FB", border: "#BFDBFE" },
  { Svg: FacebookSvg, name: "Facebook", desc: "Plus grand réseau social", color: "#1877F2", bg: "#EFF6FF", border: "#BFDBFE" },
  { Svg: InstagramSvg, name: "Instagram", desc: "Storytelling visuel", color: "#E4405F", bg: "#FFF1F2", border: "#FECDD3" },
  { Svg: ThreadsSvg, name: "Threads", desc: "Conversations textuelles", color: "#0f172a", bg: "#F8FAFC", border: "#E2E8F0" },
];

const STEPS = [
  {
    num: "01",
    title: "Connectez votre marque",
    desc: "Importez vos guidelines, votre ton et votre audience cible. L'IA apprend votre style unique en quelques minutes.",
    color: "#2563eb",
    bg: "#eff6ff",
  },
  {
    num: "02",
    title: "Générez du contenu IA",
    desc: "Décrivez votre objectif de campagne. L'IA rédige des posts optimisés pour chaque plateforme, avec hashtags.",
    color: "#7c3aed",
    bg: "#f5f3ff",
  },
  {
    num: "03",
    title: "Programmez et publiez",
    desc: "Révisez, ajustez et planifiez. Publication automatique sur toutes les plateformes au moment optimal.",
    color: "#059669",
    bg: "#ecfdf5",
  },
];

const STATS = [
  { value: "10×", label: "Plus rapide qu'à la main" },
  { value: "4", label: "Plateformes connectées" },
  { value: "80%", label: "Moins de temps sur les réseaux" },
  { value: "∞", label: "Possibilités de contenu" },
];

/* ────────────────────────────────────────────────────────────────
   Motion variants
──────────────────────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] as const } },
};
const stagger = { visible: { transition: { staggerChildren: 0.09 } } };

/* ────────────────────────────────────────────────────────────────
   Helpers
──────────────────────────────────────────────────────────────── */
function Section({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px 0px" });
  return (
    <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"} className={className}>
      {children}
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Dashboard Mockup — light theme matching the real app
──────────────────────────────────────────────────────────────── */
function DashboardMockup() {
  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden"
      style={{
        border: "1px solid #e5e7eb",
        boxShadow: "0 32px 80px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.04)",
        background: "#ffffff",
      }}
    >
      {/* App layout */}
      <div className="flex" style={{ minHeight: "360px", background: "#ffffff" }}>
        {/* Sidebar */}
        <div
          className="w-48 flex-shrink-0 p-4 flex flex-col"
          style={{ background: "#fafafa", borderRight: "1px solid #f0f0f0" }}
        >
          <div className="flex items-center gap-2.5 mb-6">
            <img src="/logo1.png" alt="logo" className="w-7 h-7 rounded-lg object-cover" />
            <span className="text-sm font-bold" style={{ color: "#111827" }}>AiContentFlow</span>
          </div>

          <div className="text-[10px] font-bold tracking-widest mb-3" style={{ color: "#d1d5db" }}>
            WORKSPACE
          </div>

          {[
            { label: "Dashboard", active: true },
            { label: "Generate", active: false },
            { label: "Calendar", active: false },
            { label: "Analytics", active: false },
            { label: "Channels", active: false },
          ].map(({ label, active }) => (
            <div
              key={label}
              className="text-sm py-2 px-3 rounded-lg mb-0.5 font-medium transition-all"
              style={{
                background: active ? "#f3f4f6" : "transparent",
                color: active ? "#111827" : "#9ca3af",
                borderLeft: active ? "2px solid #111827" : "2px solid transparent",
              }}
            >
              {label}
            </div>
          ))}

          <div className="mt-auto pt-4" style={{ borderTop: "1px solid #f0f0f0" }}>
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                style={{ background: "#111827" }}
              >
                SM
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: "#111827" }}>Sarah M.</div>
                <div className="text-xs" style={{ color: "#9ca3af" }}>Admin</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-5 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold" style={{ color: "#111827" }}>
              Bonjour, Sarah
            </div>
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb" }}
            >
              <Sparkles className="w-3.5 h-3.5" style={{ color: "#6b7280" }} />
              IA Prête
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Posts publiés", value: "248", trend: "+12%" },
              { label: "Portée totale", value: "24.5K", trend: "+31%" },
              { label: "Engagement", value: "12.4%", trend: "+8%" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-4"
                style={{ background: "#ffffff", border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
              >
                <div className="text-xs mb-2" style={{ color: "#9ca3af" }}>{s.label}</div>
                <div className="text-2xl font-bold leading-none mb-1" style={{ color: "#111827" }}>{s.value}</div>
                <div className="text-xs font-medium" style={{ color: "#6b7280" }}>{s.trend}</div>
              </div>
            ))}
          </div>

          {/* Posts table */}
          <div
            className="flex-1 rounded-xl overflow-hidden"
            style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}
          >
            <div
              className="px-4 py-3"
              style={{ borderBottom: "1px solid #f3f4f6", background: "#fafafa" }}
            >
              <span className="text-xs font-bold tracking-widest" style={{ color: "#c0c0c0" }}>
                POSTS RÉCENTS
              </span>
            </div>

            {[
              {
                platform: "LinkedIn",
                Icon: TrendingUp,
                text: "Bilan Q2 : 10 000 clients — ce que nous avons appris",
                status: "Publié",
              },
              {
                platform: "Instagram",
                Icon: ImageIcon,
                text: "Dans les coulisses de notre workflow de contenu IA",
                status: "Planifié",
              },
              {
                platform: "Threads",
                Icon: Lightbulb,
                text: "Pourquoi les marques surestiment leur stratégie de contenu",
                status: "Brouillon",
              },
            ].map((p) => (
              <div
                key={p.text}
                className="flex items-center gap-3 px-4 py-3 last:border-0"
                style={{ borderBottom: "1px solid #f9fafb" }}
              >
                <div
                  className="text-xs px-2.5 py-1 rounded-lg font-medium flex-shrink-0"
                  style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb" }}
                >
                  {p.platform}
                </div>
                <p.Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#c0c0c0" }} />
                <div className="text-sm flex-1 truncate font-medium" style={{ color: "#374151" }}>
                  {p.text}
                </div>
                <div
                  className="text-xs flex-shrink-0 px-2.5 py-1 rounded-lg"
                  style={{ background: "#f3f4f6", color: "#6b7280" }}
                >
                  {p.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Main component
──────────────────────────────────────────────────────────────── */
export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: "#f8fafc", fontFamily: '"Outfit", system-ui, sans-serif', color: "#0f172a" }}
    >
      {/* ── Navbar ────────────────────────────────────────────── */}
      <header
        className="fixed top-0 inset-x-0 z-50"
        style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid #e2e8f0", boxShadow: "0 1px 12px rgba(0,0,0,0.06)" }}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 no-underline">
            <img src="/logo1.png" alt="AiContentFlow" className="h-9 w-9 rounded-xl object-cover" />
            <span className="font-bold text-base tracking-tight" style={{ color: "#0f172a" }}>
              AiContentFlow
            </span>
          </Link>

          {/* Desktop links */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="px-4 py-2 text-sm font-medium rounded-xl transition-colors"
                style={{ color: "#475569", textDecoration: "none" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#2563eb"; (e.currentTarget as HTMLElement).style.background = "#eff6ff"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#475569"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/app/login"
              className="text-sm font-medium px-4 py-2 rounded-xl transition-colors no-underline"
              style={{ color: "#475569" }}
            >
              Se connecter
            </Link>
            <Link
              to="/app/register"
              className="flex items-center gap-1.5 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all no-underline"
              style={{ background: "#2563eb", boxShadow: "0 2px 12px rgba(37,99,235,0.30)" }}
            >
              Commencer gratuitement <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile burger */}
          <button
            className="md:hidden p-2 rounded-xl transition-colors"
            style={{ color: "#475569" }}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden px-4 pb-4"
            style={{ background: "#ffffff", borderTop: "1px solid #f1f5f9" }}
          >
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="block px-4 py-3 text-sm font-medium transition-colors"
                style={{ color: "#475569", textDecoration: "none" }}
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
              </a>
            ))}
            <div className="pt-3 mt-2 flex flex-col gap-2" style={{ borderTop: "1px solid #f1f5f9" }}>
              <Link to="/app/login" className="text-sm font-medium py-2 px-4 text-center no-underline" style={{ color: "#475569" }}>
                Se connecter
              </Link>
              <Link
                to="/app/register"
                className="text-white text-sm font-semibold py-2.5 px-5 rounded-xl text-center no-underline"
                style={{ background: "#2563eb" }}
              >
                Commencer gratuitement →
              </Link>
            </div>
          </motion.div>
        )}
      </header>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section
        className="relative flex flex-col items-center justify-center overflow-hidden px-4 pt-36 pb-20 min-h-screen"
        style={{
          background: "linear-gradient(180deg, #f0f7ff 0%, #f8fafc 60%)",
        }}
      >
        {/* Background grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(#e2e8f060 1px,transparent 1px),linear-gradient(90deg,#e2e8f060 1px,transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        {/* Subtle blue orb */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: 700,
            height: 700,
            top: 0,
            left: "50%",
            transform: "translateX(-50%) translateY(-30%)",
            background: "radial-gradient(circle, rgba(37,99,235,0.07), transparent 65%)",
            borderRadius: "50%",
          }}
        />

        <div className="relative max-w-5xl mx-auto text-center w-full">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-7 text-sm font-medium cursor-default"
            style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#2563eb" }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Plateforme de contenu propulsée par l'IA
            <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.06] mb-6"
            style={{ color: "#0f172a" }}
          >
            Créez du contenu
            <br />
            <span
              className="bg-clip-text"
              style={{
                backgroundImage: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              qui convertit vraiment
            </span>
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.2 }}
            className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10"
            style={{ color: "#475569" }}
          >
            Arrêtez de perdre des heures sur vos réseaux sociaux. AiContentFlow génère,
            planifie et publie du contenu performant sur toutes vos plateformes — en quelques secondes.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-6"
          >
            <Link
              to="/app/register"
              className="group flex items-center justify-center gap-2 text-white font-semibold px-8 py-3.5 rounded-2xl transition-all no-underline text-base"
              style={{ background: "#2563eb", boxShadow: "0 4px 20px rgba(37,99,235,0.28)" }}
            >
              Commencer gratuitement
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/app/login"
              className="flex items-center justify-center gap-2 font-semibold px-8 py-3.5 rounded-2xl transition-all no-underline text-base"
              style={{ background: "#ffffff", border: "1.5px solid #e2e8f0", color: "#0f172a", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
            >
              Se connecter
            </Link>
          </motion.div>

          {/* Trust signals */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 mb-14"
          >
            {["Sans carte bancaire", "Plan gratuit", "Annulation à tout moment"].map((t) => (
              <span key={t} className="flex items-center gap-1.5 text-sm" style={{ color: "#94a3b8" }}>
                <Check className="w-3.5 h-3.5" style={{ color: "#10b981" }} />
                {t}
              </span>
            ))}
          </motion.div>

          {/* Product mockup */}
          <motion.div
            initial={{ opacity: 0, y: 44 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.45, ease: [0.25, 0.4, 0.25, 1] }}
            className="relative max-w-4xl mx-auto"
          >
            {/* Floating card — live post */}
            <motion.div
              className="hidden lg:block absolute z-20 w-60"
              style={{ left: "-64px", top: "30%" }}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div
                className="rounded-2xl p-4"
                style={{ background: "#ffffff", border: "1px solid #e5e7eb", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: "#111827" }} />
                  <span className="text-xs font-semibold" style={{ color: "#111827" }}>En ligne sur LinkedIn</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <TrendingUp className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: "#6b7280" }} />
                  <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>
                    Nous venons de dépasser les 10 000 abonnés. Merci à tous...
                  </p>
                </div>
                <div className="mt-2.5 pt-2 flex gap-3" style={{ borderTop: "1px solid #f3f4f6" }}>
                  <span className="text-[10px]" style={{ color: "#d1d5db" }}>142 impressions</span>
                  <span className="text-[10px]" style={{ color: "#d1d5db" }}>·</span>
                  <span className="text-[10px]" style={{ color: "#d1d5db" }}>23 likes</span>
                </div>
              </div>
            </motion.div>

            {/* Floating card — AI writing */}
            <motion.div
              className="hidden lg:block absolute z-20 w-52"
              style={{ right: "-56px", top: "8%" }}
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <div
                className="rounded-2xl p-4"
                style={{ background: "#ffffff", border: "1px solid #e5e7eb", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-3.5 h-3.5" style={{ color: "#6b7280" }} />
                  <span className="text-xs font-semibold" style={{ color: "#111827" }}>Génération en cours...</span>
                </div>
                <div className="space-y-2">
                  {[100, 75, 90, 40].map((w, i) => (
                    <div
                      key={i}
                      className="h-2 rounded-full"
                      style={{
                        width: `${w}%`,
                        background: i === 3 ? "#d1d5db" : "#f3f4f6",
                        animation: i === 3 ? "pulse 1.8s infinite" : undefined,
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Floating card — analytics */}
            <motion.div
              className="hidden lg:block absolute z-20 w-48"
              style={{ right: "-36px", bottom: "15%" }}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            >
              <div
                className="rounded-2xl p-4"
                style={{ background: "#ffffff", border: "1px solid #e5e7eb", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium" style={{ color: "#6b7280" }}>Engagement</span>
                  <span className="text-xs font-bold" style={{ color: "#111827" }}>↑ 240%</span>
                </div>
                <div className="flex items-end gap-1 h-10">
                  {[30, 45, 35, 62, 50, 78, 95].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm"
                      style={{
                        height: `${h}%`,
                        background: i === 6 ? "#374151" : "#e5e7eb",
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            <DashboardMockup />
          </motion.div>
        </div>
      </section>

      {/* ── Platforms ─────────────────────────────────────────── */}
      <section
        id="platforms"
        className="py-20 px-4"
        style={{ background: "#ffffff", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}
      >
        <div className="max-w-4xl mx-auto">
          <Section>
            <motion.p
              variants={fadeUp}
              className="text-center text-xs font-bold tracking-widest uppercase mb-10"
              style={{ color: "#94a3b8" }}
            >
              Publiez sur toutes vos plateformes favorites
            </motion.p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {PLATFORMS.map((p) => (
                <motion.div
                  key={p.name}
                  variants={fadeUp}
                  whileHover={{ y: -3, scale: 1.02 }}
                  className="flex items-center gap-3 p-4 rounded-2xl cursor-default transition-all duration-200"
                  style={{ background: p.bg, border: `1.5px solid ${p.border}` }}
                >
                  <div style={{ color: p.color }}><p.Svg /></div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "#0f172a" }}>{p.name}</div>
                    <div className="text-xs" style={{ color: "#94a3b8" }}>{p.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section id="features" className="py-28 px-4" style={{ background: "#f8fafc" }}>
        <div className="max-w-6xl mx-auto">
          <Section>
            <motion.div variants={fadeUp} className="text-center mb-16">
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 text-sm font-medium"
                style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", color: "#7c3aed" }}
              >
                <Zap className="w-3.5 h-3.5" />
                Tout ce dont vous avez besoin
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4" style={{ color: "#0f172a" }}>
                Conçu pour les équipes modernes
              </h2>
              <p className="text-lg max-w-xl mx-auto" style={{ color: "#475569" }}>
                De la génération IA à la publication multi-plateforme — chaque outil dans un espace de travail fluide.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map((f) => (
                <motion.div
                  key={f.title}
                  variants={fadeUp}
                  whileHover={{ y: -3 }}
                  className="group p-6 rounded-2xl cursor-default transition-all duration-200"
                  style={{
                    background: "#ffffff",
                    border: "1.5px solid #e2e8f0",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: f.bg }}
                  >
                    <f.Icon className="w-5 h-5" style={{ color: f.accent }} />
                  </div>
                  <h3 className="font-semibold text-base mb-2" style={{ color: "#0f172a" }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section
        id="how-it-works"
        className="py-28 px-4"
        style={{ background: "#ffffff", borderTop: "1px solid #e2e8f0" }}
      >
        <div className="max-w-5xl mx-auto">
          <Section>
            <motion.div variants={fadeUp} className="text-center mb-16">
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 text-sm font-medium"
                style={{ background: "#ecfdf5", border: "1px solid #6ee7b7", color: "#059669" }}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Comment ça marche
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4" style={{ color: "#0f172a" }}>
                De l'idée à la publication en minutes
              </h2>
              <p className="text-lg max-w-xl mx-auto" style={{ color: "#475569" }}>
                Trois étapes simples pour transformer votre stratégie de contenu grâce à l'IA.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {STEPS.map((step, i) => (
                <motion.div key={step.num} variants={fadeUp} className="relative">
                  {i < STEPS.length - 1 && (
                    <div
                      className="hidden md:block absolute top-8 h-px"
                      style={{
                        left: "calc(100% + 16px)",
                        width: "calc(100% - 16px)",
                        background: "linear-gradient(to right, #e2e8f0, transparent)",
                      }}
                    />
                  )}
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold mb-6"
                    style={{ background: step.bg, color: step.color, border: `1.5px solid ${step.color}28` }}
                  >
                    {step.num}
                  </div>
                  <h3 className="font-bold text-xl mb-3" style={{ color: "#0f172a" }}>{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────── */}
      <section
        className="py-20 px-4"
        style={{ background: "#eff6ff", borderTop: "1px solid #bfdbfe", borderBottom: "1px solid #bfdbfe" }}
      >
        <div className="max-w-5xl mx-auto">
          <Section>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {STATS.map((s) => (
                <motion.div key={s.label} variants={fadeUp}>
                  <div
                    className="text-4xl md:text-5xl font-bold mb-2 bg-clip-text"
                    style={{
                      backgroundImage: "linear-gradient(135deg,#2563eb,#7c3aed)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {s.value}
                  </div>
                  <div className="text-sm font-medium" style={{ color: "#64748b" }}>{s.label}</div>
                </motion.div>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────── */}
      <section className="py-32 px-4" style={{ background: "#f8fafc" }}>
        <Section className="max-w-2xl mx-auto text-center">
          <motion.div
            variants={fadeUp}
            className="rounded-3xl p-12 md:p-16"
            style={{
              background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%)",
              boxShadow: "0 20px 60px rgba(37,99,235,0.30)",
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl mx-auto mb-8 flex items-center justify-center overflow-hidden"
            >
              <img src="/logo1.png" alt="AiContentFlow" className="w-full h-full object-cover" />
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
              Prêt à créer plus intelligemment ?
            </h2>
            <p className="text-lg leading-relaxed mb-10" style={{ color: "rgba(255,255,255,0.75)" }}>
              Rejoignez les équipes qui créent un meilleur contenu en moins de temps.
              Commencez gratuitement, évoluez quand vous êtes prêt.
            </p>

            <Link
              to="/app/register"
              className="group inline-flex items-center gap-2 font-semibold px-10 py-4 rounded-2xl transition-all no-underline text-base"
              style={{
                background: "#ffffff",
                color: "#2563eb",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              }}
            >
              Commencer gratuitement
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8">
              {["Sans carte bancaire", "Plan gratuit pour toujours", "Annulation libre"].map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" style={{ color: "#86efac" }} />
                  <span className="text-sm" style={{ color: "rgba(255,255,255,0.60)" }}>{t}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </Section>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer
        className="px-4 py-10"
        style={{ background: "#ffffff", borderTop: "1px solid #e2e8f0" }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <img src="/logo1.png" alt="AiContentFlow" className="h-8 w-8 rounded-lg object-cover" />
            <span className="font-semibold text-sm" style={{ color: "#475569" }}>AiContentFlow</span>
          </div>

          <div className="flex items-center gap-6">
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-sm transition-colors"
                style={{ color: "#94a3b8", textDecoration: "none" }}
              >
                {l.label}
              </a>
            ))}
          </div>

          <p className="text-sm" style={{ color: "#cbd5e1" }}>
            © AiContentFlow. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
