import { useState } from "react";
import { Bot, Plus, Search, MoreVertical, Pencil, Trash2, Power } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent } from "~/components/ui/card";

export function meta() {
  return [{ title: "Agentes — GabiOS" }];
}

// Placeholder — replace with real API calls
const mockAgents = [
  {
    id: "1",
    name: "Atendimento Geral",
    modelId: "@cf/meta/llama-3.1-8b-instruct",
    status: "active" as const,
    messageCount: 0,
    createdAt: new Date().toISOString(),
  },
];

const statusColors = {
  active: "bg-success-500",
  paused: "bg-warning-500",
  draft: "bg-surface-400",
};

const statusLabels = {
  active: "Ativo",
  paused: "Pausado",
  draft: "Rascunho",
};

export default function AgentsPage() {
  const [search, setSearch] = useState("");
  const [agents] = useState(mockAgents);

  const filtered = agents.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-surface-900">Agentes</h2>
          <p className="text-surface-500 text-sm mt-1">
            Gerencie seus agentes de IA
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4" />
          Novo agente
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <Input
            placeholder="Buscar agentes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Agent list */}
      {filtered.length === 0 ? (
        <Card variant="bordered" className="border-dashed">
          <CardContent>
            <div className="text-center py-12">
              <Bot className="w-16 h-16 text-surface-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-surface-700 mb-2">
                Nenhum agente encontrado
              </h3>
              <p className="text-surface-500 mb-6">
                {search
                  ? "Nenhum agente corresponde à sua busca."
                  : "Crie seu primeiro agente para começar."}
              </p>
              {!search && (
                <Button>
                  <Plus className="w-4 h-4" />
                  Criar primeiro agente
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((agent) => (
            <Card key={agent.id} variant="elevated" className="hover:shadow-lg transition-shadow">
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
                      <Bot className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-surface-900">{agent.name}</h3>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${statusColors[agent.status]}`} />
                          <span className="text-xs text-surface-500">
                            {statusLabels[agent.status]}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-surface-500 mt-0.5">
                        {agent.modelId} · {agent.messageCount} mensagens
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Power className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-danger-500 hover:text-danger-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
