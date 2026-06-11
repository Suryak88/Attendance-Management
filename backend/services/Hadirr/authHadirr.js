import jwt from "jsonwebtoken";
import axios from "axios";
import { isoUTCToTime } from "../../utils/date.js";
import { HADIRR_CONFIG } from "../../config/hadirrConfig.js";

const tokenCache = new Map();

export async function getValidHadirrToken(group) {
  const now = Date.now();

  const config = HADIRR_CONFIG[group];

  if (!config) {
    throw new Error("Invalid Hadirr group");
  }

  const cached = tokenCache.get(group);

  if (cached && now < cached.expiredAt - 120000) {
    return cached.token;
  }

  const response = await axios.post(
    "https://developer.hadirr.com/v0/auth",
    {},
    {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
      },
    },
  );

  const token = response.headers["x-access-token"];

  if (!token) {
    throw new Error("Failed to get Hadirr access token");
  }

  const decoded = jwt.decode(token);

  const expiredAt = decoded.exp * 1000;

  tokenCache.set(group, { token, expiredAt });

  console.log(
    `New ${group} Hadirr token expires at:`,
    isoUTCToTime(new Date(expiredAt)),
  );

  console.log(`Token ${group}: ${token} berlaku sampai ${expiredAt}`);
  return token;
}

export function clearHadirrTokenCache(group) {
  tokenCache.delete(group);
}
