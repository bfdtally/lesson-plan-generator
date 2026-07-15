"use client";

import { useState } from "react";
import type { LessonPlan } from "@/lib/types";

const levels = ["Excellent", "Proficient", "Developing", "Beginning"] as const;

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

function wrapText(text: string, maxWidth: number, font: { widthOfTextAtSize: (value: string, size: number) => number }, size: number) {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
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

export default function RubricPdfDownload({ lessonPlan }: { lessonPlan: LessonPlan }) {
  const [isPreparing, setIsPreparing] = useState(false);

  async function handleDownload() {
    setIsPreparing(true);

    try {
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const pdfDoc = await PDFDocument.create();
      const form = pdfDoc.getForm();
      const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fileName = `${cleanPart(lessonPlan.titleOfLesson || lessonPlan.lesson, "Rubric")}_Fillable_Rubric.pdf`;

      const pageWidth = 792;
      const pageHeight = 612;
      const margin = 36;
      const tableWidth = pageWidth - margin * 2;
      const criterionWidth = 130;
      const levelWidth = (tableWidth - criterionWidth) / 4;
      const headerFill = rgb(0.93, 0.96, 0.94);
      const borderColor = rgb(0.58, 0.65, 0.7);
      const darkText = rgb(0.09, 0.22, 0.26);
      const bodyText = rgb(0.12, 0.16, 0.2);

      let page = pdfDoc.addPage([pageWidth, pageHeight]);
      let y = pageHeight - margin;

      function drawText(text: string, x: number, textY: number, size = 8, bold = false, color = bodyText) {
        page.drawText(text, {
          x,
          y: textY,
          size,
          font: bold ? boldFont : regularFont,
          color
        });
      }

      function drawWrapped(text: string, x: number, textY: number, maxWidth: number, size = 7.2, bold = false) {
        const font = bold ? boldFont : regularFont;
        const lines = wrapText(text, maxWidth, font, size);
        lines.forEach((line, index) => {
          drawText(line, x, textY - index * (size + 2), size, bold);
        });
        return lines.length;
      }

      function drawCell(x: number, cellY: number, width: number, height: number, fill = false) {
        page.drawRectangle({
          x,
          y: cellY - height,
          width,
          height,
          borderColor,
          borderWidth: 0.8,
          color: fill ? headerFill : undefined
        });
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
          backgroundColor: rgb(1, 1, 1),
          textColor: bodyText
        });
        return field;
      }

      function drawHeader() {
        drawText("Rubric", margin, y - 6, 19, true, darkText);
        drawText(`${lessonPlan.titleOfLesson} - ${lessonPlan.subject} - ${lessonPlan.gradeLevel}`, margin, y - 23, 9);
        page.drawLine({
          start: { x: margin, y: y - 34 },
          end: { x: pageWidth - margin, y: y - 34 },
          thickness: 1,
          color: darkText
        });
        y -= 52;

        const infoWidth = (tableWidth - 24) / 4;
        const labels = ["Student Name", "Teacher / Evaluator", "Date", "Total Score"];
        labels.forEach((label, index) => {
          const x = margin + index * (infoWidth + 8);
          drawText(label, x, y, 8, true, darkText);
          const value = label === "Teacher / Evaluator" ? lessonPlan.name : "";
          const field = addTextField(`header_${label.toLowerCase().replace(/[^a-z]+/g, "_")}`, x, y - 19, infoWidth, 15);
          if (value) {
            field.setText(value);
          }
        });
        y -= 38;

        drawCell(margin, y, criterionWidth, 24, true);
        drawText("Criteria", margin + 6, y - 15, 8.5, true, darkText);
        levels.forEach((level, index) => {
          const x = margin + criterionWidth + index * levelWidth;
          drawCell(x, y, levelWidth, 24, true);
          drawText(level, x + 6, y - 15, 8.5, true, darkText);
        });
        y -= 24;
      }

      function newPage() {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
        drawHeader();
      }

      drawHeader();

      lessonPlan.rubric.criteria.forEach((criterion, criterionIndex) => {
        const lineCounts = levels.map((label) => {
          const level = criterion.levels.find((item) => item.label === label);
          return wrapText(level?.description ?? "", levelWidth - 32, regularFont, 7.1).length + 1;
        });
        const criterionLines = wrapText(criterion.criterion, criterionWidth - 12, boldFont, 7.2).length;
        const rowHeight = Math.max(58, Math.max(...lineCounts) * 9 + 20, criterionLines * 9 + 12);

        if (y - rowHeight < 110) {
          newPage();
        }

        drawCell(margin, y, criterionWidth, rowHeight);
        drawWrapped(criterion.criterion, margin + 6, y - 13, criterionWidth - 12, 7.2, true);

        levels.forEach((label, levelIndex) => {
          const x = margin + criterionWidth + levelIndex * levelWidth;
          const level = criterion.levels.find((item) => item.label === label);
          drawCell(x, y, levelWidth, rowHeight);

          const checkBox = form.createCheckBox(`criteria_${criterionIndex}_${label.toLowerCase()}_selected`);
          checkBox.addToPage(page, {
            x: x + 6,
            y: y - 17,
            width: 9,
            height: 9,
            borderColor,
            borderWidth: 0.8
          });
          drawText(`${level?.points ?? 0} pts`, x + 20, y - 15, 7.4, true);
          drawWrapped(level?.description ?? "", x + 20, y - 28, levelWidth - 28, 7.1);
        });

        y -= rowHeight;
      });

      if (y < 118) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }

      y -= 12;
      drawText("Total Possible Points", margin, y, 8, true, darkText);
      drawText(String(lessonPlan.rubric.totalPossiblePoints), margin, y - 18, 10, true);

      drawText("Points Earned", margin + 180, y, 8, true, darkText);
      addTextField("score_points_earned", margin + 180, y - 22, 120, 18);

      drawText("Percentage / Grade", margin + 330, y, 8, true, darkText);
      addTextField("score_percentage_grade", margin + 330, y - 22, 150, 18);

      drawText("Teacher Feedback / Notes", margin, y - 46, 8, true, darkText);
      addTextField("feedback_notes", margin, y - 116, tableWidth, 62, true);

      form.updateFieldAppearances(regularFont);
      const pdfBytes = await pdfDoc.save();
      const pdfBlobPart = new Uint8Array(pdfBytes) as BlobPart;
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
      className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#244c5a] bg-white px-5 py-3 text-sm font-semibold text-[#244c5a] shadow-sm transition hover:bg-[#f1f5f2] focus:outline-none focus:ring-2 focus:ring-[#244c5a] focus:ring-offset-2 disabled:cursor-not-allowed disabled:text-[#879894]"
    >
      {isPreparing ? "Preparing rubric..." : "Download Fillable Rubric PDF"}
    </button>
  );
}
