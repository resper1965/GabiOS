import { Bot, MessageSquare, FileText, Zap } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";

export function meta() {
  return [{ title: "Dashboard — GabiOS" }];
}

const stats = [
  { label: "Agentes Ativos", value: "0", icon: Bot, color: "text-primary-500" },
  { label: "Conversas Hoje", value: "0", icon: MessageSquare, color: "text-success-500" },
  { label: "Documentos", value: "0", icon: FileText, color: "text-accent-500" },
  { label: "Mensagens/Mês", value: "0", icon: Zap, color: "text-warning-500" },
];

export default function DashboardIndex() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} variant="elevated">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-surface-500">{stat.label}</p>
                  <p className="text-3xl font-bold text-surface-900 mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-surface-50 flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold text-surface-900 mb-4">Início rápido</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                  <Bot className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-surface-900">Criar agente</p>
                  <p className="text-sm text-surface-500">Configure um novo agente de IA</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent-50 flex items-center justify-center group-hover:bg-accent-100 transition-colors">
                  <FileText className="w-6 h-6 text-accent-600" />
                </div>
                <div>
                  <p className="font-medium text-surface-900">Upload documento</p>
                  <p className="text-sm text-surface-500">Adicione à base de conhecimento</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-success-50 flex items-center justify-center group-hover:bg-success-100 transition-colors">
                  <MessageSquare className="w-6 h-6 text-success-600" />
                </div>
                <div>
                  <p className="font-medium text-surface-900">Testar agente</p>
                  <p className="text-sm text-surface-500">Converse com seu agente</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Empty state */}
      <Card variant="bordered" className="border-dashed">
        <CardContent>
          <div className="text-center py-8">
            <Bot className="w-16 h-16 text-surface-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-surface-700 mb-2">
              Nenhum agente criado ainda
            </h3>
            <p className="text-surface-500 max-w-md mx-auto mb-6">
              Crie seu primeiro agente de IA para começar a automatizar conversas.
              Defina uma personalidade, conecte ferramentas e ligue a canais.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
