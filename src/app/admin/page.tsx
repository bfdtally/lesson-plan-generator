"use client";

import { FormEvent, useMemo, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { LessonPlanPdfDocument } from "@/components/LessonPlanPdf";
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

function cleanFilePart(value: string, fallback: string) {
  return (value || fallback)
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || fallback;
}

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;

  for (const byte of bytes) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(output: number[], value: number) {
  output.push(value & 0xff, (value >>> 8) & 0xff);
}

function writeUint32(output: number[], value: number) {
  output.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function createZip(files: Array<{ path: string; content: Uint8Array }>) {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.path);
    const contentBytes = file.content;
    const checksum = crc32(contentBytes);
    const localHeader: number[] = [];

    writeUint32(localHeader, 0x04034b50);
    writeUint16(localHeader, 20);
    writeUint16(localHeader, 0);
    writeUint16(localHeader, 0);
    writeUint16(localHeader, 0);
    writeUint16(localHeader, 0);
    writeUint32(localHeader, checksum);
    writeUint32(localHeader, contentBytes.length);
    writeUint32(localHeader, contentBytes.length);
    writeUint16(localHeader, nameBytes.length);
    writeUint16(localHeader, 0);

    const local = new Uint8Array(localHeader.length + nameBytes.length + contentBytes.length);
    local.set(localHeader, 0);
    local.set(nameBytes, localHeader.length);
    local.set(contentBytes, localHeader.length + nameBytes.length);
    localParts.push(local);

    const centralHeader: number[] = [];
    writeUint32(centralHeader, 0x02014b50);
    writeUint16(centralHeader, 20);
    writeUint16(centralHeader, 20);
    writeUint16(centralHeader, 0);
    writeUint16(centralHeader, 0);
    writeUint16(centralHeader, 0);
    writeUint16(centralHeader, 0);
    writeUint32(centralHeader, checksum);
    writeUint32(centralHeader, contentBytes.length);
    writeUint32(centralHeader, contentBytes.length);
    writeUint16(centralHeader, nameBytes.length);
    writeUint16(centralHeader, 0);
    writeUint16(centralHeader, 0);
    writeUint16(centralHeader, 0);
    writeUint16(centralHeader, 0);
    writeUint32(centralHeader, 0);
    writeUint32(centralHeader, offset);

    const central = new Uint8Array(centralHeader.length + nameBytes.length);
    central.set(centralHeader, 0);
    central.set(nameBytes, centralHeader.length);
    centralParts.push(central);

    offset += local.length;
  }

  const centralSize = centralParts.reduce((total, part) => total + part.length, 0);
  const endHeader: number[] = [];
  writeUint32(endHeader, 0x06054b50);
  writeUint16(endHeader, 0);
  writeUint16(endHeader, 0);
  writeUint16(endHeader, files.length);
  writeUint16(endHeader, files.length);
  writeUint32(endHeader, centralSize);
  writeUint32(endHeader, offset);
  writeUint16(endHeader, 0);

  const blobParts = [...localParts, ...centralParts, new Uint8Array(endHeader)].map((part) => {
    const copy = new ArrayBuffer(part.byteLength);
    new Uint8Array(copy).set(part);
    return copy;
  });

  return new Blob(blobParts, {
    type: "application/zip"
  });
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function AdminPage() {
  const [adminCode, setAdminCode] = useState("");
  const [savedCode, setSavedCode] = useState("");
  const [schoolFilter, setSchoolFilter] = useState<SchoolFilter>("all");
  const [lessons, setLessons] = useState<AdminLessonRow[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null);
  const [isExportingZip, setIsExportingZip] = useState(false);
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

  async function downloadTeacherZip() {
    if (!lessons.length) {
      setError("Load lessons before downloading a teacher ZIP.");
      return;
    }

    setIsExportingZip(true);
    setError(null);

    const groupedLessons = new Map<string, AdminLessonRow[]>();

    for (const lesson of lessons) {
      const teacher = lesson.teacher_name?.trim() || "Unknown Teacher";
      groupedLessons.set(teacher, [...(groupedLessons.get(teacher) ?? []), lesson]);
    }

    try {
      const files: Array<{ path: string; content: Uint8Array }> = [];

      for (const [teacher, teacherLessons] of groupedLessons) {
        const teacherFolder = cleanFilePart(teacher, "Teacher");
        const sortedLessons = [...teacherLessons].sort(
          (first, second) => new Date(second.created_at).getTime() - new Date(first.created_at).getTime()
        );

        for (const [index, lesson] of sortedLessons.entries()) {
          const datePart = new Date(lesson.created_at).toISOString().slice(0, 10);
          const lessonFile = cleanFilePart(`${index + 1}_${datePart}_${lesson.lesson}`, "Lesson");
          const lessonPdfBlob = await pdf(<LessonPlanPdfDocument lessonPlan={lesson.lesson_plan} />).toBlob();
          const lessonPdfBytes = new Uint8Array(await lessonPdfBlob.arrayBuffer());

          files.push({
            path: `${teacherFolder}/${lessonFile}.pdf`,
            content: lessonPdfBytes
          });
        }
      }

      const schoolPart = schoolFilter === "all" ? "All_Schools" : cleanFilePart(schoolFilter, "School");
      const datePart = new Date().toISOString().slice(0, 10);
      downloadBlob(createZip(files), `FAMU_DRS_Lesson_Plans_By_Teacher_${schoolPart}_${datePart}.zip`);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Could not create teacher ZIP.");
    } finally {
      setIsExportingZip(false);
    }
  }
  return (
    <main className="min-h-screen bg-[#fbfaf7]">
      <section className="border-b-4 border-[#006b35] bg-white">
        <div className="mx-auto flex max-w-[1800px] flex-col gap-6 px-4 py-7 sm:px-6 lg:flex-row lg:items-start lg:justify-between 2xl:px-8">
          <div>
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
          <a
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#006b35] bg-white px-4 py-3 text-sm font-semibold text-[#006b35] shadow-sm transition hover:bg-[#fff8ef] focus:outline-none focus:ring-2 focus:ring-[#f58220] focus:ring-offset-2"
          >
            Return to Generator
          </a>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1800px] gap-6 px-4 py-8 sm:px-6 2xl:px-8">
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

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#ead7c4] bg-white p-4 shadow-sm">
              <div>
                <p className="text-sm font-bold text-[#10251b]">Teacher archive export</p>
                <p className="mt-1 text-sm leading-6 text-[#59635d]">
                  Download the currently loaded lessons as PDFs, organized into separate teacher folders.
                </p>
              </div>
              <button
                type="button"
                onClick={downloadTeacherZip}
                disabled={!lessons.length || isExportingZip}
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#006b35] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#00552a] focus:outline-none focus:ring-2 focus:ring-[#f58220] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#879894]"
              >
                {isExportingZip ? "Preparing PDFs..." : "Download Teacher PDFs"}
              </button>
            </div>

            <div className="grid gap-6 2xl:grid-cols-[minmax(320px,0.52fr)_minmax(760px,1.48fr)] 2xl:items-start">
              <section className="overflow-hidden rounded-md border border-[#ead7c4] bg-white shadow-sm">
                <div className="border-b border-[#ead7c4] p-4">
                  <h2 className="text-lg font-bold text-[#10251b]">Submitted Lessons</h2>
                </div>

                {lessons.length ? (
                  <div className="max-h-[720px] overflow-auto">
                    <table className="w-full table-fixed border-collapse text-left text-xs">
                      <colgroup>
                        <col className="w-[32%]" />
                        <col className="w-[12%]" />
                        <col className="w-[22%]" />
                        <col className="w-[20%]" />
                        <col className="w-[14%]" />
                      </colgroup>
                      <thead className="sticky top-0 bg-[#fff0df]">
                        <tr>
                          <th className="border-b border-[#ead7c4] p-2 font-semibold">Lesson</th>
                          <th className="border-b border-[#ead7c4] p-2 font-semibold">Teacher</th>
                          <th className="border-b border-[#ead7c4] p-2 font-semibold">School</th>
                          <th className="border-b border-[#ead7c4] p-2 font-semibold">Submitted</th>
                          <th className="border-b border-[#ead7c4] p-2 font-semibold">Actions</th>
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
                            <td className="break-words border-b border-[#f0e2d4] p-2 align-top">
                              <p className="font-semibold leading-5 text-[#10251b]">{lesson.lesson}</p>
                              <p className="mt-1 text-[11px] leading-4 text-[#59635d]">
                                {lesson.subject} - {lesson.grade_level} - {lesson.class_name}
                              </p>
                            </td>
                            <td className="break-words border-b border-[#f0e2d4] p-2 align-top">{lesson.teacher_name}</td>
                            <td className="border-b border-[#f0e2d4] p-2 align-top">
                              <SchoolBadge schoolId={lesson.school_id} />
                            </td>
                            <td className="border-b border-[#f0e2d4] p-2 align-top text-[11px] leading-4 text-[#59635d]">
                              {formatDate(lesson.created_at)}
                            </td>
                            <td className="border-b border-[#f0e2d4] p-2 align-top">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  deleteLesson(lesson);
                                }}
                                disabled={deletingLessonId === lesson.id}
                                className="inline-flex min-h-8 items-center justify-center rounded-md border border-[#d78b78] bg-white px-2 py-1.5 text-[11px] font-semibold text-[#8a2d23] transition hover:bg-[#fff7f2] focus:outline-none focus:ring-2 focus:ring-[#f58220] focus:ring-offset-2 disabled:cursor-not-allowed disabled:text-[#b58b83]"
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
