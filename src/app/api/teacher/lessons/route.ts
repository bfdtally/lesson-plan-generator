import { NextResponse } from "next/server";
import { listLessonsForTeacher } from "@/lib/supabaseAdmin";
import type { SchoolId } from "@/lib/types";

const validSchools = new Set(["elementary", "middle", "high"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const schoolId = searchParams.get("schoolId") ?? "";
  const teacherName = searchParams.get("teacherName")?.trim() ?? "";

  if (!validSchools.has(schoolId)) {
    return NextResponse.json(
      { error: "Choose a FAMU DRS school." },
      { status: 400 }
    );
  }

  if (teacherName.length < 2) {
    return NextResponse.json(
      { error: "Enter the teacher name used when the lesson was submitted." },
      { status: 400 }
    );
  }

  try {
    const lessons = await listLessonsForTeacher({
      schoolId: schoolId as SchoolId,
      teacherName
    });

    return NextResponse.json({ lessons });
  } catch (error) {
    console.error("Teacher lesson lookup failed:", error);
    return NextResponse.json(
      { error: "Could not find submitted lessons right now." },
      { status: 500 }
    );
  }
}
