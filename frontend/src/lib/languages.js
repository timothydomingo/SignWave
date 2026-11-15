export const LANGUAGES = [
  { code: "en", label: "English", short: "EN", speechLang: "en-US", native: "English" },
  { code: "es", label: "Spanish", short: "ES", speechLang: "es-ES", native: "Español" },
];

export const VOICES = [
  { id: "female", name: "Female", gender: "female" },
  { id: "male", name: "Male", gender: "male" },
];

export function languageByCode(code) {
  return LANGUAGES.find((item) => item.code === code) ?? LANGUAGES[0];
}

export function voiceById(id) {
  return VOICES.find((item) => item.id === id) ?? VOICES[0];
}