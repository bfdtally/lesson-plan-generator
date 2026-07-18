import { NextResponse } from "next/server";
import { listSavedLessons } from "@/lib/supabaseAdmin";
import type { SchoolId } from "@/lib/types";

const validSchools = new Set(["all", "elementary", "middle", "high"]);

function isAuthorized(request: Request) {
  const adminCode = process.env.ADMIN_ACCESS_CODE;
  const providedCode = request.headers.get("x-admin-code");

  return Boolean(adminCode && providedCode && providedCode === adminCode);
}

export async function GET(request: Request) {
  if (!process.env.ADMIN_ACCESS_CODE) {
    return NextResponse.json(
      { error: "Admin access is not configured." },
      { status: 503 }
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "Invalid admin access code." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const requestedSchool = searchParams.get("school") ?? "all";

  if (!validSchools.has(requestedSchool)) {
    return NextResponse.json(
      { error: "Invalid school filter." },
      { status: 400 }
    );
  }

  try {
    const lessons = await listSavedLessons({
      schoolId: requestedSchool as SchoolId | "all"
    });

    return NextResponse.json({ lessons });
  } catch (error) {
    console.error("Admin lesson fetch failed:", error);
    return NextResponse.json(
      { error: "Could not load saved lessons." },
      { status: 500 }
    );
  }
}
