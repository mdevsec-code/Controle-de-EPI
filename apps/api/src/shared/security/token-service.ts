import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../env.js";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

export interface AccessTokenPayload {
  sub: string;
  role: string;
}

export interface RefreshTokenData {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface TokenService {
  signAccessToken(payload: AccessTokenPayload): string;
  verifyAccessToken(token: string): AccessTokenPayload;
  generateRefreshToken(): RefreshTokenData;
  hashRefreshToken(token: string): string;
}

function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const jwtTokenService: TokenService = {
  signAccessToken(payload) {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
  },

  verifyAccessToken(token) {
    return jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
  },

  generateRefreshToken() {
    const token = crypto.randomBytes(64).toString("hex");
    return {
      token,
      tokenHash: hashRefreshToken(token),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    };
  },

  hashRefreshToken,
};
