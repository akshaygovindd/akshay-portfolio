import crypto from "node:crypto";
import { getSql } from "./db";

export const PER_IP_PER_HOUR = 10;
export const GLOBAL_PER_DAY = 200;

/** HMAC of the IP with a server-side salt: the raw address is never stored and cannot be brute-forced without the salt. */
export function hashIp(ip: string): string {
  const salt = process.env.RATE_LIMIT_SALT;
  if (!salt) throw new Error("RATE_LIMIT_SALT is not set");
  return crypto.createHmac("sha256", salt).update(ip).digest("hex");
}

export type Limit = "ok" | "ip" | "global";

/** Counts this question and says whether it may proceed. Atomic upserts, so concurrent requests cannot slip past. */
export async function checkLimits(ip: string): Promise<Limit> {
  const sql = getSql();
  const [row] = await sql`
    insert into rate_limits (ip_hash, window_start, count) values (${hashIp(ip)}, date_trunc('hour', now()), 1)
    on conflict (ip_hash, window_start) do update set count = rate_limits.count + 1
    returning count`;
  if (Number(row.count) > PER_IP_PER_HOUR) return "ip";
  const [g] = await sql`
    insert into rate_limits (ip_hash, window_start, count) values ('__global__', date_trunc('day', now()), 1)
    on conflict (ip_hash, window_start) do update set count = rate_limits.count + 1
    returning count`;
  // opportunistic cleanup of old buckets (cheap: tiny table)
  if (Math.random() < 0.05) await sql`delete from rate_limits where window_start < now() - interval '2 days'`;
  return Number(g.count) > GLOBAL_PER_DAY ? "global" : "ok";
}
