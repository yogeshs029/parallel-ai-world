import { Person, CreatePersonInput, UpdatePersonInput } from '../types';
import { INITIAL_PEOPLE } from './mockData';
import { worldService } from './worldService';

const STORAGE_KEY = 'parallel_ai_people_v2';

function getStoredPeople(): Person[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure default initial people exist
        const merged = [...parsed];
        for (const initP of INITIAL_PEOPLE) {
          if (!merged.some((p) => p.id === initP.id)) {
            merged.push(initP);
          }
        }
        return merged;
      }
    }
  } catch (e) {
    console.warn('Could not read people from localStorage:', e);
  }
  return [...INITIAL_PEOPLE];
}

function saveStoredPeople(people: Person[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(people));
  } catch (e) {
    console.warn('Could not save people to localStorage:', e);
  }
}

let peopleStore: Person[] = getStoredPeople();

const delay = (ms = 30) => new Promise((resolve) => setTimeout(resolve, ms));

export const peopleService = {
  async getPeople(worldId: string): Promise<Person[]> {
    await delay(30);
    return peopleStore.filter((p) => p.worldId === worldId);
  },

  async getAllPeople(): Promise<Person[]> {
    await delay(30);
    return [...peopleStore];
  },

  async getPerson(worldId: string, personId: string): Promise<Person | null> {
    await delay(30);
    const found = peopleStore.find((p) => p.id === personId && p.worldId === worldId);
    return found ? { ...found } : null;
  },

  async getPersonById(personId: string): Promise<Person | null> {
    await delay(30);
    const found = peopleStore.find((p) => p.id === personId);
    return found ? { ...found } : null;
  },

  async createPerson(worldId: string, data: CreatePersonInput): Promise<Person> {
    await delay(60);
    const parentWorld = await worldService.getWorldById(worldId);
    const worldName = parentWorld?.name || 'World';

    const id = `person-${data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.floor(100 + Math.random() * 900)}`;

    const avatar = {
      emoji: data.avatar?.emoji || '👤',
      gradientBg: data.avatar?.gradientBg || 'from-purple-600 to-indigo-700',
      initials:
        data.avatar?.initials ||
        data.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2) ||
        'P',
    };

    const personality = {
      traits: data.personality?.traits || ['Friendly', 'Helpful'],
      description:
        data.personality?.description ||
        `${data.name} is a dedicated ${data.role} who communicates clearly and helps achieve world goals.`,
      communicationStyle: data.personality?.communicationStyle || ['Friendly', 'Professional'],
    };

    const newPerson: Person = {
      id,
      worldId,
      worldName,
      name: data.name.trim(),
      role: data.role.trim(),
      description:
        data.description?.trim() ||
        `${data.name} helps with ${data.role} responsibilities in ${worldName}.`,
      avatar,
      avatarEmoji: avatar.emoji,
      avatarBg: avatar.gradientBg,
      personality,
      responsibilities: data.responsibilities || [],
      skills: data.skills || [],
      interests: data.interests || [],
      goals: data.goals || [],
      status: data.status || 'available',
      currentActivity: `Active in ${worldName}`,
      tasksAssignedCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    peopleStore = [newPerson, ...peopleStore];
    saveStoredPeople(peopleStore);

    // Sync member count on parent world
    if (parentWorld) {
      const worldMembers = peopleStore.filter((p) => p.worldId === worldId);
      await worldService.updateWorld(worldId, {
        // updates world state
      });
      parentWorld.memberCount = worldMembers.length;
      parentWorld.peopleCount = worldMembers.length;
    }

    return { ...newPerson };
  },

  async updatePerson(
    worldId: string,
    personId: string,
    data: UpdatePersonInput,
  ): Promise<Person | null> {
    await delay(50);
    const index = peopleStore.findIndex((p) => p.id === personId && p.worldId === worldId);
    if (index === -1) return null;

    const current = peopleStore[index];

    const updatedAvatar = {
      ...current.avatar,
      ...(data.avatar || {}),
    };

    const updatedPersonality = {
      ...current.personality,
      ...(data.personality || {}),
    };

    const updatedPerson: Person = {
      ...current,
      name: data.name ? data.name.trim() : current.name,
      role: data.role ? data.role.trim() : current.role,
      description: data.description !== undefined ? data.description.trim() : current.description,
      avatar: updatedAvatar,
      avatarEmoji: updatedAvatar.emoji || current.avatarEmoji,
      avatarBg: updatedAvatar.gradientBg || current.avatarBg,
      personality: updatedPersonality,
      responsibilities: data.responsibilities || current.responsibilities,
      skills: data.skills || current.skills,
      interests: data.interests || current.interests,
      goals: data.goals || current.goals,
      status: data.status || current.status,
      updatedAt: new Date().toISOString(),
    };

    peopleStore[index] = updatedPerson;
    saveStoredPeople(peopleStore);
    return { ...updatedPerson };
  },

  async deletePerson(worldId: string, personId: string): Promise<boolean> {
    await delay(50);
    const initialLen = peopleStore.length;
    peopleStore = peopleStore.filter((p) => !(p.id === personId && p.worldId === worldId));
    saveStoredPeople(peopleStore);

    // Sync member count on parent world
    const parentWorld = await worldService.getWorldById(worldId);
    if (parentWorld) {
      const worldMembers = peopleStore.filter((p) => p.worldId === worldId);
      parentWorld.memberCount = worldMembers.length;
      parentWorld.peopleCount = worldMembers.length;
    }

    return peopleStore.length < initialLen;
  },

  async duplicatePerson(worldId: string, personId: string): Promise<Person | null> {
    await delay(60);
    const original = await this.getPerson(worldId, personId);
    if (!original) return null;

    const copyData: CreatePersonInput = {
      name: `${original.name} (Copy)`,
      role: original.role,
      description: original.description,
      avatar: { ...original.avatar },
      personality: {
        traits: [...original.personality.traits],
        description: original.personality.description,
        communicationStyle: [...original.personality.communicationStyle],
      },
      responsibilities: [...original.responsibilities],
      skills: [...original.skills],
      interests: [...original.interests],
      goals: [...original.goals],
      status: 'available',
    };

    return this.createPerson(worldId, copyData);
  },

  async searchPeople(worldId: string, query: string): Promise<Person[]> {
    await delay(20);
    const q = query.toLowerCase().trim();
    const worldPeople = peopleStore.filter((p) => p.worldId === worldId);
    if (!q) return worldPeople;

    return worldPeople.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.skills.some((s) => s.toLowerCase().includes(q)) ||
        p.responsibilities.some((r) => r.toLowerCase().includes(q)),
    );
  },
};

// Backward compatibility alias
export const personService = {
  ...peopleService,
  getPeopleByWorldId: (worldId: string) => peopleService.getPeople(worldId),
};
export const agentService = personService;
