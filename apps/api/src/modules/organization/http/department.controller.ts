import type { Request, Response } from "express";
import { paginationQuerySchema } from "../../../shared/pagination.js";
import type { DepartmentService } from "../application/department.service.js";
import { listDepartmentQuerySchema } from "./department.schemas.js";

export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  create = async (req: Request, res: Response) => {
    const department = await this.departmentService.create(req.body);
    res.status(201).json(department);
  };

  update = async (req: Request, res: Response) => {
    const department = await this.departmentService.update(req.params.id as string, req.body);
    res.status(200).json(department);
  };

  getById = async (req: Request, res: Response) => {
    const department = await this.departmentService.getOrThrow(req.params.id as string);
    res.status(200).json(department);
  };

  list = async (req: Request, res: Response) => {
    const { page, pageSize } = paginationQuerySchema.parse(req.query);
    const { businessUnitId } = listDepartmentQuerySchema.parse(req.query);
    const result = await this.departmentService.list(businessUnitId, page, pageSize);
    res.status(200).json(result);
  };
}
