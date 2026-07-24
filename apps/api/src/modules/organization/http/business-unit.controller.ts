import type { Request, Response } from "express";
import { paginationQuerySchema } from "../../../shared/pagination.js";
import type { BusinessUnitService } from "../application/business-unit.service.js";
import { listBusinessUnitQuerySchema } from "./business-unit.schemas.js";

export class BusinessUnitController {
  constructor(private readonly businessUnitService: BusinessUnitService) {}

  create = async (req: Request, res: Response) => {
    const unit = await this.businessUnitService.create(req.body);
    res.status(201).json(unit);
  };

  update = async (req: Request, res: Response) => {
    const unit = await this.businessUnitService.update(req.params.id as string, req.body);
    res.status(200).json(unit);
  };

  getById = async (req: Request, res: Response) => {
    const unit = await this.businessUnitService.getOrThrow(req.params.id as string);
    res.status(200).json(unit);
  };

  list = async (req: Request, res: Response) => {
    const { page, pageSize } = paginationQuerySchema.parse(req.query);
    const { companyId } = listBusinessUnitQuerySchema.parse(req.query);
    const result = await this.businessUnitService.list(companyId, page, pageSize);
    res.status(200).json(result);
  };
}
