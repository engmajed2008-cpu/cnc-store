import { NextRequest, NextResponse } from "next/server";

// NationalAddress.Lookups — regions, cities, districts
const BASE = "https://apina.address.gov.sa/NationalAddress/v3.1/lookup";
const KEY  = process.env.NATIONAL_ADDRESS_API_KEY ?? "";

export async function GET(req: NextRequest) {
  if (!KEY) return NextResponse.json({ error: "API key not configured" }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const type     = searchParams.get("type") ?? "regions"; // regions | cities | districts
  const regionId = searchParams.get("regionId");
  const cityId   = searchParams.get("cityId");
  const lang     = searchParams.get("lang") ?? "A";

  try {
    let path = "";
    if (type === "regions")   path = "/regions";
    else if (type === "cities")    path = `/cities?regionId=${regionId ?? ""}`;
    else if (type === "districts") path = `/districts?cityId=${cityId ?? ""}`;
    else return NextResponse.json({ error: "Invalid type" }, { status: 400 });

    const url = `${BASE}${path}&language=${lang}&format=json&encode=utf8`;
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
