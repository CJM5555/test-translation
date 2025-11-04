import { NextRequest, NextResponse } from "next/server";
import { translateResources } from "@/services/translation";
import { StringResource } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { strings, targetLanguage } = body;

    if (
      !Array.isArray(strings) ||
      !targetLanguage ||
      typeof targetLanguage !== "string"
    ) {
      return new NextResponse("Invalid request body", { status: 400 });
    }

    const result = await translateResources(
      strings as StringResource[],
      targetLanguage
    );
    // result is a discriminated union returned by the translation service
    if ((result as { success: false } | { success: true }).success === false) {
      const r = result as {
        success: false;
        error: string;
        data?: StringResource[];
      };
      return NextResponse.json(
        { success: false, error: r.error, data: r.data || [] },
        { status: 500 }
      );
    }

    const r = result as { success: true; data: StringResource[] };
    return NextResponse.json({ success: true, data: r.data });
  } catch (error) {
    console.error("Translation error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
