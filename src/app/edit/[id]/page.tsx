"use client";

import dynamic from "next/dynamic";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import LessonPlanPreview from "@/components/LessonPlanPreview";
import { emptyForm } from "@/lib/lessonPlan";
import { requiredFields, schoolOptions, type AdminLessonRow, type LessonFormData, type LessonPlan } from "@/lib/types";

const LessonPlanPdfDownload = dynamic(() => import("@/components/LessonPlanPdf"), {
  ssr: false,
  loading: () => <span className="text-sm font-semibold text-[#006b35]">Loading PDF...</span>
});

const RubricPdfDownload = dynamic(() => import("@/components/RubricPdf"), {
  ssr: false,
  loading: () => <span className="text-sm font-semibold text-[#006b35]">Loading rubric...</span>
});

const HandsOnProjectPdfDownload = dynamic(() => import("@/components/HandsOnProjectPdf"), {
  ssr: false,
  loading: () => <span className="text-sm font-semibold text-[#006b35]">Loading project...</span>
});

const fieldLabels: Record<keyof LessonFormData, string> = {
  schoolId: "School",
  name: "Teacher Name",
  className: "Class / Course",
  subject: "Subject",
  unit: "Unit",
  lesson: "Lesson",
  gradeLevel: "Grade Level",
  state: "State for K-12 Content Standards",
  resources: "Resources",
  lessonDescription: "Lesson Description"
};

function formFromLesson(row: AdminLessonRow): LessonFormData {
  return {
    schoolId: row.school_id,
    name: row.teacher_name,
    className: row.class_name,
    subject: row.subject,
    unit: row.unit,
    lesson: row.lesson,
    gradeLevel: row.grade_level,
    state: "Florida",
    resources: row.resources ?? "",
    lessonDescription: row.lesson_description
  };
}

function TextInput({
  field,
  value,
  error,
  onChange
}: {
  field: keyof LessonFormData;
  value: string;
  error?: string;
  onChange: (field: keyof LessonFormData, value: string) => void;
}) {
  const id = `edit-${field}`;

  if (field === "schoolId") {
    return (
      <div>
        <label htmlFor={id} className="text-sm font-semibold text-[#28312c]">
          {fieldLabels[field]} <span className="text-[#9d3b32]">*</span>
        </label>
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(field, event.target.value)}
          className="mt-2 min-h-11 w-full rounded-md border border-[#d8c7b6] bg-white px-3 py-2 text-sm text-[#1d2320] outline-none transition focus:border-[#006b35] focus:ring-2 focus:ring-[#f58220]/25"
        >
          {schoolOptions.map((school) => (
            <option key={school.id} value={school.id}>
              {school.label}
            </option>
          ))}
        </select>
        {error ? <p className="mt-2 text-sm text-[#9d3b32]">{error}</p> : null}
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-[#28312c]">
        {fieldLabels[field]} <span className="text-[#9d3b32]">*</span>
      </label>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(field, event.target.value)}
        className="mt-2 min-h-11 w-full rounded-md border border-[#d8c7b6] bg-white px-3 py-2 text-sm text-[#1d2320] outline-none transition focus:border-[#006b35] focus:ring-2 focus:ring-[#f58220]/25"
      />
      {error ? <p className="mt-2 text-sm text-[#9d3b32]">{error}</p> : null}
    </div>
  );
}

export default function EditLessonPage() {
  const params = useParams<{ id: string }>();
  const lessonId = params.id;
  const [form, setForm] = useState<LessonFormData>(emptyForm);
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof LessonFormData, string>>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const completedCount = useMemo(
    () => requiredFields.filter((field) => form[field].trim()).length,
    [form]
  );

  useEffect(() => {
    async function loadLesson() {
      setIsLoading(true);
      setNotice(null);

      try {
        const response = await fetch(`/api/lessons/${lessonId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Could not load this lesson.");
        }

        setForm(formFromLesson(data.lesson));
        setLessonPlan(data.lesson.lesson_plan);
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Could not load this lesson.");
      } finally {
        setIsLoading(false);
      }
    }

    if (lessonId) {
      loadLesson();
    }
  }, [lessonId]);

  function updateField(field: keyof LessonFormData, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validate() {
    const nextErrors: Partial<Record<keyof LessonFormData, string>> = {};
    for (const field of requiredFields) {
      if (!form[field].trim()) {
        nextErrors[field] = `${fieldLabels[field]} is required.`;
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    if (!validate()) {
      setNotice("Please complete every required field before saving the revision.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, existingLessonId: lessonId })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Something went wrong. Please check your information and try again.");
      }

      setLessonPlan(data.lessonPlan);
      setNotice("Revision saved. The admin dashboard will show the updated lesson plan.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Something went wrong. Please check your information and try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fbfaf7]">
      <section className="border-b-4 border-[#006b35] bg-white">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-7 sm:px-6 lg:flex-row lg:items-start lg:justify-between 2xl:px-8">
          <div className="max-w-3xl">
            <img
              src="/famu-drs-logo.png"
              alt="Florida A&M University Developmental Research School"
              className="h-auto w-full max-w-[520px]"
            />
            <p className="mt-4 text-sm font-bold uppercase tracking-wide text-[#f58220]">
              Lesson revision workspace
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[#10251b] sm:text-4xl">
              Edit Saved Lesson Plan
            </h1>
            <p className="mt-3 text-base leading-7 text-[#405047]">
              Revise the lesson details, regenerate the plan, and save the updated version for administrator review.
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

      <div className="mx-auto grid max-w-[1600px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(320px,440px)_minmax(0,1fr)] lg:items-start 2xl:px-8">
        <form onSubmit={handleSubmit} className="space-y-5 rounded-md border border-[#ead7c4] bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="text-xl font-bold text-[#10251b]">Revision details</h2>
            <p className="mt-2 text-sm leading-6 text-[#526158]">
              {isLoading ? "Loading this saved lesson..." : `${completedCount} of ${requiredFields.length} required fields complete`}
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            <TextInput field="schoolId" value={form.schoolId} error={errors.schoolId} onChange={updateField} />
            <TextInput field="name" value={form.name} error={errors.name} onChange={updateField} />
            <TextInput field="className" value={form.className} error={errors.className} onChange={updateField} />
            <TextInput field="subject" value={form.subject} error={errors.subject} onChange={updateField} />
            <TextInput field="unit" value={form.unit} error={errors.unit} onChange={updateField} />
            <TextInput field="lesson" value={form.lesson} error={errors.lesson} onChange={updateField} />
            <TextInput field="gradeLevel" value={form.gradeLevel} error={errors.gradeLevel} onChange={updateField} />
          </div>

          <div>
            <label htmlFor="edit-lessonDescription" className="text-sm font-semibold text-[#28312c]">
              Lesson Description / Revision Notes <span className="text-[#9d3b32]">*</span>
            </label>
            <textarea
              id="edit-lessonDescription"
              value={form.lessonDescription}
              onChange={(event) => updateField("lessonDescription", event.target.value)}
              rows={8}
              className="mt-2 w-full resize-y rounded-md border border-[#d8c7b6] bg-white px-3 py-3 text-sm leading-6 text-[#1d2320] outline-none transition focus:border-[#006b35] focus:ring-2 focus:ring-[#f58220]/25"
            />
            {errors.lessonDescription ? <p className="mt-2 text-sm text-[#9d3b32]">{errors.lessonDescription}</p> : null}
          </div>

          <div>
            <label htmlFor="edit-resources" className="text-sm font-semibold text-[#28312c]">
              Resources / URLs to include <span className="text-[#66736b]">(optional)</span>
            </label>
            <textarea
              id="edit-resources"
              value={form.resources}
              onChange={(event) => updateField("resources", event.target.value)}
              rows={5}
              className="mt-2 w-full resize-y rounded-md border border-[#d8c7b6] bg-white px-3 py-3 text-sm leading-6 text-[#1d2320] outline-none transition focus:border-[#006b35] focus:ring-2 focus:ring-[#f58220]/25"
            />
          </div>

          {notice ? (
            <div className="rounded-md border border-[#e1b9a8] bg-[#fff7f2] p-3 text-sm leading-6 text-[#7b3928]">
              {notice}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isLoading || isSaving}
            className="flex min-h-12 w-full items-center justify-center rounded-md bg-[#006b35] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#00552a] focus:outline-none focus:ring-2 focus:ring-[#f58220] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#879894]"
          >
            {isSaving ? "Saving revised lesson plan..." : "Save Revised Lesson Plan"}
          </button>
        </form>

        <section className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-[#10251b]">Updated Preview</h2>
            {lessonPlan ? (
              <div className="flex flex-wrap gap-3">
                <HandsOnProjectPdfDownload lessonPlan={lessonPlan} />
                <RubricPdfDownload lessonPlan={lessonPlan} />
                <LessonPlanPdfDownload lessonPlan={lessonPlan} />
              </div>
            ) : null}
          </div>

          {isSaving ? (
            <div className="mb-4 rounded-md border border-[#f5b06b] bg-white p-4 text-sm font-semibold text-[#006b35] shadow-sm">
              Regenerating and saving the revised lesson plan...
            </div>
          ) : null}

          {lessonPlan ? (
            <LessonPlanPreview lessonPlan={lessonPlan} />
          ) : (
            <div className="flex min-h-[520px] items-center justify-center rounded-md border border-dashed border-[#f5b06b] bg-white p-8 text-center text-sm leading-6 text-[#59635d]">
              {isLoading ? "Loading saved lesson..." : "No lesson preview is available."}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
