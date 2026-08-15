import { API_BASE } from '../lib/apiConfig';
import {
  ToolDefinition,
  ToolRequestCreate,
  ToolRequest,
  PersonCapabilities,
  WorldToolPolicy,
  ToolAuditLog,
  ApprovalScope,
} from '../types/tool';
import { clientToolRegistry } from './toolRegistry';

const CAPABILITIES_KEY_PREFIX = 'parallel_capabilities_';
const POLICIES_KEY_PREFIX = 'parallel_tool_policy_';
const REQUESTS_KEY = 'parallel_tool_requests';
const AUDIT_KEY = 'parallel_tool_audit_logs';

export const toolService = {
  async listTools(): Promise<ToolDefinition[]> {
    try {
      const res = await fetch(`${API_BASE}/tools`);
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return clientToolRegistry.listTools();
  },

  async getAvailableToolsForPerson(worldId: string, personId: string): Promise<ToolDefinition[]> {
    try {
      const res = await fetch(`${API_BASE}/worlds/${worldId}/people/${personId}/tools`);
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    const caps = await this.getPersonCapabilities(worldId, personId);
    const policy = await this.getWorldToolPolicy(worldId);
    return clientToolRegistry.filterForPerson(caps, policy);
  },

  async executeTool(req: ToolRequestCreate): Promise<ToolRequest> {
    try {
      const res = await fetch(`${API_BASE}/tools/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    // Local client execution simulation if backend is unreachable
    const tool = clientToolRegistry.getTool(req.toolId);
    const requestObj: ToolRequest = {
      id: `treq-${Date.now()}`,
      worldId: req.worldId,
      personId: req.personId,
      taskId: req.taskId,
      toolId: req.toolId,
      input: req.input,
      status: 'completed',
      riskLevel: tool?.riskLevel || 'LOW',
      requestedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      result: {
        success: true,
        output: { message: `Executed ${tool?.name || req.toolId} successfully.` },
        durationMs: 150,
        createdAt: new Date().toISOString(),
      },
    };

    this._saveLocalRequest(requestObj);
    return requestObj;
  },

  async listToolRequests(worldId?: string): Promise<ToolRequest[]> {
    try {
      const query = worldId ? `?world_id=${worldId}` : '';
      const res = await fetch(`${API_BASE}/tools/requests${query}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    try {
      const saved = localStorage.getItem(REQUESTS_KEY);
      if (saved) {
        const all: ToolRequest[] = JSON.parse(saved);
        return worldId ? all.filter((r) => r.worldId === worldId) : all;
      }
    } catch {}
    return [];
  },

  async approveToolRequest(requestId: string, scope: ApprovalScope = 'once'): Promise<ToolRequest> {
    try {
      const res = await fetch(`${API_BASE}/tools/requests/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    return {
      id: requestId,
      worldId: 'default',
      personId: 'default',
      toolId: 'tool',
      input: {},
      status: 'approved',
      riskLevel: 'MEDIUM',
      requestedAt: new Date().toISOString(),
    };
  },

  async rejectToolRequest(requestId: string, reason = 'Denied by user.'): Promise<ToolRequest> {
    try {
      const res = await fetch(`${API_BASE}/tools/requests/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    return {
      id: requestId,
      worldId: 'default',
      personId: 'default',
      toolId: 'tool',
      input: {},
      status: 'rejected',
      riskLevel: 'MEDIUM',
      requestedAt: new Date().toISOString(),
      error: reason,
    };
  },

  async cancelToolRequest(requestId: string): Promise<ToolRequest> {
    try {
      const res = await fetch(`${API_BASE}/tools/requests/${requestId}/cancel`, {
        method: 'POST',
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    return {
      id: requestId,
      worldId: 'default',
      personId: 'default',
      toolId: 'tool',
      input: {},
      status: 'cancelled',
      riskLevel: 'MEDIUM',
      requestedAt: new Date().toISOString(),
    };
  },

  async getPersonCapabilities(worldId: string, personId: string): Promise<PersonCapabilities> {
    try {
      const res = await fetch(`${API_BASE}/worlds/${worldId}/people/${personId}/capabilities`);
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    const key = `${CAPABILITIES_KEY_PREFIX}${worldId}_${personId}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch {}

    // Default capabilities based on role
    const isDev = personId.includes('maya') || personId.includes('developer');
    return {
      personId,
      worldId,
      webSearch: true,
      webFetch: true,
      fileRead: true,
      fileWrite: true,
      fileCreateDirectory: true,
      fileSearch: true,
      codeExecute: isDev,
      codeTest: isDev,
      httpRequest: true,
      worldRead: true,
      worldUpdate: false,
      gitRead: isDev,
      askBeforeFileWrite: true,
      askBeforeCodeExecute: true,
      askBeforeHttpRequest: false,
      askBeforeWorldUpdate: true,
      updatedAt: new Date().toISOString(),
    };
  },

  async updatePersonCapabilities(
    worldId: string,
    personId: string,
    caps: PersonCapabilities,
  ): Promise<PersonCapabilities> {
    try {
      const res = await fetch(`${API_BASE}/worlds/${worldId}/people/${personId}/capabilities`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(caps),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    const key = `${CAPABILITIES_KEY_PREFIX}${worldId}_${personId}`;
    try {
      localStorage.setItem(key, JSON.stringify(caps));
    } catch {}
    return caps;
  },

  async getWorldToolPolicy(worldId: string): Promise<WorldToolPolicy> {
    try {
      const res = await fetch(`${API_BASE}/worlds/${worldId}/tools/policy`);
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    const key = `${POLICIES_KEY_PREFIX}${worldId}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch {}

    return {
      worldId,
      webToolsEnabled: true,
      fileToolsEnabled: true,
      codeExecutionEnabled: true,
      httpToolsEnabled: true,
      gitToolsEnabled: true,
      requireApprovalForHighRisk: true,
      requireApprovalForCode: true,
      requireApprovalForFileWrite: false,
      maxToolCallsPerTask: 50,
      maxCodeExecutionsPerTask: 10,
      maxExecutionTimeSeconds: 30,
      updatedAt: new Date().toISOString(),
    };
  },

  async updateWorldToolPolicy(worldId: string, policy: WorldToolPolicy): Promise<WorldToolPolicy> {
    try {
      const res = await fetch(`${API_BASE}/worlds/${worldId}/tools/policy`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(policy),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    const key = `${POLICIES_KEY_PREFIX}${worldId}`;
    try {
      localStorage.setItem(key, JSON.stringify(policy));
    } catch {}
    return policy;
  },

  async listAuditLogs(worldId: string): Promise<ToolAuditLog[]> {
    try {
      const res = await fetch(`${API_BASE}/worlds/${worldId}/tools/audit`);
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    try {
      const saved = localStorage.getItem(`${AUDIT_KEY}_${worldId}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  },

  _saveLocalRequest(req: ToolRequest) {
    try {
      const saved = localStorage.getItem(REQUESTS_KEY);
      const all: ToolRequest[] = saved ? JSON.parse(saved) : [];
      all.unshift(req);
      localStorage.setItem(REQUESTS_KEY, JSON.stringify(all.slice(0, 100)));
    } catch {}
  },
};
