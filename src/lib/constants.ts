export const APP_CONFIG = {
  name: 'Parallel AI World',
  shortName: 'Parallel',
  version: '0.1.0-alpha',
  tagline: 'Your world. Your agents. Your intelligence.',
  description: 'The foundation operating system for persistent autonomous AI agent worlds.',
  author: 'Parallel AI Labs',
  supportLinks: {
    docs: 'https://docs.parallel-ai.local',
    github: 'https://github.com/parallel-ai/parallel-world',
    discord: 'https://discord.gg/parallel-ai',
  },
} as const;

export const WORLD_STATUSES = {
  ACTIVE: 'active',
  INITIALIZING: 'initializing',
  STANDBY: 'standby',
  DORMANT: 'dormant',
  ERROR: 'error',
} as const;

export const AGENT_ROLES = {
  ORCHESTRATOR: 'Orchestrator',
  RESEARCHER: 'Researcher',
  CODER: 'Coder',
  SYNTHESIZER: 'Synthesizer',
  SENTINEL: 'Sentinel',
  ARCHITECT: 'Architect',
} as const;
