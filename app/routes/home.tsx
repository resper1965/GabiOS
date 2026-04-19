import { Link } from "react-router";
import { Bot, Zap, Shield, MessageSquare, Brain, Globe } from "lucide-react";
import { Button } from "~/components/ui/button";

import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "GabiOS — Plataforma de Agentes de IA" },
    {
      name: "description",
      content:
        "Crie, configure e implante agentes de IA autônomos em minutos. WhatsApp, Teams, WebChat — tudo em um só lugar.",
    },
  ];
}

const features = [
  {
    icon: Bot,
    title: "Agentes Autônomos",
    description:
      "Crie agentes com personalidade própria (SOUL.md), ferramentas e memória. Eles aprendem e evoluem.",
  },
  {
    icon: MessageSquare,
    title: "Multi-Canal",
    description:
      "WhatsApp, Microsoft Teams, WebChat — conecte seus agentes onde seus clientes estão.",
  },
  {
    icon: Brain,
    title: "Memória Inteligente",
    description:
      "Compactação de sessão, fatos estruturados e RAG vetorial. Seus agentes lembram de tudo.",
  },
  {
    icon: Zap,
    title: "Zero Infraestrutura",
    description:
      "Powered by Cloudflare Workers AI. Sem servidores, sem containers, sem dor de cabeça.",
  },
  {
    icon: Shield,
    title: "Segurança & Isolamento",
    description:
      "Cada tenant tem seu próprio banco de dados. RBAC granular, audit logs, LGPD-ready.",
  },
  {
    icon: Globe,
    title: "Edge Global",
    description:
      "Resposta em <50ms de qualquer lugar do mundo. 300+ pontos de presença.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-surface-950 text-white">
      {/* ─── Nav ─────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 backdrop-blur-xl bg-surface-950/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">GabiOS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/auth/sign-in"
              className="text-sm text-surface-400 hover:text-white transition-colors"
            >
              Entrar
            </Link>
            <Link to="/auth/sign-up">
              <Button size="sm">Começar grátis</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-900/20 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-medium mb-8 animate-fade-in">
            <Zap className="w-4 h-4" />
            Powered by Cloudflare Workers AI
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6 animate-slide-up">
            Seus agentes de IA,
            <br />
            <span className="bg-gradient-to-r from-primary-400 via-accent-400 to-primary-400 bg-clip-text text-transparent">
              prontos em minutos
            </span>
          </h1>

          <p className="text-lg md:text-xl text-surface-400 max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: "100ms" }}>
            Crie agentes conversacionais autônomos com personalidade, memória e
            ferramentas. Conecte no WhatsApp, Teams ou WebChat. Sem código, sem
            infraestrutura.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "200ms" }}>
            <Link to="/auth/sign-up">
              <Button size="lg" className="min-w-[200px]">
                Criar conta grátis
              </Button>
            </Link>
            <Link to="#features">
              <Button variant="outline" size="lg" className="min-w-[200px] border-surface-700 text-surface-300 hover:bg-surface-800">
                Ver funcionalidades
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que você precisa para{" "}
              <span className="text-primary-400">agentes inteligentes</span>
            </h2>
            <p className="text-surface-400 max-w-2xl mx-auto">
              Uma plataforma completa para criar, gerenciar e escalar agentes de
              IA — do protótipo à produção.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="group relative p-6 rounded-2xl border border-surface-800 bg-surface-900/50 hover:bg-surface-800/50 hover:border-surface-700 transition-all duration-300"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-4 group-hover:bg-primary-500/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-surface-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative p-12 rounded-3xl border border-surface-800 bg-gradient-to-b from-surface-900 to-surface-950 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-accent-500/5 to-primary-500/5" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Pronto para começar?
              </h2>
              <p className="text-surface-400 mb-8 max-w-lg mx-auto">
                Crie sua conta gratuita e tenha seu primeiro agente respondendo em
                menos de 5 minutos.
              </p>
              <Link to="/auth/sign-up">
                <Button size="lg" className="min-w-[250px]">
                  Criar conta grátis →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────── */}
      <footer className="border-t border-surface-800 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-surface-500 text-sm">
            <Bot className="w-4 h-4" />
            <span>© {new Date().getFullYear()} GabiOS. Todos os direitos reservados.</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-surface-500">
            <a href="#" className="hover:text-white transition-colors">Documentação</a>
            <a href="#" className="hover:text-white transition-colors">API</a>
            <a href="#" className="hover:text-white transition-colors">Termos</a>
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
