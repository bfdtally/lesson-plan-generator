import { NextResponse } from "next/server";
import { getSavedLesson } from "@/lib/supabaseAdmin";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isUuid(id)) {
    return NextResponse.json(
      { error: "Invalid lesson id." },
      { status: 400 }
    );
  }

  try {
    const lesson = await getSavedLesson({ lessonId: id });
    return NextResponse.json({ lesson });
  } catch (error) {
    console.error("Lesson fetch failed:", error);
    return NextResponse.json(
      { error: "Could not load this lesson." },
      { status: 404 }
    );
  }
}
