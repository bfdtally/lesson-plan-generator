"use client";

import { useState } from "react";
import type { HandsOnProject, LessonPlan } from "@/lib/types";

function cleanPart(value: string, fallback: string) {
  return (value || fallback)
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
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

function wrapText(
  text: string,
  maxWidth: number,
  font: { widthOfTextAtSize: (value: string, size: number) => number },
  size: number
) {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) {
      current = test;
    } else {
      if (current) {
        lines.push(current);
      }
      current = word;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function defaultProject(lessonPlan: LessonPlan): HandsOnProject {
  return {
    title: `${lessonPlan.lesson || lessonPlan.titleOfLesson} Hands-on Project`,
    overview:
      "Students complete a hands-on project that helps them demonstrate the key lesson concept through a product, model, demonstration, or performance task.",
    teacherSetup: ["Prepare low-cost materials, directions, and success criteria before the activity begins."],
    studentTask: ["Create a project product that shows understanding of the lesson objective."],
    deliverables: ["Completed project product", "Brief explanation of what the project shows"],
    groupingAndTiming: ["Suggested grouping: partners or small groups.", "Suggested timing: 25 to 40 minutes."],
    differentiationSupport: ["Provide visuals, sentence stems, or a partially completed organizer for students who need support."]
  };
}

export default function HandsOnProjectPdfDownload({ lessonPlan }: { lessonPlan: LessonPlan }) {
  const [isPreparing, setIsPreparing] = useState(false);
  const project = lessonPlan.handsOnProject ?? defaultProject(lessonPlan);

  async function handleDownload() {
    setIsPreparing(true);

    try {
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const pdfDoc = await PDFDocument.create();
      const form = pdfDoc.getForm();
      const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const logoBytes = await fetch("/famu-drs-logo.png").then((response) => response.arrayBuffer());
      const logoImage = await pdfDoc.embedPng(logoBytes);

      const pageWidth = 612;
      const pageHeight = 792;
      const margin = 42;
      const contentWidth = pageWidth - margin * 2;
      const lineGap = 12;
      const darkGreen = rgb(0, 0.42, 0.21);
      const orange = rgb(0.96, 0.51, 0.13);
      const bodyText = rgb(0.12, 0.16, 0.2);
      const borderColor = rgb(0.58, 0.65, 0.7);
      const fieldFill = rgb(1, 1, 0.96);

      let page = pdfDoc.addPage([pageWidth, pageHeight]);
      let y = pageHeight - margin;

      function drawText(text: string, x: number, textY: number, size = 9, bold = false, color = bodyText) {
        page.drawText(text, {
          x,
          y: textY,
          size,
          font: bold ? boldFont : regularFont,
          color
        });
      }

      function addPage() {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }

      function ensureSpace(height: number) {
        if (y - height < margin + 48) {
          addPage();
        }
      }

      function drawWrapped(text: string, x: number, maxWidth: number, size = 9, bold = false) {
        const font = bold ? boldFont : regularFont;
        const lines = wrapText(text, maxWidth, font, size);
        lines.forEach((line, index) => {
          drawText(line, x, y - index * lineGap, size, bold);
        });
        y -= Math.max(lineGap, lines.length * lineGap);
      }

      function drawSection(title: string, items: string[]) {
        if (!items.length) {
          return;
        }

        ensureSpace(40 + items.length * 18);
        drawText(title, margin, y, 12, true, darkGreen);
        y -= 18;

        for (const item of items) {
          const lines = wrapText(item, contentWidth - 16, regularFont, 9);
          ensureSpace(lines.length * lineGap + 8);
          drawText("-", margin + 2, y, 9, false, bodyText);
          lines.forEach((line, index) => {
            drawText(line, margin + 16, y - index * lineGap, 9, false, bodyText);
          });
          y -= lines.length * lineGap + 6;
        }

        y -= 4;
      }

      function addTextField(name: string, x: number, fieldY: number, width: number, height: number, multiline = false) {
        const field = form.createTextField(name);
        if (multiline) {
          field.enableMultiline();
        }
        field.addToPage(page, {
          x,
          y: fieldY,
          width,
          height,
          borderColor,
          borderWidth: 0.8,
          backgroundColor: fieldFill,
          textColor: bodyText
        });
        return field;
      }

      page.drawImage(logoImage, {
        x: margin,
        y: y - 45,
        width: 250,
        height: 50
      });
      drawText("FAMU DRS instructional planning pilot", margin, y - 58, 8.5, true, orange);
      drawText("Hands-on Project Sheet", margin, y - 82, 20, true, darkGreen);
      drawText(project.title, margin, y - 102, 13, true, bodyText);
      page.drawLine({
        start: { x: margin, y: y - 116 },
        end: { x: pageWidth - margin, y: y - 116 },
        thickness: 1.4,
        color: darkGreen
      });
      y -= 140;

      const fieldWidth = (contentWidth - 18) / 2;
      drawText("Student / Group Name", margin, y, 8, true, darkGreen);
      addTextField("student_or_group_name", margin, y - 22, fieldWidth, 18);
      drawText("Date", margin + fieldWidth + 18, y, 8, true, darkGreen);
      addTextField("date", margin + fieldWidth + 18, y - 22, fieldWidth, 18);
      y -= 44;

      drawText("Teacher", margin, y, 8, true, darkGreen);
      const teacherField = addTextField("teacher", margin, y - 22, fieldWidth, 18);
      teacherField.setText(lessonPlan.name);
      drawText("Class / Course", margin + fieldWidth + 18, y, 8, true, darkGreen);
      const classField = addTextField("class_course", margin + fieldWidth + 18, y - 22, fieldWidth, 18);
      classField.setText(lessonPlan.className);
      y -= 46;

      drawText("Project Overview", margin, y, 12, true, darkGreen);
      y -= 18;
      drawWrapped(project.overview, margin, contentWidth, 9);
      y -= 4;

      drawSection("Teacher Setup", project.teacherSetup);
      drawSection("Student Task", project.studentTask);
      drawSection("Deliverables", project.deliverables);
      drawSection("Grouping and Timing", project.groupingAndTiming);
      drawSection("Differentiation and Support", project.differentiationSupport);

      ensureSpace(120);
      drawText("Teacher Notes / Adaptations", margin, y, 12, true, darkGreen);
      addTextField("teacher_notes_adaptations", margin, y - 92, contentWidth, 78, true);
      y -= 112;

      ensureSpace(90);
      drawText("Student Reflection", margin, y, 12, true, darkGreen);
      addTextField("student_reflection", margin, y - 74, contentWidth, 60, true);

      form.updateFieldAppearances(regularFont);
      const pdfBytes = await pdfDoc.save();
      const pdfBlobPart = new Uint8Array(pdfBytes) as BlobPart;
      const fileName = `${cleanPart(lessonPlan.titleOfLesson || lessonPlan.lesson, "Lesson")}_Hands_On_Project.pdf`;
      downloadBlob(new Blob([pdfBlobPart], { type: "application/pdf" }), fileName);
    } finally {
      setIsPreparing(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isPreparing}
      className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#f5b06b] bg-white px-5 py-3 text-sm font-semibold text-[#006b35] shadow-sm transition hover:bg-[#fff8ef] focus:outline-none focus:ring-2 focus:ring-[#f58220] focus:ring-offset-2 disabled:cursor-not-allowed disabled:text-[#879894]"
    >
      {isPreparing ? "Preparing project..." : "Download Project PDF"}
    </button>
  );
}
