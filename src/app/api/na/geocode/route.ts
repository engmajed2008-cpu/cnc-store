import { NextRequest, NextResponse } from "next/server";

const BASE = "https://apina.address.gov.sa/NationalAddress/v3.1/Address";
const KEY  = process.env.NATIONAL_ADDRESS_API_KEY ?? "";

export async function GET(req: NextRequest) {
  if (!KEY) return NextResponse.json({ error: "API key not configured" }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const lat  = searchParams.get("lat");
  const long = searchParams.get("long");
  const lang = searchParams.get("lang") ?? "A"; // A=Arabic, E=English

  if (!lat || !long) return NextResponse.json({ error: "lat and long required" }, { status: 400 });

  try {
    const url = `${BASE}/address-geocode?language=${lang}&format=json&encode=utf8&lat=${lat}&long=${long}`;
    const res = await fetch(url, {
      headers: { "api_key": KEY, "Cache-Control": "no-cache" },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `API error: ${res.status}`, detail: text }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
