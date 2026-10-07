import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { USER_ROLES, type UserRole } from "@epi-manager/contracts";
import { z } from "zod";
import { env } from "../env.js";

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const ISSUER = "epi-manager-api";
const AUDIENCE = "epi-manager-web";

export interface AccessTokenClaims {
  sub: string;
  role: UserRole;
  /** tokenVersion do usuario no momento da emissao. */
  ver: number;
}

const claimsSchema = z.object({
  sub: z.string().min(1),
  role: z.enum(USER_ROLES),
  ver: z.number().int().min(0),
});

export interface RefreshTokenData {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface TokenService {
  signAccessToken(claims: AccessTokenClaims): string;
  /** Lanca se o token for invalido, expirado ou com claims malformadas. */
  verifyAccessToken(token: string): AccessTokenClaims;
  generateRefreshToken(): RefreshTokenData;
  hashRefreshToken(token: string): string;
}

function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const jwtTokenService: TokenService = {
  signAccessToken(claims) {
    return jwt.sign(claims, env.JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      issuer: ISSUER,
      audience: AUDIENCE,
    });
  },

  verifyAccessToken(token) {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    return claimsSchema.parse(payload);
  },

  generateRefreshToken() {
    const token = crypto.randomBytes(48).toString("base64url");
    return {
      token,
      tokenHash: hashRefreshToken(token),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    };
  },

  hashRefreshToken,
};
