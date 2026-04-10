import { NextRequest, NextResponse } from "next/server";

const LIBRETRANSLATE_API = "https://libretranslate.de/translate";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { q, source, target } = body;

    if (!q || !source || !target) {
      return NextResponse.json(
        { error: "Missing required fields: q, source, target" },
        { status: 400 }
      );
    }

    const response = await fetch(LIBRETRANSLATE_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q,
        source,
        target,
      }),
    });

    if (!response.ok) {
      throw new Error(`Translation API returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 500 }
    );
  }
}
