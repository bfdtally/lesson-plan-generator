import type { LessonPlan } from "@/lib/types";
import { getRubricLevel, rubricLevelOrder } from "@/lib/rubric";

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="break-inside-avoid border-t border-[#ead7c4] pt-6 print:border-[#b8b8b8]">
      <h3 className="text-xl font-semibold text-[#006b35] print:text-black">{title}</h3>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[#303833]">
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-[#66736b]">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-[#1d2320]">{value}</dd>
    </div>
  );
}

function HandsOnProjectSection({ project }: { project: NonNullable<LessonPlan["handsOnProject"]> }) {
  return (
    <section className="break-inside-avoid border-t border-[#ead7c4] pt-6 print:border-[#b8b8b8]">
      <div className="rounded-md border-l-4 border-[#f58220] bg-[#fff8ef] p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-[#f58220]">Featured classroom project</p>
        <h3 className="mt-2 text-2xl font-bold text-[#006b35] print:text-black">
          Hands-on Project: {project.title}
        </h3>
        <p className="mt-3 text-sm leading-6 text-[#303833]">{project.overview}</p>
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <Section title="Teacher Setup" items={project.teacherSetup} />
        <Section title="Student Task" items={project.studentTask} />
        <Section title="Deliverables" items={project.deliverables} />
        <Section title="Grouping and Timing" items={project.groupingAndTiming} />
      </div>
      <div className="mt-5">
        <Section title="Differentiation and Support" items={project.differentiationSupport} />
      </div>
    </section>
  );
}

export default function LessonPlanPreview({ lessonPlan }: { lessonPlan: LessonPlan }) {
  return (
    <article className="space-y-8 rounded-md border border-[#ead7c4] bg-white p-6 shadow-sm sm:p-8 print:rounded-none print:border-0 print:p-0 print:shadow-none">
      <header className="border-b-4 border-[#006b35] pb-5">
        <img
          src="/famu-drs-logo.png"
          alt="Florida A&M University Developmental Research School"
          className="h-auto w-full max-w-[430px] print:max-w-[320px]"
        />
        <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[#f58220]">
          FAMU DRS instructional planning pilot
        </p>
        <h2 className="mt-2 text-3xl font-bold text-[#10251b] print:text-2xl">{lessonPlan.heading.title}</h2>
        <p className="mt-2 text-sm text-[#59635d]">{lessonPlan.heading.subtitle}</p>
      </header>

      <dl className="grid gap-4 rounded-md border-l-4 border-[#f58220] bg-[#fff8ef] p-4 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-2 print:border print:border-[#b8b8b8] print:bg-white">
        <Detail label="School" value={lessonPlan.schoolName} />
        <Detail label="Teacher" value={lessonPlan.name} />
        <Detail label="Class / Course" value={lessonPlan.className} />
        <Detail label="Grade Level" value={lessonPlan.gradeLevel} />
        <Detail label="State" value={lessonPlan.state} />
        <Detail label="Title of Lesson" value={lessonPlan.titleOfLesson} />
        <Detail label="Subject" value={lessonPlan.subject} />
        <Detail label="Unit" value={lessonPlan.unit} />
        <Detail label="Lesson" value={lessonPlan.lesson} />
      </dl>

      <Section title="Goals" items={lessonPlan.goals} />
      <Section title="Behavioral Objectives" items={lessonPlan.specificBehavioralObjectives} />
      <Section title="Standards" items={lessonPlan.associatedStandards} />
      <Section title="Standards Sources" items={lessonPlan.standardsSources} />
      {lessonPlan.providedResources.length > 0 ? (
        <Section title="Provided Resources" items={lessonPlan.providedResources} />
      ) : null}
      {lessonPlan.handsOnProject ? (
        <HandsOnProjectSection project={lessonPlan.handsOnProject} />
      ) : null}
      <Section title="Materials" items={lessonPlan.materialsResourcesEquipment} />
      <Section title="Preventative Techniques" items={lessonPlan.preventativeTechniques} />
      <Section title="Interventive Techniques" items={lessonPlan.interventiveTechniques} />

      <section className="break-before-auto border-t border-[#ead7c4] pt-6 print:border-[#b8b8b8]">
        <h3 className="text-xl font-semibold text-[#006b35] print:text-black">Step-by-step Procedures</h3>
        <div className="mt-4 grid gap-4">
          <Section title="1. Attention Grabber" items={lessonPlan.methodsProcedures.attentionGrabber} />
          <Section title="2. Introduction of the Lesson" items={lessonPlan.methodsProcedures.introductionOfLesson} />
          <Section title="3. Teacher Modeling / Direct Instruction" items={lessonPlan.methodsProcedures.teacherModelingDirectInstruction} />
          <Section title="4. Critical Thinking Questioning / Guided Practice" items={lessonPlan.methodsProcedures.criticalThinkingQuestioningGuidedPractice} />
          <Section title="5. Independent or Group Work" items={lessonPlan.methodsProcedures.independentOrGroupWork} />
        </div>
      </section>

      <Section title="Assessment" items={lessonPlan.assessment} />

      <section className="break-inside-avoid border-t border-[#ead7c4] pt-6 print:border-[#b8b8b8]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h3 className="text-xl font-semibold text-[#006b35] print:text-black">Rubric</h3>
          <p className="text-sm font-semibold text-[#59635d]">
            Total possible points: {lessonPlan.rubric.totalPossiblePoints}
          </p>
        </div>
        <div className="mt-4 max-w-full overflow-hidden">
          <table className="w-full table-fixed border-collapse text-left text-[11px] leading-5 print:text-[9px]">
            <colgroup>
              <col className="w-[18%]" />
              <col className="w-[20.5%]" />
              <col className="w-[20.5%]" />
              <col className="w-[20.5%]" />
              <col className="w-[20.5%]" />
            </colgroup>
            <thead>
              <tr className="bg-[#fff0df]">
                <th className="break-words border border-[#ead7c4] p-2 font-semibold hyphens-auto">Criteria</th>
                {rubricLevelOrder.map((label) => (
                  <th key={label} className="break-words border border-[#ead7c4] p-2 font-semibold hyphens-auto">
                    {label} / Points
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lessonPlan.rubric.criteria.map((criterion) => (
                <tr key={criterion.criterion}>
                  <th className="break-words border border-[#ead7c4] p-2 align-top font-semibold hyphens-auto">{criterion.criterion}</th>
                  {rubricLevelOrder.map((label) => {
                    const level = getRubricLevel(criterion, label);
                    return (
                      <td key={`${criterion.criterion}-${label}`} className="break-words border border-[#ead7c4] p-2 align-top hyphens-auto">
                        <span className="font-semibold">{level?.points ?? 0} pts</span>
                        <p className="mt-1 text-[#303833]">{level?.description}</p>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Section title="Reflection" items={lessonPlan.reflection} />
      <Section title="Enrichment Activities" items={lessonPlan.enrichmentActivities} />
    </article>
  );
}
