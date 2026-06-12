import { NextResponse } from "next/server";
import OpenAI from "openai";
import { requiredFields, type LessonFormData, type LessonPlan } from "@/lib/types";

const lessonPlanSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "heading",
    "student",
    "courseNumber",
    "courseTitle",
    "gradeLevel",
    "titleOfLesson",
    "subject",
    "unit",
    "lesson",
    "goals",
    "specificBehavioralObjectives",
    "associatedStandards",
    "materialsResourcesEquipment",
    "preventativeTechniques",
    "interventiveTechniques",
    "methodsProcedures",
    "assessment",
    "rubric",
    "reflection",
    "enrichmentActivities"
  ],
  properties: {
    heading: {
      type: "object",
      additionalProperties: false,
      required: ["program", "template", "format"],
      properties: {
        program: { type: "string" },
        template: { type: "string" },
        format: { type: "string" }
      }
    },
    student: { type: "string" },
    courseNumber: { type: "string" },
    courseTitle: { type: "string" },
    gradeLevel: { type: "string" },
    titleOfLesson: { type: "string" },
    subject: { type: "string" },
    unit: { type: "string" },
    lesson: { type: "string" },
    goals: { type: "array", items: { type: "string" } },
    specificBehavioralObjectives: { type: "array", items: { type: "string" } },
    associatedStandards: { type: "array", items: { type: "string" } },
    materialsResourcesEquipment: { type: "array", items: { type: "string" } },
    preventativeTechniques: { type: "array", items: { type: "string" } },
    interventiveTechniques: { type: "array", items: { type: "string" } },
    methodsProcedures: {
      type: "object",
      additionalProperties: false,
      required: [
        "attentionGrabber",
        "introductionOfLesson",
        "teacherModelingDirectInstruction",
        "criticalThinkingQuestioningGuidedPractice",
        "independentOrGroupWork"
      ],
      properties: {
        attentionGrabber: { type: "array", items: { type: "string" } },
        introductionOfLesson: { type: "array", items: { type: "string" } },
        teacherModelingDirectInstruction: { type: "array", items: { type: "string" } },
        criticalThinkingQuestioningGuidedPractice: { type: "array", items: { type: "string" } },
        independentOrGroupWork: { type: "array", items: { type: "string" } }
      }
    },
    assessment: { type: "array", items: { type: "string" } },
    rubric: {
      type: "object",
      additionalProperties: false,
      required: ["criteria", "totalPossiblePoints"],
      properties: {
        totalPossiblePoints: { type: "number" },
        criteria: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["criterion", "levels"],
            properties: {
              criterion: { type: "string" },
              levels: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["label", "points", "description"],
                  properties: {
                    label: { type: "string", enum: ["Excellent", "Proficient", "Developing", "Beginning"] },
                    points: { type: "number" },
                    description: { type: "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    reflection: { type: "array", items: { type: "string" } },
    enrichmentActivities: { type: "array", items: { type: "string" } }
  }
} as const;

function validateForm(form: LessonFormData) {
  return requiredFields.filter((field) => !form[field]?.trim());
}

const rubricLabels = ["Excellent", "Proficient", "Developing", "Beginning"] as const;

function textArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function hasAllRequiredSections(lessonPlan: LessonPlan) {
  const procedures = lessonPlan.methodsProcedures;
  return Boolean(
    lessonPlan.heading?.program &&
      lessonPlan.student &&
      lessonPlan.courseNumber &&
      lessonPlan.courseTitle &&
      lessonPlan.gradeLevel &&
      lessonPlan.titleOfLesson &&
      lessonPlan.subject &&
      lessonPlan.unit &&
      lessonPlan.lesson &&
      textArray(lessonPlan.goals).length &&
      textArray(lessonPlan.specificBehavioralObjectives).length &&
      textArray(lessonPlan.associatedStandards).length &&
      textArray(lessonPlan.materialsResourcesEquipment).length &&
      textArray(lessonPlan.preventativeTechniques).length &&
      textArray(lessonPlan.interventiveTechniques).length &&
      procedures &&
      textArray(procedures.attentionGrabber).length &&
      textArray(procedures.introductionOfLesson).length &&
      textArray(procedures.teacherModelingDirectInstruction).length &&
      textArray(procedures.criticalThinkingQuestioningGuidedPractice).length &&
      textArray(procedures.independentOrGroupWork).length &&
      textArray(lessonPlan.assessment).length &&
      textArray(lessonPlan.reflection).length &&
      textArray(lessonPlan.enrichmentActivities).length >= 2
  );
}

function hasCompleteRubric(lessonPlan: LessonPlan) {
  return Boolean(
    lessonPlan.rubric &&
      Number.isFinite(lessonPlan.rubric.totalPossiblePoints) &&
      Array.isArray(lessonPlan.rubric.criteria) &&
      lessonPlan.rubric.criteria.length === 4 &&
      lessonPlan.rubric.criteria.every(
        (criterion) =>
          typeof criterion.criterion === "string" &&
          criterion.criterion.trim().length > 0 &&
          Array.isArray(criterion.levels) &&
          rubricLabels.every((label) =>
            criterion.levels.some(
              (level) =>
                level.label === label &&
                Number.isFinite(level.points) &&
                typeof level.description === "string" &&
                level.description.trim().length > 0
            )
          )
      )
  );
}

function assertCompleteLessonPlan(lessonPlan: LessonPlan) {
  if (!hasAllRequiredSections(lessonPlan) || !hasCompleteRubric(lessonPlan)) {
    throw new Error("Generated lesson plan did not include every required section.");
  }
}

export async function POST(request: Request) {
  const form = (await request.json()) as LessonFormData;
  const missingFields = validateForm(form);

  if (missingFields.length > 0) {
    return NextResponse.json(
      { error: "Please complete all required fields.", missingFields },
      { status: 400 }
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      {
        error: "Something went wrong. Please check your information and try again."
      },
      { status: 500 }
    );
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You create complete, practical, classroom-appropriate lesson plans for college teacher candidates. Return only valid structured JSON that matches the provided schema. Never return markdown or prose outside the JSON. Keep language student-friendly, specific, teacher-friendly, and ready to use in a real classroom."
        },
        {
          role: "user",
          content: `Create a complete lesson plan using this required format:

EME 2040 Introduction to Educational Technology
Lesson Plan Template
College of Education: Standard Lesson Plan Format

Student: ${form.studentName}
Course Number: ${form.courseNumber}
Course Title: ${form.courseTitle}
Grade Level: ${form.gradeLevel}
Title of Lesson: ${form.lesson}
Subject: ${form.subject}
Unit: ${form.unit}
Lesson: ${form.lesson}

Lesson Description:
${form.lessonDescription}

Requirements:
- Always include Goals.
- Always include Behavioral Objectives with measurable action verbs.
- Always include Standards. If exact state standards are uncertain, clearly label them as suggested standards and tell the student to verify them with the teacher or district.
- Always include Materials, including low-cost classroom materials when possible.
- Always include Preventative Techniques.
- Always include Interventive Techniques.
- Always include Step-by-step Procedures with Attention Grabber, Introduction of the Lesson, Teacher Modeling / Direct Instruction, Critical Thinking Questioning / Guided Practice, and Independent or Group Work.
- Always include Assessment.
- Always include Reflection prompts.
- Always include at least two Enrichment Activities.
- Always include a rubric with exactly 4 criteria.
- Each rubric criterion must include Excellent, Proficient, Developing, and Beginning.
- Each rubric performance level must include points and a clear student-friendly description.
- Include total possible points for the rubric.`
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "lesson_plan",
          schema: lessonPlanSchema,
          strict: true
        }
      }
    });

    const lessonPlan = JSON.parse(response.output_text) as LessonPlan;
    assertCompleteLessonPlan(lessonPlan);

    return NextResponse.json({ lessonPlan });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: "Something went wrong. Please check your information and try again."
      },
      { status: 500 }
    );
  }
}
