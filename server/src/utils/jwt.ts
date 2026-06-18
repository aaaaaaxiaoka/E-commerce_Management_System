import jwt, { JwtPayload } from "jsonwebtoken";
import { config } from "../config";

export interface TokenPayload extends JwtPayload {
  userId: number;
  username: string;
}

export function signAccessToken(payload: { userId: number; username: string }) {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpires as any,
  });
}

export function signRefreshToken(payload: { userId: number; username: string }) {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpires as any,
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwt.accessSecret) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
}
