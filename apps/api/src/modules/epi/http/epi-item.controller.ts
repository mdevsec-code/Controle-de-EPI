import type { Request, Response } from "express";
import { paginationQuerySchema } from "../../../shared/pagination.js";
import type { EpiItemService } from "../application/epi-item.service.js";
import { listEpiItemQuerySchema } from "./epi-item.schemas.js";

export class EpiItemController {
  constructor(private readonly epiItemService: EpiItemService) {}

  create = async (req: Request, res: Response) => {
    const item = await this.epiItemService.create(req.body);
    res.status(201).json(item);
  };

  update = async (req: Request, res: Response) => {
    const item = await this.epiItemService.update(req.params.id as string, req.body);
    res.status(200).json(item);
  };

  getById = async (req: Request, res: Response) => {
    const item = await this.epiItemService.getOrThrow(req.params.id as string);
    res.status(200).json(item);
  };

  list = async (req: Request, res: Response) => {
    const { page, pageSize } = paginationQuerySchema.parse(req.query);
    const { category } = listEpiItemQuerySchema.parse(req.query);
    const result = await this.epiItemService.list(category, page, pageSize);
    res.status(200).json(result);
  };
}
