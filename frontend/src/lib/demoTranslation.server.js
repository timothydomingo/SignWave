// Server-only demo language service.
//
// This module is the single place where recognized signs become a clean English
// sentence and, optionally, a translation. It currently uses a small sample
// library so nothing pretends an AI service is connected.
//
// When Gemini is added, read its key inside this module with:
//   import { secrets } from "base44:runtime";
//   const apiKey = secrets.get("GOOGLE_GEMINI_API_KEY");
// and return the same shape: { english, translated, language, demo, notice }.

const SAMPLE_LIBRARY = [
  {
    key: "hello my name sarah",
    en: "Hello, my name is Sarah.",
    es: "Hola, me llamo Sarah.",
    fr: "Bonjour, je m'appelle Sarah.",
  },
  {
    key: "how are you",
    en: "How are you?",
    es: "¿Cómo estás?",
    fr: "Comment allez-vous ?",
  },
  {
    key: "i need water please",
    en: "I need some water, please.",
    es: "Necesito agua, por favor.",
    fr: "J'ai besoin d'eau, s'il vous plaît.",
  },
  {
    key: "thank you for your help",
    en: "Thank you for your help.",
    es: "Gracias por tu ayuda.",
    fr: "Merci pour votre aide.",
  },
  {
    key: "where is the bathroom",
    en: "Where is the bathroom?",
    es: "¿Dónde está el baño?",
    fr: "Où sont les toilettes ?",
  },
  {
    key: "please slow down and repeat",
    en: "Please slow down and repeat that.",
    es: "Más despacio, por favor, y repite.",
    fr: "Plus lentement, s'il vous plaît, et répétez.",
  },
  {
    key: "nice to meet you",
    en: "It's nice to meet you.",
    es: "Encantado de conocerte.",
    fr: "Enchanté de vous rencontrer.",
  },
];

const QUESTION_STARTS = ["who", "what", "where", "when", "why", "how", "which", "can", "do", "does", "are", "is"];

function normalize(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9' ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tidyEnglish(text) {
  const trimmed = String(text ?? "").trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  if (/[.!?]$/.test(capitalized)) return capitalized;
  const firstWord = trimmed.split(" ")[0].toLowerCase();
  return capitalized + (QUESTION_STARTS.includes(firstWord) ? "?" : ".");
}

function fromGlosses(glosses) {
  const joined = glosses.join(" ");
  const english = tidyEnglish(joined.toLowerCase().replace(/-/g, " "));
  return english;
}

export function buildDemoTranslation({ glosses = [], manualText = "", language = "en" }) {
  const typed = String(manualText ?? "").trim();

  if (typed) {
    const english = tidyEnglish(typed);
    const match = SAMPLE_LIBRARY.find((entry) => normalize(entry.en) === normalize(english));
    const translated = match ? match[language] ?? match.en : english;
    return {
      english,
      translated,
      language,
      demo: true,
      notice: match
        ? null
        : "Live translation isn't connected yet, so this sentence stays in English until the translation service is added.",
    };
  }

  const english = fromGlosses(glosses);
  const match = SAMPLE_LIBRARY.find((entry) => entry.key === normalize(glosses.join(" ")));

  if (match) {
    return {
      english: match.en,
      translated: match[language] ?? match.en,
      language,
      demo: true,
      notice: null,
    };
  }

  return {
    english,
    translated: english,
    language,
    demo: true,
    notice:
      "This phrasing is outside the sample library, so it stays in English until the translation service is connected.",
  };
}