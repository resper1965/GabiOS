import { Link } from "react-router";
import { Landmark, Zap, Shield, KanbanSquare, Network, Cpu } from "lucide-react";
import { Button } from "~/components/ui/button";

import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "GabiOS — O Sistema Operacional B2B de Agentes" },
    {
      name: "description",
      content:
        "Escale sua operação com a primeira plataforma Edge-native para gerenciar frotas de agentes autônomos como verdadeiros funcionários.",
    },
  ];
}

const features = [
  {
    icon: KanbanSquare,
    title: "Kanban Autônomo",
    description:
      "Abandone os chatbots. Seus agentes recebem tarefas em uma fila, raciocinam no fundo e reportam quando concluem o trabalho.",
  },
  {
    icon: Network,
    title: "Orçamento & Hierarquia",
    description:
      "Defina departamentos, distribua limites rígidos de tokens e evite surpresas na fatura no fim do mês.",
  },
  {
    icon: Shield,
    title: "Governança Humana (Approval Gates)",
    description:
      "Ações destrutivas ou ambíguas pausam a tarefa automaticamente. Você revisa, aprova e o agente continua.",
  },
  {
    icon: Zap,
    title: "Zero Infraestrutura",
    description:
      "Nativamente orquestrado em Cloudflare Queues e Durable Objects. Zero cold starts. Perfeita escalabilidade assíncrona.",
  },
  {
    icon: Cpu,
    title: "Event Ledger Transparente",
    description:
      "Nada de 'caixa preta'. Acompanhe em tempo real cada chamada de ferramenta e pensamento gerado pelo agente.",
  },
  {
    icon: Landmark,
    title: "Isolamento B2B",
    description:
      "Cada tenant possui seu banco de dados isolado via D1. Privacidade e compliance nativos desde o dia zero.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans">
      {/* ─── Nav ─────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 border-b border-slate-800/50 backdrop-blur-xl bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Landmark className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-lg font-bold tracking-tight">GabiOS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/auth/sign-in"
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link to="/auth/sign-up">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">Deploy Workspace</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/10 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-8 animate-fade-in">
            <Zap className="w-4 h-4" />
            Vercel AI SDK + Cloudflare Edge
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6 animate-slide-up">
            A infraestrutura para<br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              Zero-Human Companies
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: "100ms" }}>
            Não trate a IA como um chatbot. Trate como uma força de trabalho. 
            Orquestre milhares de tarefas assíncronas com governança humana, orçamentos rígidos e execução B2B.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "200ms" }}>
            <Link to="/auth/sign-up">
              <Button size="lg" className="min-w-[200px] bg-emerald-600 hover:bg-emerald-700">
                Criar Workspace Gratuito
              </Button>
            </Link>
            <Link to="#features">
              <Button variant="outline" size="lg" className="min-w-[200px] border-slate-700 text-slate-300 hover:bg-slate-800">
                Como Funciona
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────── */}
      <section id="features" className="py-24 px-6 relative z-10 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Escalabilidade com{" "}
              <span className="text-emerald-400">Controle Absoluto</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Projetado desde o dia 1 para operações enterprise e micro-agências B2B.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="group relative p-6 rounded-2xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 hover:border-slate-700 transition-all duration-300"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 transition-colors">
                  <feature.icon className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-slate-200">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────── */}
      <footer className="border-t border-slate-800 py-8 px-6 bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
            <Landmark className="w-4 h-4" />
            <span>© {new Date().getFullYear()} GabiOS. The Autonomy Engine.</span>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium text-slate-500">
            <a href="#" className="hover:text-emerald-400 transition-colors">Documentação</a>
            <a href="#" className="hover:text-emerald-400 transition-colors">API</a>
            <a href="#" className="hover:text-emerald-400 transition-colors">Segurança</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
