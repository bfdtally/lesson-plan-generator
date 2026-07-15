"use client";

import {
  Document,
  Page,
  PDFDownloadLink,
  StyleSheet,
  Text,
  View
} from "@react-pdf/renderer";
import type { LessonPlan } from "@/lib/types";

const levels = ["Excellent", "Proficient", "Developing", "Beginning"] as const;

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 8.25,
    color: "#1f2933",
    fontFamily: "Helvetica"
  },
  header: {
    borderBottom: "1 solid #244c5a",
    marginBottom: 10,
    paddingBottom: 8
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: "#183942"
  },
  subtitle: {
    marginTop: 3,
    fontSize: 9.5,
    color: "#4d5952"
  },
  infoGrid: {
    flexDirection: "row",
    marginBottom: 10
  },
  infoBox: {
    width: "25%",
    paddingRight: 10
  },
  infoLabel: {
    fontSize: 8,
    fontWeight: 700,
    color: "#244c5a",
    marginBottom: 3
  },
  line: {
    borderBottom: "1 solid #6b7280",
    minHeight: 14
  },
  filledLine: {
    borderBottom: "1 solid #6b7280",
    minHeight: 14,
    paddingBottom: 2
  },
  table: {
    borderTop: "1 solid #9aa5b1",
    borderLeft: "1 solid #9aa5b1"
  },
  row: {
    flexDirection: "row"
  },
  headerCell: {
    backgroundColor: "#edf3ef",
    borderRight: "1 solid #9aa5b1",
    borderBottom: "1 solid #9aa5b1",
    padding: 5
  },
  criterionCell: {
    width: "16%",
    borderRight: "1 solid #9aa5b1",
    borderBottom: "1 solid #9aa5b1",
    padding: 5
  },
  levelCell: {
    width: "21%",
    borderRight: "1 solid #9aa5b1",
    borderBottom: "1 solid #9aa5b1",
    padding: 5
  },
  cellHeading: {
    fontSize: 8.5,
    fontWeight: 700,
    color: "#183942"
  },
  points: {
    fontSize: 8.25,
    fontWeight: 700,
    marginBottom: 2
  },
  description: {
    lineHeight: 1.25
  },
  scoringRow: {
    flexDirection: "row",
    marginTop: 10
  },
  scoringBox: {
    width: "33.33%",
    paddingRight: 12
  },
  notesBox: {
    marginTop: 9
  },
  notesLine: {
    borderBottom: "1 solid #9aa5b1",
    height: 16
  },
  footer: {
    marginTop: 6,
    fontSize: 8,
    color: "#59635d"
  }
});

function cleanPart(value: string, fallback: string) {
  return (value || fallback)
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function InfoLine({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.infoBox}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={value ? styles.filledLine : styles.line}>{value ?? ""}</Text>
    </View>
  );
}

export function RubricPdfDocument({ lessonPlan }: { lessonPlan: LessonPlan }) {
  return (
    <Document>
      <Page size="LETTER" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Rubric</Text>
          <Text style={styles.subtitle}>
            {lessonPlan.titleOfLesson} - {lessonPlan.subject} - {lessonPlan.gradeLevel}
          </Text>
        </View>

        <View style={styles.infoGrid}>
          <InfoLine label="Student Name" />
          <InfoLine label="Teacher / Evaluator" value={lessonPlan.name} />
          <InfoLine label="Date" />
          <InfoLine label="Total Score" />
        </View>

        <View style={styles.table}>
          <View style={styles.row} fixed>
            <View style={[styles.headerCell, styles.criterionCell]}>
              <Text style={styles.cellHeading}>Criteria</Text>
            </View>
            {levels.map((level) => (
              <View key={level} style={[styles.headerCell, styles.levelCell]}>
                <Text style={styles.cellHeading}>{level}</Text>
              </View>
            ))}
          </View>

          {lessonPlan.rubric.criteria.map((criterion) => (
            <View key={criterion.criterion} style={styles.row}>
              <View style={styles.criterionCell}>
                <Text style={styles.cellHeading}>{criterion.criterion}</Text>
              </View>
              {levels.map((label) => {
                const level = criterion.levels.find((item) => item.label === label);
                return (
                  <View key={`${criterion.criterion}-${label}`} style={styles.levelCell}>
                    <Text style={styles.points}>{level?.points ?? 0} pts</Text>
                    <Text style={styles.description}>{level?.description ?? ""}</Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        <View style={styles.scoringRow}>
          <View style={styles.scoringBox}>
            <Text style={styles.infoLabel}>Total Possible Points</Text>
            <Text style={styles.filledLine}>{lessonPlan.rubric.totalPossiblePoints}</Text>
          </View>
          <View style={styles.scoringBox}>
            <Text style={styles.infoLabel}>Points Earned</Text>
            <Text style={styles.line}> </Text>
          </View>
          <View style={styles.scoringBox}>
            <Text style={styles.infoLabel}>Percentage / Grade</Text>
            <Text style={styles.line}> </Text>
          </View>
        </View>

        <View style={styles.notesBox}>
          <Text style={styles.infoLabel}>Teacher Feedback / Notes</Text>
          <View style={styles.notesLine} />
          <View style={styles.notesLine} />
        </View>

        <Text style={styles.footer}>
          Use this scoring copy with the generated lesson plan rubric. Verify criteria and point values before using with students.
        </Text>
      </Page>
    </Document>
  );
}

export default function RubricPdfDownload({ lessonPlan }: { lessonPlan: LessonPlan }) {
  const pdfName = `${cleanPart(lessonPlan.titleOfLesson || lessonPlan.lesson, "Rubric")}_Scoring_Rubric.pdf`;

  return (
    <PDFDownloadLink
      className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#244c5a] bg-white px-5 py-3 text-sm font-semibold text-[#244c5a] shadow-sm transition hover:bg-[#f1f5f2] focus:outline-none focus:ring-2 focus:ring-[#244c5a] focus:ring-offset-2"
      document={<RubricPdfDocument lessonPlan={lessonPlan} />}
      fileName={pdfName}
    >
      {({ loading }) => (loading ? "Preparing rubric..." : "Download Rubric PDF")}
    </PDFDownloadLink>
  );
}
