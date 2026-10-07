import {
  Ear,
  Footprints,
  Glasses,
  Hand,
  HardHat,
  ShieldCheck,
  Shirt,
  Wind,
  type LucideIcon,
} from "lucide-react";

const RULES: [RegExp, LucideIcon][] = [
  [/respirat|mascara|pff|respirador/, Wind],
  [/\bmaos?\b|luva/, Hand],
  [/olho|oculos|visual|facial/, Glasses],
  [/audit|auricular|ouvido/, Ear],
  [/\bpes?\b|bota|calcado|sapato/, Footprints],
  [/tronco|colete|avental|vestimenta|roupa/, Shirt],
  [/cabeca|capacete/, HardHat],
];

/** Minusculas e sem acentos (remove os diacriticos combinantes apos NFD). */
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/** Icone do EPI a partir da categoria (ou do nome), com escudo como padrao. */
export function epiIcon(category: string, name = ""): LucideIcon {
  const text = normalize(`${category} ${name}`);
  return RULES.find(([pattern]) => pattern.test(text))?.[1] ?? ShieldCheck;
}
