export interface FoundEmployee {
  id: string;
  name: string;
  registration: string;
  status: "Ativo" | "Bloqueado" | "Inativo";
  role: string;
  company: string;
  costCenter: string;
  photoUrl?: string;
}

export interface EpiCatalogItem {
  id: string;
  name: string;
  ca: string;
}

export interface SelectedEpiEntry {
  epi: EpiCatalogItem;
  quantity: number;
  notes: string;
}
