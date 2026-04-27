import { useState, useEffect } from "react";
import { useLoaderData } from "react-router";
import {
  Bot,
  Plus,
  Settings2,
  Trash2,
  Play,
  Pause,
  FileText,
  Cpu,
  ChevronRight,
  X,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent } from "~/components/ui/card";

export function meta() {
  return [{ title: "Agentes — GabiOS" }];
}

// ─── Types ────────────────────────────────────────────────
interface Agent {
  id: string;
  name: string;
  soulMd: string;
  modelProvider: string;
  modelId: string;
  temperature: number;
  maxTokens: number;
  status: "draft" | "active" | "paused";
  maxLoopIterations: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Loader ───────────────────────────────────────────────
export async function loader({ context }: { context: { cloudflare: { env: Env } } }) {
  const res = await context.cloudflare.env.DB.prepare(
    "SELECT * FROM agents WHERE deleted_at IS NULL ORDER BY created_at DESC"
  ).all();
  return { agents: (res.results || []) as Agent[] };
}

// ─── Constants ────────────────────────────────────────────
const MODEL_OPTIONS = [
  { provider: "workers-ai", id: "@cf/meta/llama-3.1-8b-instruct", label: "Llama 3.1 8B" },
  { provider: "workers-ai", id: "@cf/meta/llama-3.3-70b-instruct-fp8-fast", label: "Llama 3.3 70B" },
  { provider: "workers-ai", id: "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b", label: "DeepSeek R1 32B" },
  { provider: "workers-ai", id: "@cf/qwen/qwen2.5-coder-32b-instruct", label: "Qwen 2.5 Coder 32B" },
  { provider: "openai", id: "gpt-4o-mini", label: "GPT-4o Mini" },
  { provider: "openai", id: "gpt-4o", label: "GPT-4o" },
  { provider: "anthropic", id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
];

const STATUS_CONFIG = {
  draft: { label: "Rascunho", color: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  active: { label: "Ativo", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  paused: { label: "Pausado", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
};

// ─── Component ────────────────────────────────────────────
export default function AgentsPage() {
  const { agents: initialAgents } = useLoaderData<typeof loader>();
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setAgents(initialAgents); }, [initialAgents]);

  // ─── Create Agent ─────────────────────────────────
  const [newName, setNewName] = useState("");

  async function handleCreate() {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.ok) {
        const { data } = await res.json();
        setAgents((prev) => [data, ...prev]);
        setNewName("");
        setShowCreate(false);
        setSelectedAgent(data);
      }
    } finally {
      setLoading(false);
    }
  }

  // ─── Update Agent ─────────────────────────────────
  async function handleUpdate(id: string, patch: Partial<Agent>) {
    const res = await fetch(`/api/agents/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const { data } = await res.json();
      setAgents((prev) => prev.map((a) => (a.id === id ? data : a)));
      setSelectedAgent(data);
    }
  }

  // ─── Delete Agent ─────────────────────────────────
  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja remover este agente?")) return;
    const res = await fetch(`/api/agents/${id}`, { method: "DELETE" });
    if (res.ok) {
      setAgents((prev) => prev.filter((a) => a.id !== id));
      setSelectedAgent(null);
    }
  }

  return (
    <div className="h-full flex">
      {/* ─── Agent List ─────────────────────────────── */}
      <div className="w-80 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">Agentes</h2>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {showCreate && (
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Nome do agente..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-sm"
              />
              <Button size="sm" onClick={handleCreate} loading={loading} className="shrink-0">
                Criar
              </Button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {agents.map((agent) => {
            const isSelected = selectedAgent?.id === agent.id;
            const status = STATUS_CONFIG[agent.status] || STATUS_CONFIG.draft;

            return (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  isSelected
                    ? "bg-slate-800 border border-slate-700"
                    : "hover:bg-slate-800/50 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    agent.status === "active"
                      ? "bg-emerald-500/10 border border-emerald-500/20"
                      : "bg-slate-800 border border-slate-700"
                  }`}>
                    <Bot className={`w-4 h-4 ${
                      agent.status === "active" ? "text-emerald-400" : "text-slate-400"
                    }`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-200 truncate">{agent.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                  {isSelected && <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />}
                </div>
              </button>
            );
          })}

          {agents.length === 0 && (
            <div className="p-8 text-center">
              <Bot className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Nenhum agente criado ainda.</p>
              <p className="text-xs text-slate-600 mt-1">Clique em + para começar.</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Agent Detail ───────────────────────────── */}
      {selectedAgent ? (
        <AgentDetail
          agent={selectedAgent}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Settings2 className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Selecione um agente para configurar</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Agent Detail Panel ───────────────────────────────────
function AgentDetail({
  agent,
  onUpdate,
  onDelete,
}: {
  agent: Agent;
  onUpdate: (id: string, patch: Partial<Agent>) => void;
  onDelete: (id: string) => void;
}) {
  const [soulMd, setSoulMd] = useState(agent.soulMd);
  const [name, setName] = useState(agent.name);
  const [modelId, setModelId] = useState(agent.modelId);
  const [temperature, setTemperature] = useState(agent.temperature);
  const [isDirty, setIsDirty] = useState(false);

  // Sync when agent changes
  useEffect(() => {
    setSoulMd(agent.soulMd);
    setName(agent.name);
    setModelId(agent.modelId);
    setTemperature(agent.temperature);
    setIsDirty(false);
  }, [agent.id]);

  function markDirty() {
    setIsDirty(true);
  }

  function handleSave() {
    const model = MODEL_OPTIONS.find((m) => m.id === modelId);
    onUpdate(agent.id, {
      name,
      soulMd,
      modelId,
      modelProvider: model?.provider || "workers-ai",
      temperature,
    });
    setIsDirty(false);
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div className="h-14 px-6 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <Input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); markDirty(); }}
            className="bg-transparent border-none text-white font-semibold text-base p-0 h-auto focus:ring-0"
          />
        </div>
        <div className="flex items-center gap-2">
          {agent.status !== "active" ? (
            <Button
              size="sm"
              onClick={() => onUpdate(agent.id, { status: "active" })}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Play className="w-3 h-3 mr-1" /> Ativar
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdate(agent.id, { status: "paused" })}
              className="border-amber-500/30 text-amber-400"
            >
              <Pause className="w-3 h-3 mr-1" /> Pausar
            </Button>
          )}
          <button
            onClick={() => onDelete(agent.id)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-danger-400 hover:bg-danger-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Model Config */}
        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-white">Modelo</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Modelo LLM</label>
                <select
                  value={modelId}
                  onChange={(e) => { setModelId(e.target.value); markDirty(); }}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {MODEL_OPTIONS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label} ({m.provider})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  Temperatura: {temperature.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => { setTemperature(parseFloat(e.target.value)); markDirty(); }}
                  className="w-full accent-emerald-500 mt-1"
                />
                <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
                  <span>Preciso</span>
                  <span>Criativo</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SOUL.md Editor */}
        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-white">SOUL.md</h3>
              <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                System Prompt
              </span>
            </div>

            <textarea
              value={soulMd}
              onChange={(e) => { setSoulMd(e.target.value); markDirty(); }}
              placeholder="Defina a personalidade, regras e instruções do agente em Markdown..."
              rows={16}
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm font-mono leading-relaxed placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-y"
            />

            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-slate-500">
                {soulMd.length.toLocaleString()} caracteres
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Bar */}
      {isDirty && (
        <div className="h-14 px-6 flex items-center justify-end gap-3 border-t border-slate-800 bg-slate-950/80 backdrop-blur-sm shrink-0">
          <span className="text-xs text-amber-400 mr-auto">● Alterações não salvas</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSoulMd(agent.soulMd);
              setName(agent.name);
              setModelId(agent.modelId);
              setTemperature(agent.temperature);
              setIsDirty(false);
            }}
            className="border-slate-700 text-slate-400"
          >
            Descartar
          </Button>
          <Button size="sm" onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
            Salvar
          </Button>
        </div>
      )}
    </div>
  );
}
