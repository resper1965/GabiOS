import { createWorkersAI } from "workers-ai-provider";
import { generateText } from "ai";
import { z } from "zod";
import { buildContext } from "./context-builder";
import { postProcess } from "./post-processor";
import { getAgentTools } from "./tools";
import type { AgentConfig, AgentMessage, AgentResponse } from "./types";

/**
 * Agent Loop — the core runtime of GabiOS.
 *
 * Flow:
 *   1. Context Builder assembles system prompt + memory + RAG
 *   2. LLM Call with tools
 *   3. If tool calls → execute → loop back to LLM
 *   4. Final response → Post-Processor (save, extract facts, compact)
 *
 * The loop runs inside `generateText` which handles tool call iterations
 * automatically via the AI SDK's `maxSteps` parameter.
 */
export async function runAgentLoop(
  config: AgentConfig,
  userMessage: string,
  env: Env,
  ctx: ExecutionContext
): Promise<AgentResponse> {
  const startTime = Date.now();

  // 1. Build context (system prompt + memory + RAG)
  const context = await buildContext(config, env);

  // 2. Assemble messages
  const messages: AgentMessage[] = [
    { role: "system", content: context.systemPrompt },
    ...context.history,
    { role: "user", content: userMessage },
  ];

  // 3. Create Workers AI provider
  const workersai = createWorkersAI({ binding: env.AI });

  // 4. Run the agent loop via AI SDK
  const tools = getAgentTools(config, env);

  const result = await generateText({
    model: workersai(config.modelId),
    messages,
    tools,
    maxSteps: config.maxLoopIterations,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
  });

  const response: AgentResponse = {
    text: result.text,
    conversationId: config.conversationId,
    agentId: config.agentId,
    model: config.modelId,
    toolCalls: result.steps.flatMap((step) =>
      (step.toolCalls || []).map((tc) => ({
        name: tc.toolName,
        args: tc.args,
      }))
    ),
    usage: {
      promptTokens: result.usage?.promptTokens || 0,
      completionTokens: result.usage?.completionTokens || 0,
      totalTokens: result.usage?.totalTokens || 0,
    },
    durationMs: Date.now() - startTime,
  };

  // 5. Post-process (save messages, extract facts, check compaction)
  // Use waitUntil to avoid blocking the response
  ctx.waitUntil(postProcess(config, userMessage, response, env));

  return response;
}
