export type EpiControlType = "LOTE" | "PATRIMONIO" | "INDIVIDUAL";

export interface EpiItem {
  id: string;
  name: string;
  internalCode: string;
  barcode: string | null;
  category: string;
  manufacturer: string;
  model: string | null;
  controlType: EpiControlType;
  photoUrl: string | null;
  manualUrl: string | null;
  minQuantity: number;
  maxQuantity: number | null;
  unitValue: number | null;
  usefulLifeDays: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEpiItemData {
  name: string;
  internalCode: string;
  barcode?: string;
  category: string;
  manufacturer: string;
  model?: string;
  controlType: EpiControlType;
  photoUrl?: string;
  manualUrl?: string;
  minQuantity?: number;
  maxQuantity?: number;
  unitValue?: number;
  usefulLifeDays?: number;
}

export type UpdateEpiItemData = Partial<Omit<CreateEpiItemData, "internalCode">>;

export interface EpiItemRepository {
  create(data: CreateEpiItemData): Promise<EpiItem>;
  update(id: string, data: UpdateEpiItemData): Promise<EpiItem>;
  findById(id: string): Promise<EpiItem | null>;
  findByInternalCode(internalCode: string): Promise<EpiItem | null>;
  list(params: {
    category?: string;
    skip: number;
    take: number;
  }): Promise<{ items: EpiItem[]; total: number }>;
}
