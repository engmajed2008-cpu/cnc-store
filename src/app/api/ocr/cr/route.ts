import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// OCR لصورة السجل التجاري.
// الأولوية: Azure Document Intelligence (prebuilt-read) ثم Google Vision.
// المفاتيح من البيئة (لا تُكشف للعميل):
//   AZURE_DI_ENDPOINT + AZURE_DI_KEY   أو   GOOGLE_VISION_API_KEY
export async function POST(req: NextRequest) {
  let image: string | undefined;
  try {
    const body = await req.json();
    image = (body?.image as string | undefined)?.replace(/^data:image\/\w+;base64,/, "");
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!image) return NextResponse.json({ error: "no_image" }, { status: 400 });

  const azEndpoint = process.env.AZURE_DI_ENDPOINT;
  const azKey = process.env.AZURE_DI_KEY;
  const gKey = process.env.GOOGLE_VISION_API_KEY;

  // ── Azure Document Intelligence (prebuilt-read) — غير متزامن ──
  if (azEndpoint && azKey) {
    try {
      const base = azEndpoint.replace(/\/+$/, "");
      const url = `${base}/documentintelligence/documentModels/prebuilt-read:analyze?api-version=2024-11-30`;
      const post = await fetch(url, {
        method: "POST",
        headers: { "Ocp-Apim-Subscription-Key": azKey, "Content-Type": "application/json" },
        body: JSON.stringify({ base64Source: image }),
      });
      if (post.status !== 202) {
        const detail = await post.text();
        return NextResponse.json({ error: "azure_error", detail: detail.slice(0, 300) }, { status: 502 });
      }
      const opLoc = post.headers.get("operation-location");
      if (!opLoc) return NextResponse.json({ error: "azure_no_operation" }, { status: 502 });
      for (let i = 0; i < 25; i++) {
        await sleep(1000);
        const r = await fetch(opLoc, { headers: { "Ocp-Apim-Subscription-Key": azKey } });
        const j = await r.json();
        if (j?.status === "succeeded") {
          return NextResponse.json({ text: j?.analyzeResult?.content || "", provider: "azure" });
        }
        if (j?.status === "failed") return NextResponse.json({ error: "azure_failed", detail: JSON.stringify(j?.error || {}).slice(0, 300) }, { status: 502 });
      }
      return NextResponse.json({ error: "azure_timeout" }, { status: 504 });
    } catch (e) {
      return NextResponse.json({ error: "azure_fetch_failed", detail: String(e).slice(0, 200) }, { status: 502 });
    }
  }

  // ── Google Vision (احتياطي) ──
  if (gKey) {
    try {
      const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${gKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requests: [{ image: { content: image }, features: [{ type: "DOCUMENT_TEXT_DETECTION" }], imageContext: { languageHints: ["ar"] } }] }),
      });
      const data = await res.json();
      if (!res.ok) return NextResponse.json({ error: "vision_error", detail: data?.error?.message || "" }, { status: 502 });
      return NextResponse.json({ text: data?.responses?.[0]?.fullTextAnnotation?.text || "", provider: "google" });
    } catch (e) {
      return NextResponse.json({ error: "fetch_failed", detail: String(e).slice(0, 200) }, { status: 502 });
    }
  }

  return NextResponse.json({ error: "missing_key", message: "لم يُضبط مزوّد OCR (AZURE_DI_ENDPOINT/AZURE_DI_KEY أو GOOGLE_VISION_API_KEY)." }, { status: 501 });
}
