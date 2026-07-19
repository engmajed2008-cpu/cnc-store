import { NextRequest, NextResponse } from "next/server";

const BASE = "https://apina.address.gov.sa/NationalAddress/v3.1/Address";
const KEY  = process.env.NATIONAL_ADDRESS_API_KEY ?? "";

export async function GET(req: NextRequest) {
  if (!KEY) return NextResponse.json({ error: "API key not configured" }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const building   = searchParams.get("building");   // 4-digit building number
  const zipcode    = searchParams.get("zipcode");    // 5-digit zip code
  const additional = searchParams.get("additional"); // 4-digit additional number
  const lang       = searchParams.get("lang") ?? "A";

  if (!building || !zipcode || !additional) {
    return NextResponse.json({ error: "building, zipcode, and additional are required" }, { status: 400 });
  }

  try {
    const url = `${BASE}/address-verify?language=${lang}&format=json&encode=utf8&buildingnumber=${building}&zipcode=${zipcode}&additionalnumber=${additional}`;
    const res = await fetch(url, {
      headers: { "api_key": KEY, "Cache-Control": "no-cache" },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `API error: ${res.status}`, detail: text }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
