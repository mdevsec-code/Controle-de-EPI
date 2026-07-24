import type { EpiCatalogItem, FoundEmployee } from "./types";

export const MOCK_EMPLOYEE: FoundEmployee = {
  id: "1",
  name: "Joao Carlos da Silva",
  registration: "2541",
  status: "Ativo",
  role: "Soldador",
  company: "EngeNova",
  costCenter: "Obras Industriais",
};

export const MOCK_EPI_CATALOG: EpiCatalogItem[] = [
  { id: "1", name: "Mascara PFF2", ca: "12345" },
  { id: "2", name: "Luva Raspa", ca: "20981" },
  { id: "3", name: "Oculos de Seguranca", ca: "31456" },
  { id: "4", name: "Protetor Auricular", ca: "40912" },
  { id: "5", name: "Respirador", ca: "51234" },
  { id: "6", name: "Luva Vaqueta", ca: "60987" },
  { id: "7", name: "Avental", ca: "71234" },
  { id: "8", name: "Bota de Seguranca", ca: "81456" },
  { id: "9", name: "Colete Refletivo", ca: "91234" },
];

export const DELIVERY_REASONS = [
  "Desgaste",
  "Dano",
  "Rotina",
  "Atividade especial",
  "Perda",
  "Extravio",
  "Novo colaborador",
  "Outro",
] as const;

export const MOCK_RECENT_DELIVERIES = [
  { id: "1", name: "Joao Silva", registration: "2541", time: "08:10" },
  { id: "2", name: "Carlos Souza", registration: "1987", time: "08:25" },
  { id: "3", name: "Pedro Santos", registration: "1122", time: "08:37" },
];

export const MOCK_HISTORY = [
  { id: "1", time: "08:46", name: "Joao Carlos da Silva", epi: "Mascara PFF2", quantity: 1 },
  { id: "2", time: "08:37", name: "Pedro Santos", epi: "Oculos de Seguranca", quantity: 1 },
  { id: "3", time: "08:25", name: "Carlos Souza", epi: "Luva Raspa", quantity: 2 },
  { id: "4", time: "08:10", name: "Joao Silva", epi: "Protetor Auricular", quantity: 1 },
  { id: "5", time: "07:58", name: "Marcos Lima", epi: "Avental", quantity: 1 },
];
