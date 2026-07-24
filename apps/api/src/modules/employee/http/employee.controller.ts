import type { Request, Response } from "express";
import { paginationQuerySchema } from "../../../shared/pagination.js";
import type { EmployeeService } from "../application/employee.service.js";
import { listEmployeeQuerySchema } from "./employee.schemas.js";

export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  create = async (req: Request, res: Response) => {
    const employee = await this.employeeService.create(req.body);
    res.status(201).json(employee);
  };

  update = async (req: Request, res: Response) => {
    const employee = await this.employeeService.update(req.params.id as string, req.body);
    res.status(200).json(employee);
  };

  getById = async (req: Request, res: Response) => {
    const employee = await this.employeeService.getOrThrow(req.params.id as string);
    res.status(200).json(employee);
  };

  list = async (req: Request, res: Response) => {
    const { page, pageSize } = paginationQuerySchema.parse(req.query);
    const filters = listEmployeeQuerySchema.parse(req.query);
    const result = await this.employeeService.list(filters, page, pageSize);
    res.status(200).json(result);
  };

  block = async (req: Request, res: Response) => {
    const employee = await this.employeeService.block(req.params.id as string);
    res.status(200).json(employee);
  };

  unblock = async (req: Request, res: Response) => {
    const employee = await this.employeeService.unblock(req.params.id as string);
    res.status(200).json(employee);
  };

  terminate = async (req: Request, res: Response) => {
    const employee = await this.employeeService.terminate(
      req.params.id as string,
      req.body.terminationDate,
    );
    res.status(200).json(employee);
  };
}
