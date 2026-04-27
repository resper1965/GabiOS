import { useState, useRef, useEffect } from "react";
import { useLoaderData } from "react-router";
import {
  Send,
  Bot,
  User,
  Loader2,
  MessageSquare,
  Plus,
  Sparkles,
} from "lucide-react";
import { Button } from "~/components/ui/button";

export function meta() {
  return [{ title: "Chat — GabiOS" }];
}

// ─── Types ────────────────────────────────────────────────
interface Agent {
  id: string;
  name: string;
  status: string;
  modelId: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// ─── Loader ───────────────────────────────────────────────
export async function loader({ context }: { context: { cloudflare: { env: Env } } }) {
  const res = await context.cloudflare.env.DB.prepare(
    "SELECT id, name, status, model_id as modelId FROM agents WHERE deleted_at IS NULL AND status = 'active' ORDER BY name ASC"
  ).all();
  return { agents: (res.results || []) as Agent[] };
}

// ─── Component ────────────────────────────────────────────
export default function ChatPage() {
  const { agents } = useLoaderData<typeof loader>();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(agents[0] || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, [selectedAgent]);

  function startNewConversation() {
    setMessages([]);
    setConversationId(null);
    inputRef.current?.focus();
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim() || !selectedAgent || isStreaming) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          message: userMessage.content,
          conversationId: conversationId || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `❌ Erro: ${err.error || "Falha na comunicação"}`,
            timestamp: new Date(),
          },
        ]);
        return;
      }

      const { data } = await res.json();

      // Set conversation ID for follow-ups
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.response || data.text || "...",
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "❌ Erro de rede. Verifique sua conexão.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="h-full flex">
      {/* ─── Agent Selector Sidebar ──────────────── */}
      <div className="w-64 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-white mb-3">Agentes Ativos</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={startNewConversation}
            className="w-full border-slate-700 text-slate-300"
          >
            <Plus className="w-3 h-3 mr-1.5" /> Nova conversa
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => {
                setSelectedAgent(agent);
                startNewConversation();
              }}
              className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${
                selectedAgent?.id === agent.id
                  ? "bg-slate-800 border border-slate-700"
                  : "hover:bg-slate-800/50 border border-transparent"
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{agent.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{agent.modelId.split("/").pop()}</p>
              </div>
            </button>
          ))}

          {agents.length === 0 && (
            <div className="p-6 text-center">
              <Bot className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Nenhum agente ativo.</p>
              <p className="text-[10px] text-slate-600 mt-0.5">Ative um agente na página de Agentes.</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Chat Area ──────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        {selectedAgent && (
          <div className="h-14 px-6 flex items-center gap-3 border-b border-slate-800 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{selectedAgent.name}</p>
              <p className="text-[10px] text-slate-500">{selectedAgent.modelId.split("/").pop()}</p>
            </div>
            {conversationId && (
              <span className="ml-auto text-[10px] text-slate-600 font-mono">
                #{conversationId.substring(0, 8)}
              </span>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {selectedAgent
                    ? `Converse com ${selectedAgent.name}`
                    : "Selecione um agente"}
                </h3>
                <p className="text-sm text-slate-400">
                  {selectedAgent
                    ? "Envie uma mensagem para iniciar. O agente usará suas ferramentas e SOUL.md para responder."
                    : "Escolha um agente ativo na barra lateral para começar."}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4 text-emerald-400" />
                    </div>
                  )}

                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-emerald-600 text-white rounded-br-md"
                        : "bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <p
                      className={`text-[10px] mt-1.5 ${
                        msg.role === "user" ? "text-emerald-200/60" : "text-slate-500"
                      }`}
                    >
                      {msg.timestamp.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4 text-slate-400" />
                    </div>
                  )}
                </div>
              ))}

              {isStreaming && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Pensando...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        {selectedAgent && (
          <div className="p-4 border-t border-slate-800 shrink-0">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Mensagem para ${selectedAgent.name}...`}
                  rows={1}
                  disabled={isStreaming}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none disabled:opacity-50"
                />
              </div>
              <Button
                type="submit"
                disabled={!input.trim() || isStreaming}
                className="shrink-0 bg-emerald-600 hover:bg-emerald-700 h-auto px-4"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
            <p className="text-[10px] text-slate-600 mt-2 text-center">
              Enter para enviar · Shift+Enter para nova linha
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
