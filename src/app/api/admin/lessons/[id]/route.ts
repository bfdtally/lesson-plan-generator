import { NextResponse } from "next/server";
import { deleteSavedLesson } from "@/lib/supabaseAdmin";

function isAuthorized(request: Request) {
  const adminCode = process.env.ADMIN_ACCESS_CODE;
  const providedCode = request.headers.get("x-admin-code");

  return Boolean(adminCode && providedCode && providedCode === adminCode);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;

  if (!isUuid(id)) {
    return NextResponse.json(
      { error: "Invalid lesson id." },
      { status: 400 }
    );
  }

  try {
    await deleteSavedLesson({ lessonId: id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin lesson delete failed:", error);
    return NextResponse.json(
      { error: "Could not delete saved lesson." },
      { status: 500 }
    );
  }
}
