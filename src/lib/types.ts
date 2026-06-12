export type LessonFormData = {
  studentName: string;
  courseNumber: string;
  courseTitle: string;
  subject: string;
  unit: string;
  lesson: string;
  gradeLevel: string;
  lessonDescription: string;
};

export type RubricLevel = {
  label: "Excellent" | "Proficient" | "Developing" | "Beginning";
  points: number;
  description: string;
};

export type RubricCriterion = {
  criterion: string;
  levels: RubricLevel[];
};

export type LessonPlan = {
  heading: {
    program: string;
    template: string;
    format: string;
  };
  student: string;
  courseNumber: string;
  courseTitle: string;
  gradeLevel: string;
  titleOfLesson: string;
  subject: string;
  unit: string;
  lesson: string;
  goals: string[];
  specificBehavioralObjectives: string[];
  associatedStandards: string[];
  materialsResourcesEquipment: string[];
  preventativeTechniques: string[];
  interventiveTechniques: string[];
  methodsProcedures: {
    attentionGrabber: string[];
    introductionOfLesson: string[];
    teacherModelingDirectInstruction: string[];
    criticalThinkingQuestioningGuidedPractice: string[];
    independentOrGroupWork: string[];
  };
  assessment: string[];
  rubric: {
    criteria: RubricCriterion[];
    totalPossiblePoints: number;
  };
  reflection: string[];
  enrichmentActivities: string[];
};

export const requiredFields: Array<keyof LessonFormData> = [
  "studentName",
  "courseNumber",
  "courseTitle",
  "subject",
  "unit",
  "lesson",
  "gradeLevel",
  "lessonDescription"
];
