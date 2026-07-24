import type { Request, Response } from "express";
import { paginationQuerySchema } from "../../../shared/pagination.js";
import type { CompanyService } from "../application/company.service.js";

export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  create = async (req: Request, res: Response) => {
    const company = await this.companyService.create(req.body);
    res.status(201).json(company);
  };

  update = async (req: Request, res: Response) => {
    const company = await this.companyService.update(req.params.id as string, req.body);
    res.status(200).json(company);
  };

  getById = async (req: Request, res: Response) => {
    const company = await this.companyService.getOrThrow(req.params.id as string);
    res.status(200).json(company);
  };

  list = async (req: Request, res: Response) => {
    const { page, pageSize } = paginationQuerySchema.parse(req.query);
    const result = await this.companyService.list(page, pageSize);
    res.status(200).json(result);
  };
}
