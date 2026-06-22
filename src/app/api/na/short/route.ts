import { NextRequest, NextResponse } from "next/server";

// NationalAddress.NationalAddressByShortAddress
const BASE = "https://apina.address.gov.sa/NationalAddress/v3.1/NationalAddress";
const KEY  = process.env.NATIONAL_ADDRESS_API_KEY ?? "";

export async function GET(req: NextRequest) {
  if (!KEY) return NextResponse.json({ error: "API key not configured" }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const shortAddress = searchParams.get("code"); // e.g. RHMA2345
  const lang         = searchParams.get("lang") ?? "A";

  if (!shortAddress) return NextResponse.json({ error: "code required" }, { status: 400 });

  try {
    const url = `${BASE}/short-address?language=${lang}&format=json&encode=utf8&shortaddress=${shortAddress}`;
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
