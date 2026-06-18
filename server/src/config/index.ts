import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 3000,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || "access-secret",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "refresh-secret",
    accessExpires: process.env.ACCESS_TOKEN_EXPIRES || "15m",
    refreshExpires: process.env.REFRESH_TOKEN_EXPIRES || "7d",
  },
};
