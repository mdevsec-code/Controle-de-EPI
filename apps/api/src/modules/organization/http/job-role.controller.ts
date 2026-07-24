import type { Request, Response } from "express";
import { paginationQuerySchema } from "../../../shared/pagination.js";
import type { JobRoleService } from "../application/job-role.service.js";

export class JobRoleController {
  constructor(private readonly jobRoleService: JobRoleService) {}

  create = async (req: Request, res: Response) => {
    const jobRole = await this.jobRoleService.create(req.body);
    res.status(201).json(jobRole);
  };

  update = async (req: Request, res: Response) => {
    const jobRole = await this.jobRoleService.update(req.params.id as string, req.body);
    res.status(200).json(jobRole);
  };

  getById = async (req: Request, res: Response) => {
    const jobRole = await this.jobRoleService.getOrThrow(req.params.id as string);
    res.status(200).json(jobRole);
  };

  list = async (req: Request, res: Response) => {
    const { page, pageSize } = paginationQuerySchema.parse(req.query);
    const result = await this.jobRoleService.list(page, pageSize);
    res.status(200).json(result);
  };
}
