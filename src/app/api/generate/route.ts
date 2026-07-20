import { NextResponse } from "next/server";
import OpenAI from "openai";
import { saveGeneratedLesson } from "@/lib/supabaseAdmin";
import { requiredFields, schoolOptions, type LessonFormData, type LessonPlan, type ResourceImage } from "@/lib/types";

const lessonPlanSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "heading",
    "name",
    "schoolId",
    "schoolName",
    "className",
    "gradeLevel",
    "state",
    "titleOfLesson",
    "subject",
    "unit",
    "lesson",
    "goals",
    "specificBehavioralObjectives",
    "associatedStandards",
    "standardsSources",
    "providedResources",
    "handsOnProject",
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
      required: ["title", "subtitle"],
      properties: {
        title: { type: "string" },
        subtitle: { type: "string" }
      }
    },
    name: { type: "string" },
    schoolId: { type: "string", enum: ["elementary", "middle", "high"] },
    schoolName: { type: "string" },
    className: { type: "string" },
    gradeLevel: { type: "string" },
    state: { type: "string" },
    titleOfLesson: { type: "string" },
    subject: { type: "string" },
    unit: { type: "string" },
    lesson: { type: "string" },
    goals: { type: "array", items: { type: "string" } },
    specificBehavioralObjectives: { type: "array", items: { type: "string" } },
    associatedStandards: { type: "array", items: { type: "string" } },
    standardsSources: { type: "array", items: { type: "string" } },
    providedResources: { type: "array", items: { type: "string" } },
    handsOnProject: {
      type: "object",
      additionalProperties: false,
      required: [
        "title",
        "overview",
        "teacherSetup",
        "studentTask",
        "deliverables",
        "groupingAndTiming",
        "differentiationSupport"
      ],
      properties: {
        title: { type: "string" },
        overview: { type: "string" },
        teacherSetup: { type: "array", items: { type: "string" } },
        studentTask: { type: "array", items: { type: "string" } },
        deliverables: { type: "array", items: { type: "string" } },
        groupingAndTiming: { type: "array", items: { type: "string" } },
        differentiationSupport: { type: "array", items: { type: "string" } }
      }
    },
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
                    label: { type: "string", enum: ["Favorable", "Acceptable", "Marginal", "Unacceptable"] },
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

function normalizeForm(form: LessonFormData): LessonFormData {
  return {
    ...form,
    state: "Florida"
  };
}

function schoolNameFor(form: LessonFormData) {
  return schoolOptions.find((school) => school.id === form.schoolId)?.label ?? "FAMU DRS";
}

const rubricLabels = ["Favorable", "Acceptable", "Marginal", "Unacceptable"] as const;
const supportedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxResourceImages = 4;

function textArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function hasAllRequiredSections(lessonPlan: LessonPlan) {
  const procedures = lessonPlan.methodsProcedures;
  const project = lessonPlan.handsOnProject;
  return Boolean(
    lessonPlan.heading?.title &&
      lessonPlan.heading?.subtitle &&
      lessonPlan.name &&
      lessonPlan.schoolId &&
      lessonPlan.schoolName &&
      lessonPlan.className &&
      lessonPlan.gradeLevel &&
      lessonPlan.state &&
      lessonPlan.titleOfLesson &&
      lessonPlan.subject &&
      lessonPlan.unit &&
      lessonPlan.lesson &&
      textArray(lessonPlan.goals).length &&
      textArray(lessonPlan.specificBehavioralObjectives).length &&
      textArray(lessonPlan.associatedStandards).length &&
      textArray(lessonPlan.standardsSources).length &&
      project &&
      project.title &&
      project.overview &&
      textArray(project.teacherSetup).length &&
      textArray(project.studentTask).length &&
      textArray(project.deliverables).length &&
      textArray(project.groupingAndTiming).length &&
      textArray(project.differentiationSupport).length &&
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

function sanitizeResourceImages(value: unknown): ResourceImage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((image): image is ResourceImage => {
      if (!image || typeof image !== "object") {
        return false;
      }

      const candidate = image as Partial<ResourceImage>;
      return Boolean(
        typeof candidate.name === "string" &&
          candidate.name.trim().length > 0 &&
          typeof candidate.mimeType === "string" &&
          supportedImageTypes.has(candidate.mimeType) &&
          typeof candidate.dataUrl === "string" &&
          candidate.dataUrl.startsWith(`data:${candidate.mimeType};base64,`)
      );
    })
    .slice(0, maxResourceImages);
}

async function findStandardsContext(openai: OpenAI, form: LessonFormData) {
  const response = await openai.responses.create({
    model: process.env.OPENAI_SEARCH_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-mini",
    tools: [{ type: "web_search_preview" }],
    input: [
      {
        role: "system",
        content:
          "Find official K-12 academic standards sources. Prefer official state education agency pages, official standards portals, and official state-backed standards databases such as CPALMS for Florida. Be concise."
      },
      {
        role: "user",
        content: `Find the most relevant official standards sources and likely standards for this lesson.

State: ${form.state}
Grade Level: ${form.gradeLevel}
Subject: ${form.subject}
Unit: ${form.unit}
Lesson: ${form.lesson}
Lesson Description: ${form.lessonDescription}

Return concise notes with:
- likely official standards framework/source name for this state and subject
- 2 to 6 likely relevant standards, benchmarks, or standard-code candidates
- source URLs or official source names
- uncertainty notes if exact wording or codes need verification`
      }
    ]
  });

  return response.output_text;
}

export async function POST(request: Request) {
  const requestBody = (await request.json()) as LessonFormData & {
    existingLessonId?: string | null;
    resourceImages?: ResourceImage[];
  };
  const form = normalizeForm(requestBody);
  const existingLessonId = requestBody.existingLessonId ?? null;
  const resourceImages = sanitizeResourceImages(requestBody.resourceImages);
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
    let standardsContext = "";
    try {
      standardsContext = await findStandardsContext(openai, form);
    } catch (lookupError) {
      console.error("Standards lookup failed:", lookupError);
      standardsContext =
        `Live standards lookup was unavailable. Generate suggested ${form.state} standards alignments from model knowledge and clearly tell the user to verify exact codes and wording with the official state education agency or district standards source.`;
    }

    const lessonPrompt = `Create a complete lesson plan using this required format:

Lesson Plan
Classroom-ready lesson plan and rubric

Name: ${form.name}
School: ${schoolNameFor(form)}
School ID: ${form.schoolId}
Class / Course: ${form.className}
Grade Level: ${form.gradeLevel}
State for K-12 Content Standards: Florida
Title of Lesson: ${form.lesson}
Subject: ${form.subject}
Unit: ${form.unit}
Lesson: ${form.lesson}

Lesson Description:
${form.lessonDescription}

Teacher-provided resources, URLs, uploaded file names, image file names, and excerpts:
${form.resources?.trim() || "No additional resources were provided."}

Uploaded images available for visual analysis:
${resourceImages.length ? resourceImages.map((image) => `- ${image.name} (${image.mimeType})`).join("\n") : "No images were uploaded."}

Live standards lookup notes:
${standardsContext}

Requirements:
- Always include Goals.
- Always include Behavioral Objectives with measurable action verbs.
- Always identify the likely official Florida K-12 content standards framework for this subject area. Florida science and social studies standards may be found through CPALMS, while Florida math and ELA use B.E.S.T. Standards.
- Always include Standards aligned to Florida, the grade level, subject, unit, and lesson.
- Use the live standards lookup notes above to select the most relevant standards.
- Include the most relevant standard codes, strands, benchmarks, or concise descriptions when the lookup supports them.
- Always include standardsSources with official source names and URLs when available.
- If exact standard codes, source names, or wording may be uncertain, clearly label them as suggested alignments and tell the user to verify the exact standards with CPALMS, the Florida Department of Education, or FAMU DRS/district curriculum guidance.
- Always include Materials, including low-cost classroom materials when possible.
- If teacher-provided resources are included, use them to enrich the lesson where relevant.
- If uploaded images are included, analyze them and use relevant visible details to enrich the lesson plan, especially materials, procedures, modeling, guided practice, assessment evidence, and the hands-on project.
- Do not claim that an uploaded image shows something unless it is visually supported by the image.
- Always include providedResources as a concise list of resources, URLs, uploaded file names, image file names, or excerpts the lesson used. Use an empty array if none were provided.
- Do not invent resource URLs. Only include URLs that were provided by the user or found in the live standards lookup notes.
- Always include a prominent handsOnProject section.
- If the teacher describes a hands-on project, activity, model, lab, performance task, or classroom project in the Lesson Description, uploaded images, or provided resources, preserve that idea and expand it into a complete classroom-ready project.
- If the teacher does not provide a hands-on project idea, create a practical, low-cost hands-on project aligned to the lesson, grade level, Florida standards, available classroom materials, and any useful image context.
- The handsOnProject must include a specific title, concise overview, teacher setup steps, student task steps, student deliverables, grouping and timing guidance, and differentiation/support ideas.
- The project must be specific enough that a teacher could use it tomorrow without needing to invent the main activity.
- Connect the hands-on project clearly to the procedures, assessment, materials, and at least one rubric criterion.
- Always include Preventative Techniques.
- Always include Interventive Techniques.
- Always include Step-by-step Procedures with Attention Grabber, Introduction of the Lesson, Teacher Modeling / Direct Instruction, Critical Thinking Questioning / Guided Practice, and Independent or Group Work.
- Always include Assessment.
- Always include Reflection prompts.
- Always include at least two Enrichment Activities.
- Always include a rubric with exactly 4 criteria.
- Each rubric criterion must include Favorable, Acceptable, Marginal, and Unacceptable as the four FAMU performance levels.
- Each rubric performance level must include points and a clear learner-friendly description.
- Include total possible points for the rubric.`;

    const lessonInputContent = [
      { type: "input_text" as const, text: lessonPrompt },
      ...resourceImages.map((image) => ({
        type: "input_image" as const,
        image_url: image.dataUrl,
        detail: "auto" as const
      }))
    ];

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You create complete, practical, classroom-appropriate lesson plans for FAMU DRS teachers. Return only valid structured JSON that matches the provided schema. Never return markdown or prose outside the JSON. Keep language clear, specific, teacher-friendly, and ready to use in a real elementary, middle, or high school classroom."
        },
        {
          role: "user",
          content: resourceImages.length ? lessonInputContent : lessonPrompt
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
    lessonPlan.resourceImages = resourceImages;
    assertCompleteLessonPlan(lessonPlan);

    let savedLessonId: string | null = null;
    try {
      savedLessonId = await saveGeneratedLesson({ form, lessonPlan, existingLessonId });
    } catch (saveError) {
      console.error("Lesson save failed:", saveError);
    }

    return NextResponse.json({ lessonPlan, savedLessonId });
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
