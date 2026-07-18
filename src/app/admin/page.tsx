"use client";

import { FormEvent, useMemo, useState } from "react";
import LessonPlanPreview from "@/components/LessonPlanPreview";
import { schoolOptions, type AdminLessonRow, type SchoolId } from "@/lib/types";

type SchoolFilter = SchoolId | "all";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function SchoolBadge({ schoolId }: { schoolId: SchoolId }) {
  const label = schoolOptions.find((school) => school.id === schoolId)?.label ?? schoolId;

  return (
    <span className="inline-flex rounded-full border border-[#f5b06b] bg-[#fff8ef] px-2.5 py-1 text-xs font-semibold text-[#006b35]">
      {label.replace("FAMU DRS ", "")}
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-[#ead7c4] bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-[#f58220]">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[#10251b]">{value}</p>
    </div>
  );
}

export default function AdminPage() {
  const [adminCode, setAdminCode] = useState("");
  const [savedCode, setSavedCode] = useState("");
  const [schoolFilter, setSchoolFilter] = useState<SchoolFilter>("all");
  const [lessons, setLessons] = useState<AdminLessonRow[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId) ?? lessons[0] ?? null;

  const stats = useMemo(() => {
    const teachers = new Set(lessons.map((lesson) => lesson.teacher_name).filter(Boolean));
    const subjects = new Set(lessons.map((lesson) => lesson.subject).filter(Boolean));

    return {
      total: lessons.length,
      teachers: teachers.size,
      subjects: subjects.size
    };
  }, [lessons]);

  async function loadLessons(code = savedCode, school = schoolFilter) {
    if (!code.trim()) {
      setError("Enter the admin access code.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/lessons?school=${school}`, {
        headers: {
          "x-admin-code": code
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not load saved lessons.");
      }

      setLessons(data.lessons);
      setSavedCode(code);
      setSelectedLessonId(data.lessons[0]?.id ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load saved lessons.");
      setLessons([]);
      setSelectedLessonId(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAccessSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadLessons(adminCode.trim());
  }

  async function handleSchoolChange(value: SchoolFilter) {
    setSchoolFilter(value);
    if (savedCode) {
      await loadLessons(savedCode, value);
    }
  }

  async function deleteLesson(lesson: AdminLessonRow) {
    if (!savedCode) {
      setError("Enter the admin access code before deleting a lesson.");
      return;
    }

    const shouldDelete = window.confirm(
      `Delete "${lesson.lesson}" by ${lesson.teacher_name}? This cannot be undone.`
    );

    if (!shouldDelete) {
      return;
    }

    setDeletingLessonId(lesson.id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/lessons/${lesson.id}`, {
        method: "DELETE",
        headers: {
          "x-admin-code": savedCode
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not delete saved lesson.");
      }

      setLessons((currentLessons) => {
        const nextLessons = currentLessons.filter((item) => item.id !== lesson.id);
        if (selectedLessonId === lesson.id) {
          setSelectedLessonId(nextLessons[0]?.id ?? null);
        }
        return nextLessons;
      });
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete saved lesson.");
    } finally {
      setDeletingLessonId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#fbfaf7]">
      <section className="border-b-4 border-[#006b35] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8">
          <img
            src="/famu-drs-logo.png"
            alt="Florida A&M University Developmental Research School"
            className="h-auto w-full max-w-[500px]"
          />
          <p className="mt-4 text-sm font-bold uppercase tracking-wide text-[#f58220]">
            Administrative oversight
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[#10251b] sm:text-4xl">
            Lesson Plan Dashboard
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[#405047]">
            Review generated lesson plans by school, teacher, subject, class, and grade level.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 sm:px-8">
        <form onSubmit={handleAccessSubmit} className="rounded-md border border-[#ead7c4] bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-end">
            <div>
              <label htmlFor="admin-code" className="text-sm font-semibold text-[#28312c]">
                Admin access code
              </label>
              <input
                id="admin-code"
                type="password"
                value={adminCode}
                onChange={(event) => setAdminCode(event.target.value)}
                placeholder="Enter the pilot admin code"
                className="mt-2 min-h-11 w-full rounded-md border border-[#d8c7b6] bg-white px-3 py-2 text-sm text-[#1d2320] outline-none transition focus:border-[#006b35] focus:ring-2 focus:ring-[#f58220]/25"
              />
            </div>
            <div>
              <label htmlFor="school-filter" className="text-sm font-semibold text-[#28312c]">
                School
              </label>
              <select
                id="school-filter"
                value={schoolFilter}
                onChange={(event) => handleSchoolChange(event.target.value as SchoolFilter)}
                className="mt-2 min-h-11 w-full rounded-md border border-[#d8c7b6] bg-white px-3 py-2 text-sm text-[#1d2320] outline-none transition focus:border-[#006b35] focus:ring-2 focus:ring-[#f58220]/25 lg:w-[260px]"
              >
                <option value="all">All FAMU DRS Schools</option>
                {schoolOptions.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="min-h-11 rounded-md bg-[#006b35] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#00552a] focus:outline-none focus:ring-2 focus:ring-[#f58220] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#879894]"
            >
              {isLoading ? "Loading..." : "Load Lessons"}
            </button>
          </div>
          {error ? (
            <div className="mt-4 rounded-md border border-[#e1b9a8] bg-[#fff7f2] p-3 text-sm leading-6 text-[#7b3928]">
              {error}
            </div>
          ) : null}
        </form>

        {savedCode ? (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Saved lessons" value={stats.total} />
              <StatCard label="Teachers" value={stats.teachers} />
              <StatCard label="Subjects" value={stats.subjects} />
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(360px,0.75fr)_minmax(0,1.25fr)] xl:items-start">
              <section className="overflow-hidden rounded-md border border-[#ead7c4] bg-white shadow-sm">
                <div className="border-b border-[#ead7c4] p-4">
                  <h2 className="text-lg font-bold text-[#10251b]">Submitted Lessons</h2>
                </div>

                {lessons.length ? (
                  <div className="max-h-[720px] overflow-auto">
                    <table className="min-w-full border-collapse text-left text-sm">
                      <thead className="sticky top-0 bg-[#fff0df]">
                        <tr>
                          <th className="border-b border-[#ead7c4] p-3 font-semibold">Lesson</th>
                          <th className="border-b border-[#ead7c4] p-3 font-semibold">Teacher</th>
                          <th className="border-b border-[#ead7c4] p-3 font-semibold">School</th>
                          <th className="border-b border-[#ead7c4] p-3 font-semibold">Submitted</th>
                          <th className="border-b border-[#ead7c4] p-3 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lessons.map((lesson) => (
                          <tr
                            key={lesson.id}
                            onClick={() => setSelectedLessonId(lesson.id)}
                            className={`cursor-pointer transition hover:bg-[#fff8ef] ${
                              selectedLesson?.id === lesson.id ? "bg-[#fff8ef]" : ""
                            }`}
                          >
                            <td className="border-b border-[#f0e2d4] p-3 align-top">
                              <p className="font-semibold text-[#10251b]">{lesson.lesson}</p>
                              <p className="mt-1 text-xs text-[#59635d]">
                                {lesson.subject} - {lesson.grade_level} - {lesson.class_name}
                              </p>
                            </td>
                            <td className="border-b border-[#f0e2d4] p-3 align-top">{lesson.teacher_name}</td>
                            <td className="border-b border-[#f0e2d4] p-3 align-top">
                              <SchoolBadge schoolId={lesson.school_id} />
                            </td>
                            <td className="border-b border-[#f0e2d4] p-3 align-top text-xs text-[#59635d]">
                              {formatDate(lesson.created_at)}
                            </td>
                            <td className="border-b border-[#f0e2d4] p-3 align-top">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  deleteLesson(lesson);
                                }}
                                disabled={deletingLessonId === lesson.id}
                                className="inline-flex min-h-9 items-center justify-center rounded-md border border-[#d78b78] bg-white px-3 py-2 text-xs font-semibold text-[#8a2d23] transition hover:bg-[#fff7f2] focus:outline-none focus:ring-2 focus:ring-[#f58220] focus:ring-offset-2 disabled:cursor-not-allowed disabled:text-[#b58b83]"
                              >
                                {deletingLessonId === lesson.id ? "Deleting..." : "Delete"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-sm leading-6 text-[#59635d]">
                    No saved lessons match this school filter yet.
                  </div>
                )}
              </section>

              <section className="min-w-0">
                {selectedLesson ? (
                  <div className="space-y-4">
                    <div className="rounded-md border border-[#ead7c4] bg-white p-4 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-[#f58220]">
                            Full lesson plan record
                          </p>
                          <p className="mt-1 text-sm text-[#59635d]">
                            Submitted by {selectedLesson.teacher_name} for {selectedLesson.class_name} on {formatDate(selectedLesson.created_at)}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <SchoolBadge schoolId={selectedLesson.school_id} />
                          <button
                            type="button"
                            onClick={() => deleteLesson(selectedLesson)}
                            disabled={deletingLessonId === selectedLesson.id}
                            className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#d78b78] bg-white px-4 py-2 text-sm font-semibold text-[#8a2d23] transition hover:bg-[#fff7f2] focus:outline-none focus:ring-2 focus:ring-[#f58220] focus:ring-offset-2 disabled:cursor-not-allowed disabled:text-[#b58b83]"
                          >
                            {deletingLessonId === selectedLesson.id ? "Deleting..." : "Delete Lesson"}
                          </button>
                        </div>
                      </div>
                    </div>
                    <LessonPlanPreview lessonPlan={selectedLesson.lesson_plan} />
                  </div>
                ) : (
                  <div className="flex min-h-[360px] items-center justify-center rounded-md border border-[#ead7c4] bg-white text-center text-sm leading-6 text-[#59635d] shadow-sm">
                    Select a lesson to view its details.
                  </div>
                )}
              </section>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
