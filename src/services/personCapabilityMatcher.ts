import { Person } from '../types/person';
import { PlanStep } from '../types/plan';

export const personCapabilityMatcher = {
  matchPersonForStep(stepTitle: string, stepDescription: string, availablePeople: Person[]): Person | null {
    if (availablePeople.length === 0) return null;
    if (availablePeople.length === 1) return availablePeople[0];

    const textToMatch = `${stepTitle} ${stepDescription}`.toLowerCase();

    let bestPerson: Person = availablePeople[0];
    let highestScore = -1;

    for (const person of availablePeople) {
      let score = 0;

      // 1. Role match
      if (person.role && textToMatch.includes(person.role.toLowerCase())) {
        score += 5;
      }

      // 2. Responsibilities match
      if (person.responsibilities) {
        person.responsibilities.forEach((r) => {
          if (textToMatch.includes(r.toLowerCase())) score += 3;
        });
      }

      // 3. Skills match
      if (person.skills) {
        person.skills.forEach((s) => {
          if (textToMatch.includes(s.toLowerCase())) score += 2;
        });
      }

      if (score > highestScore) {
        highestScore = score;
        bestPerson = person;
      }
    }

    return bestPerson;
  },

  getPersonWorkload(personId: string, allPlanSteps: PlanStep[]): number {
    return allPlanSteps.filter(
      (s) => s.ownerPersonId === personId && (s.status === 'running' || s.status === 'ready' || s.status === 'pending'),
    ).length;
  },
};
