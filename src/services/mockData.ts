import { World, Person, Task, ActivityLog, KnowledgeNote, UserStats } from '../types';

export const INITIAL_WORLDS: World[] = [];
export const INITIAL_PEOPLE: Person[] = [];
export const INITIAL_TASKS: Task[] = [];
export const INITIAL_ACTIVITIES: ActivityLog[] = [];
export const INITIAL_KNOWLEDGE: KnowledgeNote[] = [];

export const INITIAL_USER_STATS: UserStats = {
  totalWorlds: 0,
  totalPeople: 0,
  activeTasks: 0,
  completedTasks: 0,
};
