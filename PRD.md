# GabiOS — Product Requirements Document (PRD)

> **Versão**: 1.0 — MVP  
> **Data**: 2026-04-19  
> **Owner**: Antigravity  
> **Status**: Draft — Aguardando aprovação para iniciar implementação

---

## 1. Resumo Executivo

**GabiOS** é um SaaS cloud de agentes AI onde "Gabi" é o runtime/OS invisível e os clientes criam agentes personalizados com identidades, personalidades e habilidades próprias. Inspirado no [OpenClaw](https://github.com/openclaw/openclaw), adaptado para rodar inteiramente na nuvem como plataforma multi-tenant.

### Proposta de Valor

Democratizar o acesso a agentes AI inteligentes para empresas de todos os tamanhos, **sem exigir infraestrutura local, conhecimento técnico ou investimento inicial alto**.

### O Problema

Para ter um assistente AI que realmente age — responde clientes no WhatsApp, consulta documentos, executa workflows — hoje é necessário: rodar software local, gerenciar servidores/APIs/credenciais, ter conhecimento técnico significativo, e investir tempo em configuração e manutenção. PMEs, escritórios profissionais e equipes pequenas não têm esses recursos.

### A Solução

- **Zero infra**: Tudo roda no Cloudflare. Cadastrou, configurou, está rodando.
- **Multi-canal**: WhatsApp, Microsoft Teams, WebChat.
- **Multi-agente**: Agentes especializados por função.
- **Memória inteligente**: Session compaction, structured facts, RAG.
- **Workflows declarativos**: Automações sem código via YAML/JSON.

---

## 2. Público-Alvo

### Primário
- **PMEs brasileiras** — escritórios de advocacia, contabilidade, clínicas, imobiliárias
- **Equipes de atendimento** — que usam WhatsApp como canal principal
- **Freelancers e consultores** — que querem escalar com AI

### Secundário
- **Empresas de tecnologia** — integração via API
- **Agências** — gestão multi-cliente com multi-tenancy

---

## 3. Princípios de Produto

| # | Princípio | Implicação |
|---|---|---|
| 1 | **Simplicidade radical** | Se um advogado não configura sozinho em 10 min, falhamos |
| 2 | **AI como utilidade** | Agnóstico ao modelo (OpenAI, Anthropic, Google, Workers AI) |
| 3 | **Privacidade por design** | Cada tenant = banco isolado. Dados nunca compartilhados |
| 4 | **Extensibilidade gradual** | V1: prompts + YAML. V2: code plugins + marketplace |
| 5 | **Foco no resultado** | Usuário não precisa saber o que é RAG ou embeddings |

---

## 4. Stack Técnico

| Componente | Tecnologia |
|---|---|
| Frontend | React Router v7 (SSR no Workers) |
| Backend | Cloudflare Workers + Hono |
| Database | D1 (isolado por tenant) + D1 Master (registry) |
| Storage | R2 |
| Vetorização | Vectorize |
| AI | Cloudflare AI Gateway + Vercel AI SDK |
| Auth | Better Auth (Admin + Organization + API Key) |
| WhatsApp | Evolution API (self-hosted) |
| Teams | MS Teams Bot Framework |
| Observability | Analytics Engine + Logpush + Sentry |

**Arquitetura**: Monolito modular — um Worker principal serve frontend (SSR) e API (Hono), com service layer interno separado por domínio.

---

## 5. Modelo de Agentes

### Conceito Core

Agentes são **entidades agênticas e orquestradas**: possuem autonomia para usar ferramentas e tomar decisões, enquanto o GabiOS coordena execução, contexto e roteamento.

### Anatomia

Cada agente possui: **SOUL.md** (personalidade/instruções), configuração de modelo AI, skills ativáveis, canais vinculados, e configurações de limites.

### Agent Loop

```
Mensagem → Router → Context Builder → Agent Loop (LLM ↔ Tools) → Resposta → Post-process
```

O Context Builder monta: System prompt → SOUL.md → Skills → Session compaction → Memory facts → RAG context → Tool definitions → Histórico recente.

### Memória (3 camadas, faseadas)

| Camada | Versão | Descrição |
|---|---|---|
| Session Compaction | V1.0 | Resumo da conversa quando > 20 msgs |
| Structured Facts | V1.2 | Fatos extraídos automaticamente (key/value) |
| RAG (Vectorize) | V1.1 | Busca semântica em documentos do tenant |

### Tools por Versão

| Versão | Tools |
|---|---|
| V1.0 | `search_knowledge`, `get_facts`, `save_fact` |
| V1.1 | `send_message`, `create_document`, `search_web`, `send_email` |
| V1.2 | `call_api`, `run_workflow`, `schedule_task` |
| V2 | `browse_web`, `execute_code`, `delegate_to_agent` |

### Multi-Agent Routing

- **V1**: Canal-based (cada canal → 1 agente)
- **V2**: Intent-based (router classifica) + Delegation (agentes delegam entre si)

---

## 6. Requisitos Funcionais — V1.0 (MVP)

### RF-01: Autenticação e Autorização

| Req | Descrição | Prioridade |
|---|---|---|
| RF-01.1 | Sign-up/Sign-in com email + password | P0 |
| RF-01.2 | Sessions HTTP-only, Secure, SameSite=Lax (7 dias) | P0 |
| RF-01.3 | RBAC: Owner → Admin → Member | P0 |
| RF-01.4 | CSRF protection em toda mutation | P0 |
| RF-01.5 | Super-admin para gestão de tenants | P0 |

**RBAC Matrix:**

| Recurso | Owner | Admin | Member |
|---|:---:|:---:|:---:|
| Ver dashboard / Usar chat | ✓ | ✓ | ✓ |
| CRUD agentes / canais / workflows / docs | ✓ | ✓ | ✗ |
| Ver analytics | ✓ | ✓ | ✗ |
| Membros / Billing / API Keys | ✓ | ✗ | ✗ |

### RF-02: Onboarding Guiado (5 passos)

| Passo | Ação |
|---|---|
| 1. Org | Nome da organização + segmento vertical |
| 2. Agente | Nome + escolher template ou criar SOUL.md |
| 3. Canal | Conectar WhatsApp (QR) ou usar WebChat |
| 4. Teste | Enviar mensagem e ver resposta do agente |
| 5. Done | Dashboard com checklist "próximos passos" |

**Critério de sucesso**: < 10 minutos do sign-up até a primeira mensagem respondida.

### RF-03: Tenant Provisioning

| Req | Descrição |
|---|---|
| RF-03.1 | Criar D1 database isolado por tenant via Cloudflare API |
| RF-03.2 | Aplicar migrações iniciais automaticamente |
| RF-03.3 | Registrar no D1 Master (registry central) |
| RF-03.4 | Schema versioning e migration runner |

### RF-04: Agentes (CRUD + Editor)

| Req | Descrição |
|---|---|
| RF-04.1 | Criar agente com nome, modelo AI, SOUL.md |
| RF-04.2 | Editor rich para SOUL.md com preview |
| RF-04.3 | Configurar modelo: provider, model_id, temperature, max_tokens |
| RF-04.4 | Listar agentes como cards com status indicator |
| RF-04.5 | 1 agente por tenant no MVP (multi-agente na V1.1) |

### RF-05: Chat Web (Streaming)

| Req | Descrição |
|---|---|
| RF-05.1 | Split view: lista conversas (esquerda) + thread (direita) |
| RF-05.2 | Streaming via Vercel AI SDK `useChat()` |
| RF-05.3 | Markdown rendering nas respostas |
| RF-05.4 | Floating chat (FAB bottom-right → drawer 400px) |
| RF-05.5 | Session compaction automática (> 20 msgs) |

### RF-06: Dashboard

| Req | Descrição |
|---|---|
| RF-06.1 | Stat cards: total agentes, mensagens, canais, uptime |
| RF-06.2 | Sparklines com % de variação |
| RF-06.3 | Atividade recente (últimas conversas) |
| RF-06.4 | Saúde dos canais |

### RF-07: Settings

| Req | Descrição |
|---|---|
| RF-07.1 | Editar info da organização |
| RF-07.2 | Gerenciar membros (convite, role, remoção) |
| RF-07.3 | Placeholder para billing (v1.1+) |

### RF-08: Command Palette (⌘K)

| Req | Descrição |
|---|---|
| RF-08.1 | Overlay de busca rápida |
| RF-08.2 | Buscar agentes, conversas, settings, ações |

### RF-09: Observability

| Req | Descrição |
|---|---|
| RF-09.1 | Analytics Engine: mensagens/dia, tokens, latência |
| RF-09.2 | Sentry: error tracking + performance |
| RF-09.3 | Health check endpoint (`GET /api/health`) |
| RF-09.4 | Métricas: tempo de onboarding (signup → 1ª mensagem) |

---

## 7. Requisitos Funcionais — V1.1

| Req | Descrição |
|---|---|
| RF-10 | Multi-agente: múltiplos agentes por tenant |
| RF-11 | WhatsApp via Evolution API (connect, send, receive, webhooks) |
| RF-12 | RAG: upload docs → R2 → chunks → Vectorize → busca semântica |
| RF-13 | Templates de SOUL.md por vertical (jurídico, contábil, etc.) |

---

## 8. Requisitos Funcionais — V1.2

| Req | Descrição |
|---|---|
| RF-14 | Microsoft Teams bot integration |
| RF-15 | Structured memory facts (auto-extraction + manual) |
| RF-16 | Workflows declarativos YAML/JSON via formulários |
| RF-17 | Cron jobs (automações agendadas) |
| RF-18 | API Keys (geração, revogação, scoped por tenant) |

---

## 9. Requisitos Não-Funcionais

### Performance
| Req | Meta |
|---|---|
| RNF-01 | Latência de resposta do agente < 5s (p95) |
| RNF-02 | Time-to-first-token (streaming) < 1s |
| RNF-03 | Uptime > 99.5% |

### Segurança
| Req | Descrição |
|---|---|
| RNF-04 | Isolamento total entre tenants (D1 separado) |
| RNF-05 | TLS 1.3, HSTS, security headers completos |
| RNF-06 | Input validation (Zod) em todo endpoint |
| RNF-07 | Rate limiting: 100/min IP, 1000/min tenant, 30/min chat |
| RNF-08 | Audit log de todas as ações administrativas |
| RNF-09 | AI safety: prompts server-side, SOUL.md sanitizado, zero cross-tenant |
| RNF-10 | Compliance: LGPD (deletion on request), SOC 2 + ISO 27001 via Cloudflare |

### Escalabilidade
| Req | Meta |
|---|---|
| RNF-11 | Suportar 10-50 tenants ativos no V1 |
| RNF-12 | D1 archiving para R2 quando > 10GB |

---

## 10. UX/UI

### Design System
- **Estilo**: Clean/minimal SaaS — inspiração Linear, Vercel, Notion
- **Cor primária**: Azul (`#2563EB`)
- **Tipografia**: Inter (corpo) + JetBrains Mono (código)
- **Ícones**: Lucide Icons
- **Animações**: 150-200ms ease

### Telas V1.0

| Tela | Descrição |
|---|---|
| Landing | Hero + features + pricing + CTA |
| Auth | Sign-in / Sign-up clean |
| Onboarding | Wizard 5 passos com stepper visual |
| Dashboard | Stats + sparklines + atividade + saúde canais |
| Agentes | Cards com status. Click → editor split (SOUL.md + config) |
| Chat | Split view + streaming + floating chat (FAB) |
| Settings | Tabs: Org, Membros, API Keys, Billing |
| Command Palette | ⌘K overlay |
| Admin | Super-admin: gestão de tenants |

### Layout Principal

```
┌─────────────────────────────────────────────┐
│ Sidebar (240px)  │  Header: Org + ⌘K + 🔔 + 👤 │
│ light gray       │─────────────────────────────│
│                  │  Content area              │
│ 🏠 Dashboard     │                             │
│ 🤖 Agentes       │  [Stats] [Activity]         │
│ 💬 Conversas     │                             │
│ ⚙️ Settings      │                    💬 (FAB) │
└─────────────────────────────────────────────┘
```

---

## 11. Schema de Dados

### Master Registry (D1 central)

```
tenants: id, name, slug, d1_database_id, plan, status, owner_user_id, schema_version
```

### Per-Tenant D1

| Tabela | Campos-chave |
|---|---|
| `agents` | id, name, soul_md, model_provider, model_id, temperature, status |
| `channels` | id, type (whatsapp/teams/webchat), agent_id, config, status |
| `conversations` | id, agent_id, channel_id, external_contact, summary, message_count |
| `messages` | id, conversation_id, role, content, token_count, metadata |
| `agent_skills` | id, agent_id, name, instruction, enabled, priority |
| `workflows` | id, name, trigger_type, trigger_config, steps, enabled |
| `memory_facts` | id, agent_id, category, key, value, source, confidence |
| `documents` | id, name, r2_key, mime_type, chunk_count, status |
| `automations` | id, agent_id, name, cron_expression, action_type, enabled |
| `audit_logs` | id, actor_id, action, target_type, target_id, metadata |
| Better Auth | users, sessions, accounts, organizations, members, invitations, api_keys |

---

## 12. API Endpoints (V1.0)

```
# Agentes
POST/GET     /api/agents
GET/PUT/DEL  /api/agents/:id

# Chat
POST         /api/chat              (streaming SSE)
GET          /api/conversations
GET          /api/conversations/:id

# Canais
GET          /api/channels

# Analytics
GET          /api/analytics

# Health
GET          /api/health

# Webhooks (recebidos)
POST         /api/webhooks/evolution
POST         /api/webhooks/teams

# Admin
GET          /api/admin/tenants
```

---

## 13. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Evolution API instabilidade | WhatsApp offline | Health check + auto-reconnect + alertas |
| Custo de AI tokens escala | Margem negativa | AI Gateway caching + rate limits por tenant |
| Schema drift entre tenants | Dados corrompidos | Tenant provisioner + migration runner |
| Onboarding abandono | Churn alto | Wizard guiado + email follow-up |
| D1 limits (10GB/banco) | Dados overflow | Archiving conversas antigas → R2 |
| Evolution API (Baileys) | WhatsApp não-oficial, risco de ban | Documentar risco, planejar migração para API oficial |
| Cloudflare dependency | Vendor lock-in | Abstrações nos services |

---

## 14. Métricas de Sucesso

| Métrica | Meta V1 |
|---|---|
| Tenants ativos | 10-50 |
| Tempo de onboarding | < 10 minutos |
| Mensagens/dia/tenant | > 50 |
| Churn mensal | < 5% |
| NPS | > 40 |
| Latência p95 | < 5s |
| Uptime | > 99.5% |

---

## 15. Roadmap

| Fase | Prazo | Escopo |
|---|---|---|
| **V1.0 — MVP** | 4 semanas | 1 agente, chat web, auth, onboarding, observability |
| **V1.1** | +2 semanas | Multi-agente, WhatsApp, RAG, templates |
| **V1.2** | +2 semanas | Teams, structured memory, workflows, cron, API keys |
| **V2** | Futuro | Marketplace, code plugins, builder visual, browser automation, MCP |

### Cronograma V1.0

| Semana | Entregas |
|---|---|
| **S1** | Scaffold (React Router + CF Workers), Better Auth, D1 Master, Landing |
| **S2** | Dashboard layout (sidebar + header + ⌘K), Onboarding wizard, Agent CRUD |
| **S3** | Chat web (streaming), AI Gateway, Session compaction |
| **S4** | Analytics, Health check, CI/CD completo, Deploy staging + prod |

---

## 16. Decisões Arquiteturais (ADRs)

| # | Decisão | Razão |
|---|---|---|
| ADR-01 | SaaS cloud-hosted | Público-alvo não quer gerenciar infra |
| ADR-02 | D1 isolado por tenant | Dados sensíveis + isolamento forte |
| ADR-03 | CF AI Gateway | Caching, analytics, fallback entre providers |
| ADR-04 | Evolution API (não Baileys) | Baileys incompatível com serverless |
| ADR-05 | Better Auth | Já validado no CyberGame, plugins extensíveis |
| ADR-06 | Gabi = OS, não agente | Separação clara: plataforma vs entidades do cliente |
| ADR-07 | SOUL.md + Templates | Acessibilidade + flexibilidade |
| ADR-08 | Workflows YAML (v1) | Validar modelo antes de builder visual |
| ADR-09 | Memória faseada | Compaction v1.0 → RAG v1.1 → Facts v1.2 |
| ADR-10 | Monolito modular | Simplicidade de deploy + separação lógica interna |

---

## 17. Dependências Externas

| Serviço | Propósito | Custo |
|---|---|---|
| Cloudflare Workers | Compute | Pay-per-use (free tier generoso) |
| Cloudflare D1 | Database | $0.75/mi reads, $1.00/mi writes |
| Cloudflare R2 | File storage | $0.015/GB/mês |
| Cloudflare Vectorize | Embeddings | $0.01/mi queries |
| Cloudflare AI Gateway | LLM proxy | Free |
| Evolution API | WhatsApp | Self-hosted (free) |
| Sentry | Error tracking | Free tier |
| LLM Providers | AI responses | Pay-per-token (varia) |

---

## 18. Fora de Escopo (V1.0)

- ❌ Workflow builder visual (drag-and-drop)
- ❌ Marketplace de skills
- ❌ Code plugins (Workers isolados)
- ❌ Browser automation
- ❌ MCP integrations
- ❌ Telegram, Slack
- ❌ OAuth (Google, GitHub)
- ❌ Magic link login
- ❌ Agent Auth (identidade para agentes)
- ❌ Intent-based routing
- ❌ Agent delegation

---

## Aprovação

| Papel | Nome | Status |
|---|---|---|
| Product Owner | — | ⬜ Pendente |
| Tech Lead | — | ⬜ Pendente |
| Design | — | ⬜ Pendente |
