import { ToolDefinition, PersonCapabilities, WorldToolPolicy } from '../types/tool';

export const BUILTIN_TOOLS: ToolDefinition[] = [
  // Web
  {
    id: 'web_search',
    name: 'Web Search',
    description: 'Searches the web for recent information, documentation, and answers.',
    category: 'WEB',
    version: '1.0.0',
    riskLevel: 'LOW',
    capabilities: ['web_search'],
    enabled: true,
    timeoutSeconds: 15,
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query string' },
        maxResults: { type: 'integer', default: 5 },
      },
      required: ['query'],
    },
    outputSchema: { type: 'object' },
  },
  {
    id: 'web_fetch',
    name: 'Read Webpage',
    description: 'Fetches and extracts clean readable text and metadata from a public webpage.',
    category: 'WEB',
    version: '1.0.0',
    riskLevel: 'LOW',
    capabilities: ['web_fetch'],
    enabled: true,
    timeoutSeconds: 20,
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Full HTTP or HTTPS URL to fetch' },
      },
      required: ['url'],
    },
    outputSchema: { type: 'object' },
  },
  // Files
  {
    id: 'file_list',
    name: 'List Files',
    description: 'Lists files and subdirectories inside the World workspace.',
    category: 'FILES',
    version: '1.0.0',
    riskLevel: 'LOW',
    capabilities: ['file_read'],
    enabled: true,
    timeoutSeconds: 10,
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', default: '' },
      },
    },
    outputSchema: { type: 'object' },
  },
  {
    id: 'file_read',
    name: 'Read File',
    description: 'Reads content of a text file inside the World workspace.',
    category: 'FILES',
    version: '1.0.0',
    riskLevel: 'LOW',
    capabilities: ['file_read'],
    enabled: true,
    timeoutSeconds: 10,
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative path inside workspace' },
      },
      required: ['path'],
    },
    outputSchema: { type: 'object' },
  },
  {
    id: 'file_write',
    name: 'Create & Edit Files',
    description: 'Creates or updates a file inside the World workspace.',
    category: 'FILES',
    version: '1.0.0',
    riskLevel: 'MEDIUM',
    capabilities: ['file_write'],
    enabled: true,
    timeoutSeconds: 10,
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative path inside workspace' },
        content: { type: 'string', description: 'Text content to write' },
      },
      required: ['path', 'content'],
    },
    outputSchema: { type: 'object' },
  },
  {
    id: 'file_create_directory',
    name: 'Create Folder',
    description: 'Creates a folder inside the World workspace.',
    category: 'FILES',
    version: '1.0.0',
    riskLevel: 'LOW',
    capabilities: ['file_write'],
    enabled: true,
    timeoutSeconds: 10,
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Folder path to create' },
      },
      required: ['path'],
    },
    outputSchema: { type: 'object' },
  },
  {
    id: 'file_search',
    name: 'Search Files',
    description: 'Searches for keywords across files in the World workspace.',
    category: 'FILES',
    version: '1.0.0',
    riskLevel: 'LOW',
    capabilities: ['file_read'],
    enabled: true,
    timeoutSeconds: 15,
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        path: { type: 'string', default: '' },
      },
      required: ['query'],
    },
    outputSchema: { type: 'object' },
  },
  // Code
  {
    id: 'code_execute',
    name: 'Run Code',
    description: 'Executes Python or JavaScript code safely inside the World sandbox.',
    category: 'CODE',
    version: '1.0.0',
    riskLevel: 'HIGH',
    capabilities: ['code_execute'],
    enabled: true,
    timeoutSeconds: 30,
    inputSchema: {
      type: 'object',
      properties: {
        language: { type: 'string', enum: ['python', 'javascript'] },
        code: { type: 'string' },
      },
      required: ['language', 'code'],
    },
    outputSchema: { type: 'object' },
  },
  {
    id: 'code_test',
    name: 'Run Tests',
    description: 'Runs test assertions or test suite commands inside the World workspace.',
    category: 'CODE',
    version: '1.0.0',
    riskLevel: 'HIGH',
    capabilities: ['code_test'],
    enabled: true,
    timeoutSeconds: 30,
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string' },
        testFile: { type: 'string' },
      },
      required: ['command'],
    },
    outputSchema: { type: 'object' },
  },
  // HTTP
  {
    id: 'http_request',
    name: 'Connect to Web Service / API',
    description: 'Connects to public external APIs and web services.',
    category: 'HTTP',
    version: '1.0.0',
    riskLevel: 'MEDIUM',
    capabilities: ['http_request'],
    enabled: true,
    timeoutSeconds: 15,
    inputSchema: {
      type: 'object',
      properties: {
        method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], default: 'GET' },
        url: { type: 'string' },
        headers: { type: 'object' },
        body: { type: 'object' },
      },
      required: ['url'],
    },
    outputSchema: { type: 'object' },
  },
  // World
  {
    id: 'world_read',
    name: 'Inspect World Goals & People',
    description: 'Retrieves information about current goals, active tasks, and team members.',
    category: 'WORLD',
    version: '1.0.0',
    riskLevel: 'LOW',
    capabilities: ['world_read'],
    enabled: true,
    timeoutSeconds: 5,
    inputSchema: {
      type: 'object',
      properties: {
        entityType: { type: 'string', enum: ['summary', 'people', 'goals', 'tasks', 'knowledge'] },
      },
      required: ['entityType'],
    },
    outputSchema: { type: 'object' },
  },
  {
    id: 'world_update',
    name: 'Update World & Task State',
    description: 'Updates a permitted task status, goal milestone, or world description.',
    category: 'WORLD',
    version: '1.0.0',
    riskLevel: 'MEDIUM',
    capabilities: ['world_update'],
    enabled: true,
    timeoutSeconds: 10,
    inputSchema: {
      type: 'object',
      properties: {
        entityType: { type: 'string', enum: ['task', 'goal', 'description'] },
        entityId: { type: 'string' },
        updates: { type: 'object' },
      },
      required: ['entityType', 'updates'],
    },
    outputSchema: { type: 'object' },
  },
  // Git
  {
    id: 'git_status',
    name: 'Inspect Git Status',
    description: 'Inspects project repository branch and uncommitted modifications.',
    category: 'GIT',
    version: '1.0.0',
    riskLevel: 'LOW',
    capabilities: ['git_read'],
    enabled: true,
    timeoutSeconds: 10,
    inputSchema: { type: 'object', properties: {} },
    outputSchema: { type: 'object' },
  },
  // Utility
  {
    id: 'calculator',
    name: 'Calculator',
    description: 'Evaluates arithmetic and math expressions safely.',
    category: 'UTILITY',
    version: '1.0.0',
    riskLevel: 'LOW',
    capabilities: [],
    enabled: true,
    timeoutSeconds: 5,
    inputSchema: {
      type: 'object',
      properties: {
        expression: { type: 'string' },
      },
      required: ['expression'],
    },
    outputSchema: { type: 'object' },
  },
  {
    id: 'date_time',
    name: 'Date and Time',
    description: 'Gets current UTC timestamp and localized date/time.',
    category: 'UTILITY',
    version: '1.0.0',
    riskLevel: 'LOW',
    capabilities: [],
    enabled: true,
    timeoutSeconds: 5,
    inputSchema: { type: 'object', properties: {} },
    outputSchema: { type: 'object' },
  },
];

export const clientToolRegistry = {
  listTools(): ToolDefinition[] {
    return BUILTIN_TOOLS;
  },

  getTool(id: string): ToolDefinition | undefined {
    return BUILTIN_TOOLS.find((t) => t.id === id);
  },

  filterForPerson(
    capabilities?: PersonCapabilities | null,
    policy?: WorldToolPolicy | null,
  ): ToolDefinition[] {
    return BUILTIN_TOOLS.filter((tool) => {
      if (!tool.enabled) return false;

      // Policy filter
      if (policy) {
        if (tool.category === 'WEB' && !policy.webToolsEnabled) return false;
        if (tool.category === 'FILES' && !policy.fileToolsEnabled) return false;
        if (tool.category === 'CODE' && !policy.codeExecutionEnabled) return false;
        if (tool.category === 'HTTP' && !policy.httpToolsEnabled) return false;
        if (tool.category === 'GIT' && !policy.gitToolsEnabled) return false;
      }

      // Capability filter
      if (capabilities) {
        if (tool.id === 'web_search' && !capabilities.webSearch) return false;
        if (tool.id === 'web_fetch' && !capabilities.webFetch) return false;
        if (['file_list', 'file_read', 'file_search'].includes(tool.id) && !capabilities.fileRead) return false;
        if (['file_write', 'file_create_directory'].includes(tool.id) && !capabilities.fileWrite) return false;
        if (tool.id === 'code_execute' && !capabilities.codeExecute) return false;
        if (tool.id === 'code_test' && !capabilities.codeTest) return false;
        if (tool.id === 'http_request' && !capabilities.httpRequest) return false;
        if (tool.id === 'world_read' && !capabilities.worldRead) return false;
        if (tool.id === 'world_update' && !capabilities.worldUpdate) return false;
        if (tool.category === 'GIT' && !capabilities.gitRead) return false;
      }

      return true;
    });
  },
};
