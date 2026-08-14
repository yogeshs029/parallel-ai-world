import { PlanStep, StepStatus } from '../types/plan';
import { Goal } from '../types/goal';

export const taskReadinessService = {
  evaluateStepStatus(step: PlanStep, goal: Goal, allSteps: PlanStep[]): StepStatus {
    // 1. Terminal / Completed states remain unchanged
    if (step.status === 'completed' || step.status === 'cancelled' || step.status === 'failed') {
      return step.status;
    }

    // 2. If Goal is not active, step is waiting
    if (goal.status !== 'active') {
      return 'waiting';
    }

    // 3. Check dependencies
    if (!step.dependencies || step.dependencies.length === 0) {
      return step.status === 'running' ? 'running' : 'ready';
    }

    const stepMap = new Map<string, PlanStep>();
    allSteps.forEach((s) => stepMap.set(s.id, s));

    let allDepsCompleted = true;
    let anyDepFailedOrBlocked = false;

    for (const depId of step.dependencies) {
      const depStep = stepMap.get(depId);
      if (!depStep || depStep.status !== 'completed') {
        allDepsCompleted = false;
      }
      if (depStep && (depStep.status === 'failed' || depStep.status === 'blocked')) {
        anyDepFailedOrBlocked = true;
      }
    }

    if (anyDepFailedOrBlocked) return 'blocked';
    if (allDepsCompleted) return step.status === 'running' ? 'running' : 'ready';

    return 'waiting';
  },

  getReadySteps(goal: Goal, steps: PlanStep[]): PlanStep[] {
    if (goal.status !== 'active') return [];
    return steps.filter((s) => this.evaluateStepStatus(s, goal, steps) === 'ready');
  },
};
