import type { AuthContext } from "../shared/http/auth-context.js";

declare global {
  namespace Express {
    interface Request {
      /** Preenchido pelo middleware `authenticate`. */
      auth?: AuthContext;
    }
  }
}

export {};
