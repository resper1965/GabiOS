# GabiOS — Visão do Produto

## Missão

Democratizar o acesso a agentes AI inteligentes para empresas de todos os tamanhos, sem exigir infraestrutura local, conhecimento técnico ou investimento inicial alto.

## O Problema

Hoje, para ter um assistente AI que realmente faz coisas — responde clientes no WhatsApp, consulta documentos, executa workflows — você precisa:

1. Rodar software local (OpenClaw, n8n, etc.)
2. Gerenciar servidores, APIs, credenciais
3. Ter conhecimento técnico significativo
4. Investir tempo em configuração e manutenção

A maioria das empresas — especialmente PMEs, escritórios profissionais e equipes pequenas — não tem esses recursos.

## A Solução

GabiOS é a ponte entre o poder de um agente AI autônomo e a simplicidade de um SaaS.

- **Zero infra**: Tudo roda no Cloudflare. Cadastrou, configurou, está rodando.
- **Multi-canal**: O agente responde onde o cliente já está — WhatsApp, Teams, Web.
- **Multi-agente**: Crie agentes especializados para diferentes funções.
- **Memória inteligente**: O agente lembra contexto, aprende com documentos, extrai fatos.
- **Workflows**: Automações sem código que conectam triggers a ações.

## Princípios

### 1. Simplicidade radical
Se um advogado não consegue configurar sozinho em 10 minutos, falhamos. O onboarding deve ser guiado, visual e imediato.

### 2. AI como utilidade, não como produto
O valor não está no modelo AI — está na orquestração. O GabiOS é agnóstico ao modelo: OpenAI, Anthropic, Google, Workers AI. O cliente escolhe.

### 3. Privacidade por design
Cada tenant tem seu próprio banco de dados isolado. Dados nunca são compartilhados entre tenants. Cloudflare provê compliance (SOC 2, ISO 27001).

### 4. Extensibilidade gradual
V1: prompts e workflows declarativos (acessível a todos)
V2: code plugins e marketplace (para power users e devs)

### 5. Foco no resultado, não na tecnologia
O usuário não precisa saber o que é RAG, embeddings ou LLM. Ele precisa que o agente responda certo, no canal certo, na hora certa.

## Público-alvo

### Primário
- **PMEs brasileiras** — escritórios de advocacia, contabilidade, clínicas, imobiliárias
- **Equipes de atendimento** — que usam WhatsApp como canal principal
- **Freelancers e consultores** — que querem escalar com AI

### Secundário
- **Empresas de tecnologia** — que querem integrar agentes AI via API
- **Agências** — que gerenciam múltiplos clientes e precisam de multi-tenancy

## Roadmap de Alto Nível

### V1.0 — MVP (4 semanas)
Um agente, chat web, auth completo, onboarding guiado.

### V1.1 — Multi-agente + WhatsApp
Múltiplos agentes, Evolution API, RAG com documentos.

### V1.2 — Teams + Workflows + Automações
Microsoft Teams, workflows declarativos, cron jobs.

### V2 — Plataforma
Marketplace de skills, code plugins, builder visual, browser automation.

## Métricas de Sucesso

| Métrica | Meta V1 |
|---|---|
| Tenants ativos | 10-50 |
| Tempo de onboarding | < 10 minutos |
| Mensagens/dia/tenant | > 50 |
| Churn mensal | < 5% |
| NPS | > 40 |

## Inspirações

- [OpenClaw](https://openclaw.ai) — Agente AI pessoal local-first
- [Linear](https://linear.app) — UX/UI de referência
- [n8n](https://n8n.io) — Workflows de automação
- [Intercom](https://intercom.com) — Chat integrado ao produto
