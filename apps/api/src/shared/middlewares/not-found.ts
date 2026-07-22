import type { Request, Response } from "express";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ message: `Rota nao encontrada: ${req.method} ${req.originalUrl}` });
}
