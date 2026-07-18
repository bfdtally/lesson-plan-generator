"use client";

import {
  Document,
  Image,
  Page,
  PDFDownloadLink,
  StyleSheet,
  Text,
  View
} from "@react-pdf/renderer";
import type { LessonPlan } from "@/lib/types";

const styles = StyleSheet.create({
  page: {
    padding: 34,
    fontSize: 9,
    color: "#1f2933",
    fontFamily: "Helvetica"
  },
  header: {
    marginBottom: 10,
    borderBottom: "2 solid #006b35",
    paddingBottom: 12
  },
  brandLogo: {
    width: 250,
    marginBottom: 8
  },
  brandKicker: {
    fontSize: 8.5,
    fontWeight: 700,
    color: "#f58220",
    marginBottom: 4,
    textTransform: "uppercase"
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: "#10251b",
    marginBottom: 5
  },
  subtitle: {
    fontSize: 9.5,
    marginBottom: 2
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    border: "1 solid #ead7c4",
    borderLeft: "4 solid #f58220",
    marginBottom: 8
  },
  detailCell: {
    width: "50%",
    padding: 4,
    borderBottom: "1 solid #ead7c4"
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginTop: 8,
    marginBottom: 3,
    color: "#006b35"
  },
  line: {
    marginBottom: 3
  },
  smallText: {
    fontSize: 8.5,
    lineHeight: 1.35
  },
  label: {
    fontWeight: 700
  },
  bullet: {
    flexDirection: "row",
    marginBottom: 2
  },
  bulletText: {
    width: 10
  },
  bulletContent: {
    flex: 1
  },
  rubricHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#fff0df",
    borderTop: "1 solid #9aa5b1",
    borderLeft: "1 solid #9aa5b1",
    marginTop: 2
  },
  rubricRow: {
    flexDirection: "row",
    borderLeft: "1 solid #9aa5b1"
  },
  rubricCriterionCell: {
    width: "18%",
    borderRight: "1 solid #9aa5b1",
    borderBottom: "1 solid #9aa5b1",
    padding: 4
  },
  rubricCell: {
    width: "20.5%",
    borderRight: "1 solid #9aa5b1",
    borderBottom: "1 solid #9aa5b1",
    padding: 4
  },
  rubricHeaderText: {
    fontSize: 8.5,
    fontWeight: 700,
    color: "#10251b"
  },
  rubricPoints: {
    fontSize: 8.5,
    fontWeight: 700,
    marginBottom: 0
  },
  rubricTotal: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: 700,
    textAlign: "right"
  }
});

function BulletList({ items }: { items: string[] }) {
  return (
    <>
      {items.map((item, index) => (
        <View key={`${item}-${index}`} style={styles.bullet}>
          <Text style={styles.bulletText}>-</Text>
          <Text style={styles.bulletContent}>{item}</Text>
        </View>
      ))}
    </>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <>
      <Text style={styles.sectionTitle} minPresenceAhead={18}>
        {title}
      </Text>
      <BulletList items={items} />
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailCell}>
      <Text style={styles.label}>{label}</Text>
      <Text>{value}</Text>
    </View>
  );
}

const rubricLevels = ["Excellent", "Proficient", "Developing", "Beginning"] as const;

export function LessonPlanPdfDocument({ lessonPlan }: { lessonPlan: LessonPlan }) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Image src="/famu-drs-logo.png" style={styles.brandLogo} />
          <Text style={styles.brandKicker}>FAMU DRS instructional planning pilot</Text>
          <Text style={styles.title}>{lessonPlan.heading.title}</Text>
          <Text style={styles.subtitle}>{lessonPlan.heading.subtitle}</Text>
        </View>

        <View style={styles.detailsGrid}>
          <Detail label="School" value={lessonPlan.schoolName} />
          <Detail label="Teacher" value={lessonPlan.name} />
          <Detail label="Class / Course" value={lessonPlan.className} />
          <Detail label="Subject" value={lessonPlan.subject} />
          <Detail label="Unit" value={lessonPlan.unit} />
          <Detail label="Lesson" value={lessonPlan.lesson} />
          <Detail label="Grade Level" value={lessonPlan.gradeLevel} />
          <Detail label="State" value={lessonPlan.state} />
          <Detail label="Title of Lesson" value={lessonPlan.titleOfLesson} />
        </View>

        <Section title="Goals" items={lessonPlan.goals} />
        <Section title="Behavioral Objectives" items={lessonPlan.specificBehavioralObjectives} />
        <Section title="Standards" items={lessonPlan.associatedStandards} />
        <Section title="Standards Sources" items={lessonPlan.standardsSources} />
        {lessonPlan.providedResources.length > 0 ? (
          <Section title="Provided Resources" items={lessonPlan.providedResources} />
        ) : null}
        <Section title="Materials" items={lessonPlan.materialsResourcesEquipment} />
        <Section title="Preventative Techniques" items={lessonPlan.preventativeTechniques} />
        <Section title="Interventive Techniques" items={lessonPlan.interventiveTechniques} />

        <Text style={styles.sectionTitle} minPresenceAhead={18}>
          Methods/Procedures
        </Text>
        <Section title="1. Attention Grabber" items={lessonPlan.methodsProcedures.attentionGrabber} />
        <Section title="2. Introduction of the Lesson" items={lessonPlan.methodsProcedures.introductionOfLesson} />
        <Section title="3. Teacher Modeling / Direct Instruction" items={lessonPlan.methodsProcedures.teacherModelingDirectInstruction} />
        <Section title="4. Critical Thinking Questioning / Guided Practice" items={lessonPlan.methodsProcedures.criticalThinkingQuestioningGuidedPractice} />
        <Section title="5. Independent or Group Work" items={lessonPlan.methodsProcedures.independentOrGroupWork} />

        <Section title="Assessment" items={lessonPlan.assessment} />

        <Text style={styles.sectionTitle} minPresenceAhead={18}>
          Rubric
        </Text>
        <View style={styles.rubricHeaderRow}>
          <View style={styles.rubricCriterionCell}>
            <Text style={styles.rubricHeaderText}>Criteria</Text>
          </View>
          {rubricLevels.map((label) => (
            <View key={label} style={styles.rubricCell}>
              <Text style={styles.rubricHeaderText}>{label} / Points</Text>
            </View>
          ))}
        </View>
        {lessonPlan.rubric.criteria.map((criterion) => (
          <View key={criterion.criterion} style={styles.rubricRow}>
            <View style={styles.rubricCriterionCell}>
              <Text style={styles.rubricHeaderText}>{criterion.criterion}</Text>
            </View>
            {rubricLevels.map((label) => {
              const level = criterion.levels.find((item) => item.label === label);
              return (
                <View key={`${criterion.criterion}-${label}`} style={styles.rubricCell}>
                  <Text style={styles.rubricPoints}>{level?.points ?? 0} pts</Text>
                  <Text style={styles.smallText}>{level?.description ?? ""}</Text>
                </View>
              );
            })}
          </View>
        ))}
        <Text style={styles.rubricTotal}>
          Total possible points: {lessonPlan.rubric.totalPossiblePoints}
        </Text>

        <Section title="Reflection" items={lessonPlan.reflection} />
        <Section title="Enrichment Activities" items={lessonPlan.enrichmentActivities} />
      </Page>
    </Document>
  );
}

export default function LessonPlanPdfDownload({ lessonPlan }: { lessonPlan: LessonPlan }) {
  const cleanPart = (value: string, fallback: string) =>
    (value || fallback)
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  const pdfName = `${cleanPart(lessonPlan.name, "Lesson")}_${cleanPart(
    lessonPlan.titleOfLesson || lessonPlan.lesson,
    "Plan"
  )}_Lesson_Plan.pdf`;

  return (
    <PDFDownloadLink
      className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#006b35] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#00552a] focus:outline-none focus:ring-2 focus:ring-[#f58220] focus:ring-offset-2"
      document={<LessonPlanPdfDocument lessonPlan={lessonPlan} />}
      fileName={pdfName}
    >
      {({ loading }) => (loading ? "Preparing PDF..." : "Download as PDF")}
    </PDFDownloadLink>
  );
}
