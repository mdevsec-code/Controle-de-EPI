import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().default(3333),
  DATABASE_URL: z.string().min(1, "DATABASE_URL e obrigatorio"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET deve ter pelo menos 32 caracteres"),
  /**
   * Origem permitida para CORS. Em producao o web serve a SPA e faz proxy de /api (mesmo site),
   * entao CORS so e necessario quando web e API rodam em origens diferentes (ex.: dev sem proxy).
   */
  CORS_ORIGIN: z.url().optional(),
  /** Valor repassado a app.set("trust proxy"): numero de proxies confiaveis a frente da API. */
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Variaveis de ambiente invalidas:", z.flattenError(parsed.error).fieldErrors);
  throw new Error("Configuracao de ambiente invalida - verifique o arquivo .env");
}

if (parsed.data.NODE_ENV === "production" && parsed.data.JWT_SECRET.startsWith("troque-")) {
  throw new Error("JWT_SECRET de exemplo nao pode ser usado em producao");
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === "production";
