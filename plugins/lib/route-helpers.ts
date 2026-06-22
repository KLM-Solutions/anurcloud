import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

export function fail(code: string, message: string, status: number) {
  return NextResponse.json({ status: "error", error: { code, message } }, { status });
}

export function tokenMatches(token: string): boolean {
  const expected = process.env.EXTRACT_AUTH_TOKEN;
  if (!expected) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
