"use client";

import { FormEvent, useMemo, useState } from "react";
import LessonPlanPreview from "@/components/LessonPlanPreview";
import { getRubricLevel, rubricLevelOrder } from "@/lib/rubric";
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sectionHtml(title: string, items: string[]) {
  if (!items.length) {
    return "";
  }

  return `
    <section>
      <h2>${escapeHtml(title)}</h2>
      <ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </section>
  `;
}

function rubricHtml(lesson: AdminLessonRow) {
  const rubric = lesson.lesson_plan.rubric;

  return `
    <section>
      <div class="rubric-heading">
        <h2>Rubric</h2>
        <p>Total possible points: ${rubric.totalPossiblePoints}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Criteria</th>
            ${rubricLevelOrder.map((label) => `<th>${label} / Points</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${rubric.criteria
            .map(
              (criterion) => `
                <tr>
                  <th>${escapeHtml(criterion.criterion)}</th>
                  ${rubricLevelOrder
                    .map((label) => {
                      const level = getRubricLevel(criterion, label);
                      return `
                        <td>
                          <strong>${level?.points ?? 0} pts</strong>
                          <p>${escapeHtml(level?.description ?? "")}</p>
                        </td>
                      `;
                    })
                    .join("")}
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </section>
  `;
}

function lessonHtml(lesson: AdminLessonRow) {
  const plan = lesson.lesson_plan;
  const procedures = plan.methodsProcedures;

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(plan.heading.title)}</title>
  <style>
    body { color: #1d2320; font-family: Arial, Helvetica, sans-serif; line-height: 1.55; margin: 32px; }
    header { border-bottom: 4px solid #006b35; margin-bottom: 24px; padding-bottom: 18px; }
    h1 { color: #10251b; margin: 0 0 8px; }
    h2 { border-top: 1px solid #ead7c4; color: #006b35; margin-top: 26px; padding-top: 18px; }
    .kicker { color: #f58220; font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
    .details { background: #fff8ef; border-left: 5px solid #f58220; display: grid; gap: 12px; grid-template-columns: repeat(3, 1fr); margin: 20px 0; padding: 16px; }
    .label { color: #66736b; display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    ul { padding-left: 22px; }
    table { border-collapse: collapse; font-size: 12px; table-layout: fixed; width: 100%; }
    th, td { border: 1px solid #ead7c4; padding: 8px; text-align: left; vertical-align: top; word-break: break-word; }
    thead th { background: #fff0df; }
    .rubric-heading { align-items: end; display: flex; justify-content: space-between; gap: 16px; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <header>
    <p class="kicker">FAMU DRS lesson plan archive</p>
    <h1>${escapeHtml(plan.heading.title)}</h1>
    <p>${escapeHtml(plan.heading.subtitle)}</p>
  </header>

  <section class="details">
    <div><span class="label">School</span>${escapeHtml(plan.schoolName)}</div>
    <div><span class="label">Teacher</span>${escapeHtml(plan.name)}</div>
    <div><span class="label">Class / Course</span>${escapeHtml(plan.className)}</div>
    <div><span class="label">Grade Level</span>${escapeHtml(plan.gradeLevel)}</div>
    <div><span class="label">Subject</span>${escapeHtml(plan.subject)}</div>
    <div><span class="label">Unit</span>${escapeHtml(plan.unit)}</div>
    <div><span class="label">Lesson</span>${escapeHtml(plan.lesson)}</div>
    <div><span class="label">Submitted</span>${escapeHtml(formatDate(lesson.created_at))}</div>
    <div><span class="label">State</span>${escapeHtml(plan.state)}</div>
  </section>

  ${sectionHtml("Goals", plan.goals)}
  ${sectionHtml("Behavioral Objectives", plan.specificBehavioralObjectives)}
  ${sectionHtml("Standards", plan.associatedStandards)}
  ${sectionHtml("Standards Sources", plan.standardsSources)}
  ${sectionHtml("Provided Resources", plan.providedResources)}
  ${sectionHtml("Materials", plan.materialsResourcesEquipment)}
  ${sectionHtml("Preventative Techniques", plan.preventativeTechniques)}
  ${sectionHtml("Interventive Techniques", plan.interventiveTechniques)}
  <section>
    <h2>Step-by-step Procedures</h2>
    ${sectionHtml("1. Attention Grabber", procedures.attentionGrabber)}
    ${sectionHtml("2. Introduction of the Lesson", procedures.introductionOfLesson)}
    ${sectionHtml("3. Teacher Modeling / Direct Instruction", procedures.teacherModelingDirectInstruction)}
    ${sectionHtml("4. Critical Thinking Questioning / Guided Practice", procedures.criticalThinkingQuestioningGuidedPractice)}
    ${sectionHtml("5. Independent or Group Work", procedures.independentOrGroupWork)}
  </section>
  ${sectionHtml("Assessment", plan.assessment)}
  ${rubricHtml(lesson)}
  ${sectionHtml("Reflection", plan.reflection)}
  ${sectionHtml("Enrichment Activities", plan.enrichmentActivities)}
</body>
</html>`;
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

function createZip(files: Array<{ path: string; content: string }>) {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.path);
    const contentBytes = encoder.encode(file.content);
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

  function downloadTeacherZip() {
    if (!lessons.length) {
      setError("Load lessons before downloading a teacher ZIP.");
      return;
    }

    const groupedLessons = new Map<string, AdminLessonRow[]>();

    for (const lesson of lessons) {
      const teacher = lesson.teacher_name?.trim() || "Unknown Teacher";
      groupedLessons.set(teacher, [...(groupedLessons.get(teacher) ?? []), lesson]);
    }

    const files: Array<{ path: string; content: string }> = [];

    for (const [teacher, teacherLessons] of groupedLessons) {
      const teacherFolder = cleanFilePart(teacher, "Teacher");
      const sortedLessons = [...teacherLessons].sort(
        (first, second) => new Date(second.created_at).getTime() - new Date(first.created_at).getTime()
      );

      const indexRows = sortedLessons
        .map(
          (lesson) =>
            `<tr><td>${escapeHtml(lesson.lesson)}</td><td>${escapeHtml(lesson.subject)}</td><td>${escapeHtml(
              lesson.grade_level
            )}</td><td>${escapeHtml(lesson.class_name)}</td><td>${escapeHtml(formatDate(lesson.created_at))}</td></tr>`
        )
        .join("");

      files.push({
        path: `${teacherFolder}/index.html`,
        content: `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(teacher)} Lesson Archive</title>
  <style>
    body { color: #1d2320; font-family: Arial, Helvetica, sans-serif; line-height: 1.55; margin: 32px; }
    h1 { color: #10251b; }
    p { color: #526158; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ead7c4; padding: 8px; text-align: left; vertical-align: top; }
    thead th { background: #fff0df; color: #006b35; }
  </style>
</head>
<body>
  <h1>${escapeHtml(teacher)} Lesson Archive</h1>
  <p>${sortedLessons.length} saved lesson${sortedLessons.length === 1 ? "" : "s"} exported from the FAMU DRS Lesson Plan Dashboard.</p>
  <table>
    <thead><tr><th>Lesson</th><th>Subject</th><th>Grade</th><th>Class / Course</th><th>Submitted</th></tr></thead>
    <tbody>${indexRows}</tbody>
  </table>
</body>
</html>`
      });

      sortedLessons.forEach((lesson, index) => {
        const datePart = new Date(lesson.created_at).toISOString().slice(0, 10);
        const lessonFile = cleanFilePart(`${index + 1}_${datePart}_${lesson.lesson}`, "Lesson");
        files.push({
          path: `${teacherFolder}/${lessonFile}.html`,
          content: lessonHtml(lesson)
        });
      });
    }

    files.push({
      path: "README.txt",
      content: `FAMU DRS Lesson Plan Export

This ZIP contains one folder per teacher.
Each teacher folder includes an index.html file and one HTML file per saved lesson.

Exported lessons: ${lessons.length}
Teacher folders: ${groupedLessons.size}
School filter: ${schoolFilter === "all" ? "All FAMU DRS Schools" : schoolOptions.find((school) => school.id === schoolFilter)?.label ?? schoolFilter}
`
    });

    const schoolPart = schoolFilter === "all" ? "All_Schools" : cleanFilePart(schoolFilter, "School");
    const datePart = new Date().toISOString().slice(0, 10);
    downloadBlob(createZip(files), `FAMU_DRS_Lesson_Plans_By_Teacher_${schoolPart}_${datePart}.zip`);
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
                  Download the currently loaded lessons as a ZIP with separate folders for each teacher.
                </p>
              </div>
              <button
                type="button"
                onClick={downloadTeacherZip}
                disabled={!lessons.length}
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#006b35] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#00552a] focus:outline-none focus:ring-2 focus:ring-[#f58220] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#879894]"
              >
                Download Teacher ZIP
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
