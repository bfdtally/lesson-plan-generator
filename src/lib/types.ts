export type SchoolId = "elementary" | "middle" | "high";

export type SchoolOption = {
  id: SchoolId;
  label: string;
};

export const schoolOptions: SchoolOption[] = [
  { id: "elementary", label: "FAMU DRS Elementary School" },
  { id: "middle", label: "FAMU DRS Middle School" },
  { id: "high", label: "FAMU DRS High School" }
];

export type LessonFormData = {
  schoolId: SchoolId | "";
  name: string;
  className: string;
  subject: string;
  unit: string;
  lesson: string;
  gradeLevel: string;
  state: string;
  resources: string;
  lessonDescription: string;
};

export type ResourceImage = {
  name: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  dataUrl: string;
};

export type RubricLevel = {
  label:
    | "Favorable"
    | "Acceptable"
    | "Marginal"
    | "Unacceptable"
    | "Excellent"
    | "Proficient"
    | "Developing"
    | "Beginning";
  points: number;
  description: string;
};

export type RubricCriterion = {
  criterion: string;
  levels: RubricLevel[];
};

export type HandsOnProject = {
  title: string;
  overview: string;
  teacherSetup: string[];
  studentTask: string[];
  deliverables: string[];
  groupingAndTiming: string[];
  differentiationSupport: string[];
};

export type LessonPlan = {
  heading: {
    title: string;
    subtitle: string;
  };
  name: string;
  schoolId: SchoolId;
  schoolName: string;
  className: string;
  gradeLevel: string;
  state: string;
  titleOfLesson: string;
  subject: string;
  unit: string;
  lesson: string;
  goals: string[];
  specificBehavioralObjectives: string[];
  associatedStandards: string[];
  standardsSources: string[];
  providedResources: string[];
  resourceImages?: ResourceImage[];
  handsOnProject?: HandsOnProject;
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

export type AdminLessonRow = {
  id: string;
  school_id: SchoolId;
  school_name: string;
  teacher_user_id: string | null;
  teacher_name: string;
  class_name: string;
  subject: string;
  unit: string;
  lesson: string;
  grade_level: string;
  standards_state: string;
  lesson_description: string;
  resources: string | null;
  lesson_plan: LessonPlan;
  status: "draft" | "submitted" | "reviewed" | "archived";
  created_at: string;
  updated_at: string;
};

export type TeacherLessonSummary = {
  id: string;
  school_id: SchoolId;
  teacher_name: string;
  class_name: string;
  subject: string;
  unit: string;
  lesson: string;
  grade_level: string;
  created_at: string;
  updated_at: string;
};

export const requiredFields: Array<keyof LessonFormData> = [
  "schoolId",
  "name",
  "className",
  "subject",
  "unit",
  "lesson",
  "gradeLevel",
  "lessonDescription"
];
