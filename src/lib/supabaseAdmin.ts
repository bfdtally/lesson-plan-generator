import { createClient } from "@supabase/supabase-js";
import type { AdminLessonRow, LessonFormData, LessonPlan, SchoolId, TeacherLessonSummary } from "./types";

export function getSupabaseAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export function hasSupabaseAdminConfig() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function saveGeneratedLesson({
  form,
  lessonPlan,
  existingLessonId
}: {
  form: LessonFormData;
  lessonPlan: LessonPlan;
  existingLessonId?: string | null;
}) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const payload = {
    school_id: lessonPlan.schoolId,
    school_name: lessonPlan.schoolName,
    teacher_name: lessonPlan.name,
    class_name: lessonPlan.className,
    subject: lessonPlan.subject,
    unit: lessonPlan.unit,
    lesson: lessonPlan.lesson,
    grade_level: lessonPlan.gradeLevel,
    standards_state: "Florida",
    lesson_description: form.lessonDescription,
    resources: form.resources,
    lesson_plan: lessonPlan,
    status: "submitted",
    updated_at: new Date().toISOString()
  };

  if (existingLessonId) {
    const { data, error } = await supabase
      .from("lesson_plans")
      .update(payload)
      .eq("id", existingLessonId)
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return data.id as string;
  }

  const { data, error } = await supabase
    .from("lesson_plans")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id as string;
}

export async function getSavedLesson({ lessonId }: { lessonId: string }) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("lesson_plans")
    .select(
      "id, school_id, school_name, teacher_user_id, teacher_name, class_name, subject, unit, lesson, grade_level, standards_state, lesson_description, resources, lesson_plan, status, created_at, updated_at"
    )
    .eq("id", lessonId)
    .single();

  if (error) {
    throw error;
  }

  return data as AdminLessonRow;
}

export async function listSavedLessons({ schoolId }: { schoolId?: SchoolId | "all" }) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  let query = supabase
    .from("lesson_plans")
    .select(
      "id, school_id, school_name, teacher_user_id, teacher_name, class_name, subject, unit, lesson, grade_level, standards_state, lesson_description, resources, lesson_plan, status, created_at, updated_at"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (schoolId && schoolId !== "all") {
    query = query.eq("school_id", schoolId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as AdminLessonRow[];
}

export async function listLessonsForTeacher({
  schoolId,
  teacherName
}: {
  schoolId: SchoolId;
  teacherName: string;
}) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("lesson_plans")
    .select("id, school_id, teacher_name, class_name, subject, unit, lesson, grade_level, created_at, updated_at")
    .eq("school_id", schoolId)
    .ilike("teacher_name", `%${teacherName.trim()}%`)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    throw error;
  }

  return (data ?? []) as TeacherLessonSummary[];
}

export async function deleteSavedLesson({ lessonId }: { lessonId: string }) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase
    .from("lesson_plans")
    .delete()
    .eq("id", lessonId);

  if (error) {
    throw error;
  }
}
