import type { Request, Response } from "express";
import type { EpiCaService } from "../application/epi-ca.service.js";

export class EpiCaController {
  constructor(private readonly epiCaService: EpiCaService) {}

  register = async (req: Request, res: Response) => {
    const epiItemId = req.params.epiItemId as string;
    const ca = await this.epiCaService.register({ epiItemId, ...req.body });
    res.status(201).json(ca);
  };

  history = async (req: Request, res: Response) => {
    const epiItemId = req.params.epiItemId as string;
    const cas = await this.epiCaService.history(epiItemId);
    res.status(200).json(cas);
  };
}
