/**
 * Types for the Agent Runtime.
 */

export interface AgentConfig {
  agentId: string;
  conversationId: string;
  tenantDb: D1Database;

  // Agent personality
  name: string;
  soulMd: string;

  // Model settings
  modelId: string;
  modelProvider: string;
  temperature: number;
  maxTokens: number;
  maxLoopIterations: number;

  // Skills
  skills: Array<{
    name: string;
    instruction: string;
    priority: number;
  }>;
}

export interface AgentMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
}

export interface AgentResponse {
  text: string;
  conversationId: string;
  agentId: string;
  model: string;
  toolCalls: Array<{
    name: string;
    args: Record<string, unknown>;
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  durationMs: number;
}

export interface ContextResult {
  systemPrompt: string;
  history: AgentMessage[];
  facts: Array<{ category: string; key: string; value: string }>;
  ragChunks: string[];
}
