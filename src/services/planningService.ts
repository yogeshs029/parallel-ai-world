import { Goal, GoalPriority, GoalType } from '../types/goal';
import { Plan, PlanStep } from '../types/plan';
import { World, Person } from '../types';
import { goalService, saveStoredPlan } from './goalService';
import { planValidator } from './planValidator';
import { taskService } from './taskService';
import { API_BASE } from '../lib/apiConfig';

export interface NaturalGoalExtraction {
  title: string;
  description: string;
  ownerPersonId?: string;
  ownerPersonName?: string;
  priority: GoalPriority;
  type: GoalType;
  targetDate?: string;
}

export const planningService = {
  async parseNaturalGoal(text: string, availablePeople: Person[]): Promise<NaturalGoalExtraction> {
    const defaultOwner = availablePeople[0];

    try {
      const res = await fetch(`${API_BASE}/goals/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text }),
      });
      if (res.ok) {
        const data = await res.json();
        return {
          title: data.title || text.slice(0, 50),
          description: data.description || text,
          ownerPersonId: data.ownerPersonId || defaultOwner?.id,
          priority: data.priority || 'high',
          type: data.type || 'Project',
          targetDate: data.targetDate,
        };
      }
    } catch (e) {
      console.warn('Backend goal extraction offline, fallback extraction:', e);
    }

    // Heuristic extraction
    let matchedOwner = defaultOwner;
    availablePeople.forEach((p) => {
      if (text.toLowerCase().includes(p.name.toLowerCase())) {
        matchedOwner = p;
      }
    });

    return {
      title: text.length > 50 ? `${text.slice(0, 47)}...` : text,
      description: text,
      ownerPersonId: matchedOwner?.id,
      ownerPersonName: matchedOwner?.name,
      priority: 'high',
      type: 'Project',
    };
  },

  async generatePlanProposal(
    world: World,
    goal: Goal,
    availablePeople: Person[],
  ): Promise<Plan> {
    const planId = `plan-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const ownerPerson = availablePeople.find((p) => p.id === goal.ownerPersonId) || availablePeople[0];

    let rawSteps: Partial<PlanStep>[] = [];

    try {
      const res = await fetch(`${API_BASE}/goals/${goal.id}/plan/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ world, goal, availablePeople }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.steps) && data.steps.length > 0) {
          rawSteps = data.steps;
        }
      }
    } catch (e) {
      console.warn('Backend plan generator offline, generating structured plan locally:', e);
    }

    // Fallback structured plan steps tailored to goal type
    if (rawSteps.length === 0) {
      const step1Id = `step-1-${Date.now()}`;
      const step2Id = `step-2-${Date.now()}`;
      const step3Id = `step-3-${Date.now()}`;
      const step4Id = `step-4-${Date.now()}`;

      const secondaryPerson = availablePeople.find((p) => p.id !== ownerPerson?.id) || ownerPerson;

      rawSteps = [
        {
          id: step1Id,
          title: `Audit requirements for ${goal.title}`,
          description: `Gather details and review objectives for ${goal.title}.`,
          ownerPersonId: ownerPerson?.id || 'unassigned',
          dependencies: [],
          order: 1,
        },
        {
          id: step2Id,
          title: `Review domain specifications`,
          description: `Align technical and operational specifications.`,
          ownerPersonId: secondaryPerson?.id || ownerPerson?.id || 'unassigned',
          dependencies: [step1Id],
          order: 2,
        },
        {
          id: step3Id,
          title: `Execute implementation`,
          description: `Perform primary implementation tasks for ${goal.title}.`,
          ownerPersonId: ownerPerson?.id || 'unassigned',
          dependencies: [step2Id],
          order: 3,
        },
        {
          id: step4Id,
          title: `Final review and verification`,
          description: `Verify quality and confirm ${goal.title} meets requirements.`,
          ownerPersonId: ownerPerson?.id || 'unassigned',
          dependencies: [step3Id],
          order: 4,
        },
      ];
    }

    const compiledSteps: PlanStep[] = rawSteps.map((s, idx) => {
      const stepOwner = availablePeople.find((p) => p.id === s.ownerPersonId) || ownerPerson;
      return {
        id: s.id || `step-${idx + 1}-${Date.now()}`,
        planId,
        goalId: goal.id,
        title: s.title || `Plan Step ${idx + 1}`,
        description: s.description || '',
        ownerPersonId: stepOwner?.id || 'unassigned',
        ownerPersonName: stepOwner?.name,
        ownerPersonEmoji: stepOwner?.avatar?.emoji || stepOwner?.avatarEmoji || '👤',
        status: idx === 0 ? 'ready' : 'pending',
        priority: goal.priority || 'high',
        dependencies: s.dependencies || [],
        order: s.order || idx + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    const proposedPlan: Plan = {
      id: planId,
      goalId: goal.id,
      title: `Plan: ${goal.title}`,
      description: `Structured operational plan for ${goal.title}`,
      status: 'draft',
      version: 1,
      steps: compiledSteps,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Server-side validation check (DFS cycle detection)
    const validation = planValidator.validatePlan(proposedPlan, availablePeople);
    if (!validation.valid) {
      throw new Error(`Plan Validation Failed: ${validation.errors.join('; ')}`);
    }

    return proposedPlan;
  },

  async approveAndActivatePlan(worldId: string, goalId: string, plan: Plan): Promise<Plan> {
    const activePlan: Plan = {
      ...plan,
      status: 'active',
      updatedAt: new Date().toISOString(),
    };

    saveStoredPlan(goalId, activePlan);

    // Instantiate Module 6 Tasks for plan steps
    for (const step of activePlan.steps) {
      try {
        const task = await taskService.createTask({
          worldId,
          title: `[Goal Step] ${step.title}`,
          description: step.description,
          priority: step.priority === 'critical' || step.priority === 'high' ? 'high' : 'medium',
          assignedPersonId: step.ownerPersonId,
          assignedPersonName: step.ownerPersonName,
          assignedPersonEmoji: step.ownerPersonEmoji,
        });
        step.taskId = task.id;
      } catch (e) {
        console.warn('Error linking Module 6 task:', e);
      }
    }

    saveStoredPlan(goalId, activePlan);
    await goalService.updateGoal(worldId, goalId, {
      status: 'active',
      activePlanId: activePlan.id,
    });

    return activePlan;
  },
};
