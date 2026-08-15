export type ToolCategory =
  | 'WEB'
  | 'FILES'
  | 'CODE'
  | 'HTTP'
  | 'GIT'
  | 'KNOWLEDGE'
  | 'WORLD'
  | 'COMMUNICATION'
  | 'UTILITY'
  | 'EMAIL'
  | 'CALENDAR'
  | 'GITHUB'
  | 'DATABASE'
  | 'BROWSER_AUTOMATION'
  | 'MEDIA'
  | 'FINANCE';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ToolRequestStatus =
  | 'requested'
  | 'approved'
  | 'rejected'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout';

export type ApprovalScope = 'once' | 'task' | 'person' | 'world';

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  version: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  riskLevel: RiskLevel;
  capabilities: string[];
  enabled: boolean;
  timeoutSeconds: number;
}

export interface ToolResult {
  success: boolean;
  output?: unknown;
  error?: string | null;
  metadata?: Record<string, unknown>;
  durationMs: number;
  createdAt: string;
}

export interface ToolRequestCreate {
  worldId: string;
  personId: string;
  taskId?: string | null;
  toolId: string;
  input: Record<string, unknown>;
}

export interface ToolRequest {
  id: string;
  worldId: string;
  personId: string;
  taskId?: string | null;
  toolId: string;
  input: Record<string, unknown>;
  status: ToolRequestStatus;
  riskLevel: RiskLevel;
  requestedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  result?: ToolResult | null;
  error?: string | null;
  approvalRequestId?: string | null;
  approvalScope?: ApprovalScope | null;
}

export interface PersonCapabilities {
  personId: string;
  worldId: string;
  webSearch: boolean;
  webFetch: boolean;
  fileRead: boolean;
  fileWrite: boolean;
  fileCreateDirectory: boolean;
  fileSearch: boolean;
  codeExecute: boolean;
  codeTest: boolean;
  httpRequest: boolean;
  worldRead: boolean;
  worldUpdate: boolean;
  gitRead: boolean;
  // Approval triggers ("Ask before using")
  askBeforeFileWrite: boolean;
  askBeforeCodeExecute: boolean;
  askBeforeHttpRequest: boolean;
  askBeforeWorldUpdate: boolean;
  updatedAt: string;
}

export interface WorldToolPolicy {
  worldId: string;
  webToolsEnabled: boolean;
  fileToolsEnabled: boolean;
  codeExecutionEnabled: boolean;
  httpToolsEnabled: boolean;
  gitToolsEnabled: boolean;
  requireApprovalForHighRisk: boolean;
  requireApprovalForCode: boolean;
  requireApprovalForFileWrite: boolean;
  maxToolCallsPerTask: number;
  maxCodeExecutionsPerTask: number;
  maxExecutionTimeSeconds: number;
  updatedAt: string;
}

export interface ToolAuditLog {
  id: string;
  worldId: string;
  personId: string;
  taskId?: string | null;
  toolId: string;
  inputSummary: string;
  status: ToolRequestStatus;
  riskLevel: RiskLevel;
  approvalStatus?: string | null;
  durationMs: number;
  error?: string | null;
  timestamp: string;
}
