import { Plan, PlanStep } from '../types/plan';
import { Person } from '../types/person';

export interface PlanValidationResult {
  valid: boolean;
  errors: string[];
}

export const planValidator = {
  validatePlan(plan: Plan, availablePeople: Person[]): PlanValidationResult {
    const errors: string[] = [];

    if (!plan || !plan.steps || plan.steps.length === 0) {
      return { valid: false, errors: ['Plan must contain at least one step.'] };
    }

    if (plan.steps.length > 20) {
      errors.push('Plan contains too many steps (maximum 20 steps per plan).');
    }

    const validPersonIds = new Set(availablePeople.map((p) => p.id));
    const stepIds = new Set<string>();

    // 1. Check basic step properties and person ID validity
    plan.steps.forEach((step, idx) => {
      if (!step.id) errors.push(`Step at index ${idx} is missing an ID.`);
      if (!step.title || !step.title.trim()) errors.push(`Step ${step.id || idx + 1} has an empty title.`);
      if (stepIds.has(step.id)) errors.push(`Duplicate step ID detected: ${step.id}`);
      stepIds.add(step.id);

      if (step.ownerPersonId && !validPersonIds.has(step.ownerPersonId)) {
        errors.push(`Step "${step.title}" references unknown person ID: ${step.ownerPersonId}`);
      }
    });

    // 2. Check dependency references
    plan.steps.forEach((step) => {
      if (step.dependencies) {
        step.dependencies.forEach((depId) => {
          if (!stepIds.has(depId)) {
            errors.push(`Step "${step.title}" depends on non-existent step ID: ${depId}`);
          }
          if (depId === step.id) {
            errors.push(`Step "${step.title}" cannot depend on itself.`);
          }
        });
      }
    });

    // 3. DFS Cycle Detection (Circular Dependency Protection)
    const hasCycle = this.detectCircularDependencies(plan.steps);
    if (hasCycle) {
      errors.push('Circular dependency detected in plan steps (e.g. Step A -> Step B -> Step A).');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  detectCircularDependencies(steps: PlanStep[]): boolean {
    const adjMap = new Map<string, string[]>();
    steps.forEach((s) => adjMap.set(s.id, s.dependencies || []));

    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (nodeId: string): boolean => {
      if (recStack.has(nodeId)) return true; // Cycle detected!
      if (visited.has(nodeId)) return false;

      visited.add(nodeId);
      recStack.add(nodeId);

      const neighbors = adjMap.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (dfs(neighbor)) return true;
      }

      recStack.delete(nodeId);
      return false;
    };

    for (const step of steps) {
      if (!visited.has(step.id)) {
        if (dfs(step.id)) return true;
      }
    }

    return false;
  },
};
