export type CaSituation = "VALIDO" | "VENCIDO" | "CANCELADO";

export interface EpiCA {
  id: string;
  epiItemId: string;
  number: string;
  issuedAt: Date;
  expiresAt: Date;
  situation: CaSituation;
  createdAt: Date;
}

export interface CreateEpiCaData {
  epiItemId: string;
  number: string;
  issuedAt: Date;
  expiresAt: Date;
  situation?: CaSituation;
}

export interface EpiCaRepository {
  create(data: CreateEpiCaData): Promise<EpiCA>;
  listByEpiItem(epiItemId: string): Promise<EpiCA[]>;
}
