import type { AssistantLanguage } from "./assistant.types";

export const ASSISTANT_COLORS = {
  primary: "#6D28D9",
  primaryDark: "#4C1D95",
  accent: "#8B5CF6",
  surface: "#FFFFFF",
  bg: "#F5F3FF",
  border: "#EDE9FE",
  text: "#1C1917",
  muted: "#78716C",
  online: "#10B981",
} as const;

export const STATIC_SUGGESTIONS: Record<AssistantLanguage, string[]> = {
  fr: [
    "Comment utiliser la plateforme ?",
    "Expliquer Brand DNA",
    "Comment utiliser le Scheduler ?",
    "Quel est le workflow complet ?",
  ],
  en: [
    "How can I use the platform?",
    "Explain Brand DNA",
    "How can I use the Scheduler?",
    "What is the full workflow?",
  ],
  ar: [
    "كيف أستعمل المنصة؟",
    "اشرح لي Brand DNA",
    "كيف أستعمل Scheduler؟",
    "ما هو سير العمل الكامل؟",
  ],
};

export function getWelcomeMessage(lang: AssistantLanguage): string {
  if (lang === "en") {
    return "👋 Hello! I'm contentflow AI assistant, your AI marketing copilot.\n\nI can guide you through the platform, explain the agents, help with workflows, or answer general questions.";
  }
  if (lang === "ar") {
    return "👋 مرحبًا! أنا contentflow AI assistant، مساعدك الذكي للتسويق.\n\nيمكنني مساعدتك في استعمال المنصة، شرح الوكلاء، فهم سير العمل، أو الإجابة عن أسئلتك العامة.";
  }
  return "👋 Bonjour ! Je suis contentflow AI assistant, votre copilote IA marketing.\n\nJe peux vous guider dans la plateforme, expliquer les agents, vous aider avec le workflow ou répondre à vos questions générales.";
}

export function getInputPlaceholder(lang: AssistantLanguage): string {
  if (lang === "en") return "Ask contentflow a question...";
  if (lang === "ar") return "اسأل contentflow سؤالًا...";
  return "Posez une question à contentflow...";
}

export function getTagline(lang: AssistantLanguage): string {
  if (lang === "en") return "AI Marketing Copilot";
  if (lang === "ar") return "مساعد التسويق الذكي";
  return "AI Marketing Copilot";
}

export function getOfflineError(lang: AssistantLanguage): string {
  if (lang === "en") return "Backend connection unavailable. Local fallback answer displayed.";
  if (lang === "ar") return "الاتصال بالخادم غير متاح. تم عرض إجابة محلية.";
  return "Connexion backend indisponible. Réponse locale affichée.";
}

export function getUnavailableError(lang: AssistantLanguage): string {
  if (lang === "en") {
    return "The AI assistant is unavailable. Ensure LocalBackend mode is enabled and the AI service is running.";
  }
  if (lang === "ar") {
    return "المساعد الذكي غير متاح. تأكد من تفعيل LocalBackend وتشغيل خدمة الذكاء الاصطناعي.";
  }
  return "L'assistant IA est indisponible. Vérifiez le mode LocalBackend et que le service AI est démarré.";
}

export function localFallbackAnswer(message: string, lang: AssistantLanguage): string {
  const lower = message.toLowerCase();

  if (lang === "en") {
    if (
      lower.includes("workflow") ||
      lower.includes("platform") ||
      lower.includes("start") ||
      lower.includes("use")
    ) {
      return "Recommended workflow:\n\nFull campaign:\n1. Brand DNA: create, analyze, or select a brand.\n2. Strategy: generate the marketing strategy.\n3. Planning: create the editorial plan.\n4. Campaign Content: generate campaign posts.\n5. Creative: generate posters, infographics, or carousel slide images when needed.\n6. Calendar: schedule posts in the calendar.\n7. Analytics: review or simulate performance.\n\nSingle post:\n1. Generate: create one post from a brief.\n2. Creative: generate the poster if needed.\n3. Schedule: select the exact date and time.\n4. Calendar: verify the scheduled post.";
    }
    return "I can help you understand the platform, explain agents, guide workflows, or answer general questions.";
  }

  if (lang === "ar") {
    return "يمكنني مساعدتك في فهم المنصة، شرح الوكلاء، إرشادك في سير العمل، أو الإجابة عن أسئلتك العامة.";
  }

  if (
    lower.includes("workflow") ||
    lower.includes("utiliser") ||
    lower.includes("plateforme") ||
    lower.includes("commencer")
  ) {
    return "Voici le workflow recommandé :\n\nParcours campagne complète :\n1. Brand DNA : créez, analysez ou sélectionnez une marque.\n2. Strategy : générez la stratégie marketing.\n3. Planning : créez le planning éditorial.\n4. Campaign Content : générez les posts de campagne.\n5. Creative : générez les affiches, infographies ou slides carousel si nécessaire.\n6. Calendar : planifiez les posts dans le calendrier.\n7. Analytics : consultez ou simulez les performances.\n\nParcours post unique :\n1. Generate : créez un post depuis un brief.\n2. Creative : générez l'affiche si besoin.\n3. Schedule : choisissez la date et l'heure exactes.\n4. Calendar : vérifiez le post planifié.";
  }

  if (lower.includes("brand")) {
    return "Brand DNA permet d'importer ou de saisir l'identité de votre marque (ton, audience, piliers de contenu). C'est la base utilisée par tous les agents IA de la plateforme.";
  }

  return "Je peux vous aider à comprendre la plateforme, expliquer les agents, vous guider dans le workflow ou répondre à vos questions générales.";
}
