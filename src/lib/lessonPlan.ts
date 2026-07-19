import { schoolOptions, type LessonFormData, type LessonPlan } from "./types";

export const emptyForm: LessonFormData = {
  schoolId: "",
  name: "",
  className: "",
  subject: "",
  unit: "",
  lesson: "",
  gradeLevel: "",
  state: "Florida",
  resources: "",
  lessonDescription: ""
};

export function fallbackLessonPlan(form: LessonFormData): LessonPlan {
  const schoolName = schoolOptions.find((school) => school.id === form.schoolId)?.label ?? "FAMU DRS";

  return {
    heading: {
      title: "Lesson Plan",
      subtitle: "Classroom-ready lesson plan and rubric"
    },
    name: form.name,
    schoolId: form.schoolId || "elementary",
    schoolName,
    className: form.className,
    gradeLevel: form.gradeLevel,
    state: "Florida",
    titleOfLesson: form.lesson,
    subject: form.subject,
    unit: form.unit,
    lesson: form.lesson,
    goals: ["Students will build understanding of the lesson topic through an engaging, grade-appropriate learning experience."],
    specificBehavioralObjectives: [
      "Given teacher modeling, guided practice, and classroom materials, students will explain or demonstrate the key lesson concept with at least 80% accuracy."
    ],
    associatedStandards: [
      "Suggested Florida standards alignment: Select grade-level standards that match the lesson topic and verify exact standard codes and wording with CPALMS, the Florida Department of Education, or district curriculum guidance."
    ],
    standardsSources: [
      "CPALMS and the Florida Department of Education standards resources"
    ],
    providedResources: form.resources
      ? form.resources.split("\n").filter((resource) => resource.trim().length > 0)
      : [],
    handsOnProject: {
      title: `${form.lesson || "Lesson"} Hands-on Project`,
      overview:
        "Students complete a practical classroom project that turns the lesson concept into a visible product, model, demonstration, or performance task.",
      teacherSetup: [
        "Prepare low-cost materials and a short model example before class.",
        "Post clear project directions, success criteria, and time checkpoints.",
        "Arrange students in pairs or small groups based on the needs of the activity."
      ],
      studentTask: [
        "Use the lesson content to create a hands-on product, model, demonstration, or explanation.",
        "Record evidence of learning through labels, notes, sketches, calculations, or written explanations.",
        "Share the finished work with classmates and explain how it connects to the lesson objective."
      ],
      deliverables: [
        "Completed project product or demonstration",
        "Student explanation showing the key lesson concept",
        "Brief reflection or exit ticket connecting the project to the learning goal"
      ],
      groupingAndTiming: [
        "Suggested grouping: partners or small groups of three to four students.",
        "Suggested timing: 25 to 40 minutes, depending on grade level and available materials."
      ],
      differentiationSupport: [
        "Provide sentence stems, visuals, or a partially completed organizer for students who need support.",
        "Offer an extension challenge that asks students to add evidence, justify choices, or apply the idea to a new example."
      ]
    },
    materialsResourcesEquipment: [
      "Teacher presentation or anchor chart",
      "Student handouts or notebooks",
      "Pencils or classroom writing tools",
      "Low-cost manipulatives, paper, sticky notes, or index cards as needed"
    ],
    preventativeTechniques: [
      "Post clear directions and success criteria before students begin.",
      "Use proximity, predictable routines, and positive narration to reinforce expected behavior.",
      "Check for understanding before independent or group work begins."
    ],
    interventiveTechniques: [
      "Redirect off-task students quietly and specifically.",
      "Offer a clarifying question, visual cue, or short reteach for confused students.",
      "Use a brief reset or partner support when students need help re-entering the task."
    ],
    methodsProcedures: {
      attentionGrabber: ["Begin with a question, image, quick demonstration, or short scenario connected to students' experiences."],
      introductionOfLesson: ["State the learning goal, explain why the lesson matters, and connect it to prior learning."],
      teacherModelingDirectInstruction: ["Model the thinking process step by step while students observe and respond to brief checks for understanding."],
      criticalThinkingQuestioningGuidedPractice: ["Ask students to explain reasoning, compare examples, and try a guided practice item with feedback."],
      independentOrGroupWork: ["Students complete an individual, partner, or small-group task that applies the lesson concept."]
    },
    assessment: [
      "Use teacher observation, student responses, and a short exit ticket or product check to determine whether students met the objective."
    ],
    rubric: {
      totalPossiblePoints: 16,
      criteria: ["Understanding", "Application", "Participation", "Communication"].map((criterion) => ({
        criterion,
        levels: [
          { label: "Favorable", points: 4, description: "Shows strong understanding and completes the task with clear, accurate details." },
          { label: "Acceptable", points: 3, description: "Shows solid understanding and completes most of the task accurately." },
          { label: "Marginal", points: 2, description: "Shows partial understanding and needs some support or more complete details." },
          { label: "Unacceptable", points: 1, description: "Shows limited understanding and needs significant support to complete the task." }
        ]
      }))
    },
    reflection: [
      "What evidence showed that students met or did not meet the objective?",
      "Which part of the lesson was most effective, and why?",
      "What would you adjust before teaching this lesson again?"
    ],
    enrichmentActivities: [
      "Have students create a visual, digital, or written product that teaches the concept to another student.",
      "Offer a challenge task that asks students to apply the concept to a new real-world example."
    ]
  };
}
