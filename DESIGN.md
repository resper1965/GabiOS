# GabiOS — Design Document (Final)

## Understanding Lock ✅

### O que é
**GabiOS** — SaaS cloud de agentes AI onde "Gabi" é o runtime/OS invisível e os clientes criam agentes personalizados. Inspirado no OpenClaw, adaptado para nuvem.

### Por que existe
Trazer o poder de um agente AI pessoal para a nuvem, acessível a empresas e profissionais sem infra local.

### Para quem
Indivíduos, equipes, médias empresas e verticais diversos (advocacia, contabilidade, atendimento, etc.)

### Stack Técnico

| Componente | Tecnologia |
|---|---|
| Frontend | React Router v7 |
| Backend | Cloudflare Workers + Hono |
| Database | D1 (isolado por tenant) + D1 Master (registry) |
| Storage | R2 |
| Vetorização | Vectorize |
| AI Gateway | Cloudflare AI Gateway |
| AI SDK | Vercel AI SDK (streaming) |
| Auth | Better Auth + Admin + Organization + API Key + Agent Auth |
| WhatsApp | **Evolution API** (self-hosted, REST + webhooks) |
| Teams | Microsoft Teams Bot Framework |
| Observability | Analytics Engine + Logpush + Sentry |

---

## Roadmap Faseado (Revisado)

### V1.0 — MVP (4 semanas)
| Feature | Detalhe |
|---|---|
| 1 agente por tenant | SOUL.md editor, config de modelo |
| Chat web | Streaming via Vercel AI SDK |
| Auth + RBAC | Better Auth + owner/admin/member |
| Memória | Session compaction apenas |
| Onboarding | Fluxo guiado em 5 passos |
| Observability | Analytics Engine + error tracking |
| Tenant provisioner | Registry central + criação automatizada |

### V1.1 (+ 2 semanas)
| Feature | Detalhe |
|---|---|
| Multi-agente | Múltiplos agentes por tenant |
| WhatsApp | Evolution API integration |
| RAG | Upload docs + Vectorize + busca contextual |
| Templates | Templates de SOUL.md por vertical |

### V1.2 (+ 2 semanas)
| Feature | Detalhe |
|---|---|
| Microsoft Teams | Bot Framework integration |
| Structured memory | Fatos-chave em D1 |
| Workflows declarativos | YAML/JSON via formulários no dashboard |
| Cron jobs | Automações agendadas |
| API Keys | Para integrações externas |

### V2 (futuro)
- Workflow builder visual (drag-and-drop)
- Marketplace de skills
- Code plugins (Workers isolados)
- Browser automation
- MCP integrations
- Telegram, Slack e outros canais
- Agent Auth completo

---

## Decision Log

| # | Decisão | Alternativas | Razão |
|---|---|---|---|
| 1 | SaaS cloud-hosted | Local-first, Painel remoto | Público-alvo não quer gerenciar infra |
| 2 | Tenant isolado (D1 por cliente) | Multi-tenant compartilhado | Prudência com volume desconhecido + dados sensíveis |
| 3 | Cloudflare AI Gateway | Workers AI direto, API keys diretas | Caching, analytics, fallback entre provedores |
| 4 | **Evolution API** (não Baileys) | Baileys direto, WhatsApp Business API | Baileys incompatível com serverless; Evolution já resolve persistência |
| 5 | Better Auth completo | Auth.js, Clerk | Já validado no CyberGame, plugins extensíveis |
| 6 | Gabi = OS, não agente | Gabi como agente default | Separação clara: plataforma vs entidades do cliente |
| 7 | Templates + editor SOUL.md | Só editor, Só templates | Acessibilidade + flexibilidade |
| 8 | Skills: prompts + **workflows declarativos** (v1) | Builder visual, Code plugins | Builder visual = produto inteiro; YAML validado primeiro |
| 9 | RBAC 3 papéis | Permissões granulares | Simplicidade v1 |
| 10 | Memória 3 camadas (faseada) | Tudo de uma vez | Compaction v1.0, RAG v1.1, Structured v1.2 |
| 11 | WhatsApp + Chat Web + Teams | Todos os canais | Foco no público-alvo BR + corporativo |
| 12 | Licença fixa mensal | Freemium, Pay-per-use | Receita previsível B2B |
| 13 | Clean/minimal SaaS (UI) | Dark-first, Glassmorphism | Profissional, universal |
| 14 | Azul como cor primária | Roxo, Verde, Preto | Universal, confiança |
| 15 | **Sidebar clara** (light gray) | Sidebar escura | Uniformidade clean, estilo Linear |
| 16 | Chat: página + floating panel | Só página | Conversas longas + acesso rápido |
| 17 | **MVP faseado** | Tudo na V1 | Scope realista, validação rápida |
| 18 | **Evolution API desde dia 1** | Baileys → fallback Evolution | Baileys incompatível com cloud serverless |
| 19 | **Workflows YAML/JSON** (v1) | Builder visual | Validar modelo antes de investir em UI complexa |
| 20 | **Tenant provisioner + registry** | Provisionamento manual | Migrações consistentes, sem schema drift |
| 21 | **Observability desde v1.0** | Adicionar depois | SaaS com AI + WhatsApp precisa saber quando falha |
| 22 | **Onboarding guiado** | Dashboard direto | Reduz churn, primeira impressão |
| 23 | **Command palette (⌘K)** | Só sidebar | Navegação rápida para power users |

---

## Arquitetura — Monolito Modular (Confirmada)

```
GabiOS/
├── app/                        # Frontend React Router v7
│   ├── routes/
│   │   ├── _index.tsx              # Landing page
│   │   ├── auth/
│   │   │   ├── sign-in.tsx
│   │   │   ├── sign-up.tsx
│   │   │   └── pending.tsx
│   │   ├── onboarding/            # Fluxo guiado (5 passos)
│   │   │   ├── _layout.tsx
│   │   │   ├── org.tsx             # 1. Criar org
│   │   │   ├── agent.tsx           # 2. Criar primeiro agente
│   │   │   ├── channel.tsx         # 3. Conectar canal
│   │   │   ├── test.tsx            # 4. Mensagem teste
│   │   │   └── done.tsx            # 5. Missão completada
│   │   ├── dashboard/
│   │   │   ├── _layout.tsx         # Sidebar + command palette
│   │   │   ├── index.tsx           # Overview (stats, atividade)
│   │   │   ├── agents/
│   │   │   │   ├── index.tsx       # Lista de agentes
│   │   │   │   └── $id.tsx         # Editor: SOUL.md, modelo, skills
│   │   │   ├── chat/
│   │   │   │   ├── index.tsx       # Split view (conversas + thread)
│   │   │   │   └── $id.tsx         # Thread individual
│   │   │   ├── knowledge/
│   │   │   │   └── index.tsx       # Upload, docs, status vetorização
│   │   │   ├── workflows/
│   │   │   │   ├── index.tsx       # Lista de workflows
│   │   │   │   └── $id.tsx         # Editor formulário YAML
│   │   │   ├── automations/
│   │   │   │   └── index.tsx       # Cron jobs
│   │   │   ├── channels/
│   │   │   │   └── index.tsx       # WhatsApp, Teams, WebChat status
│   │   │   ├── analytics/
│   │   │   │   └── index.tsx       # Uso, mensagens, tokens, saúde
│   │   │   └── settings/
│   │   │       ├── index.tsx       # Org info, billing
│   │   │       ├── members.tsx     # RBAC, convites
│   │   │       └── api-keys.tsx    # API keys management
│   │   └── admin/                  # Super-admin (gestão de tenants)
│   │       ├── _layout.tsx
│   │       ├── index.tsx
│   │       └── tenants.tsx
│   ├── components/
│   │   ├── ui/                     # Design system
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── data-table.tsx
│   │   │   ├── modal.tsx
│   │   │   ├── command-palette.tsx  # ⌘K
│   │   │   ├── stat-card.tsx       # Com sparkline
│   │   │   └── sidebar.tsx
│   │   ├── chat/
│   │   │   ├── chat-thread.tsx
│   │   │   ├── message-bubble.tsx
│   │   │   ├── floating-chat.tsx   # FAB + drawer
│   │   │   └── markdown-renderer.tsx
│   │   ├── agents/
│   │   │   ├── soul-editor.tsx     # Editor rich SOUL.md
│   │   │   └── agent-card.tsx
│   │   └── onboarding/
│   │       ├── step-indicator.tsx
│   │       └── channel-setup.tsx
│   └── lib/
│       ├── auth.server.ts
│       ├── auth.client.ts
│       ├── db.server.ts
│       └── tenant.server.ts        # Tenant resolution
├── server/                     # API Hono
│   ├── routes/
│   │   ├── agents.ts
│   │   ├── chat.ts                 # Vercel AI SDK streaming
│   │   ├── channels.ts
│   │   ├── workflows.ts
│   │   ├── knowledge.ts            # Upload + vetorização
│   │   ├── automations.ts
│   │   ├── analytics.ts
│   │   └── admin.ts                # Super-admin
│   ├── services/
│   │   ├── evolution-api.ts        # Evolution API client
│   │   ├── teams-bot.ts
│   │   ├── ai-gateway.ts           # CF AI Gateway client
│   │   ├── vectorizer.ts           # Document → chunks → embeddings
│   │   ├── memory-engine.ts        # 3-layer memory orchestrator
│   │   ├── workflow-engine.ts      # YAML workflow executor
│   │   ├── compactor.ts            # Session compaction
│   │   └── tenant-provisioner.ts   # Create/migrate tenant D1s
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── rbac.ts
│   │   ├── tenant.ts               # Resolve tenant D1 from request
│   │   └── rate-limit.ts
│   └── lib/
│       ├── ai.ts
│       └── observability.ts        # Analytics Engine + Sentry
├── workers/
│   ├── app.ts                      # Main worker entry
│   └── cron-runner.ts              # Scheduled triggers
├── db/
│   ├── schema.ts                   # Drizzle schema (per-tenant)
│   ├── master-schema.ts            # Registry central schema
│   └── migrations/
└── wrangler.jsonc
```

---

## Schema de Dados

### Master Registry (D1 central — 1 único)

```sql
-- Registro de todos os tenants
tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  d1_database_id TEXT NOT NULL,      -- ID do D1 desse tenant
  plan TEXT DEFAULT 'starter',
  status TEXT DEFAULT 'active',       -- active, suspended, cancelled
  owner_user_id TEXT NOT NULL,
  schema_version INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER
)
```

### Per-Tenant D1 (1 por cliente)

```sql
-- Better Auth tables (gerenciadas pelo framework)
-- users, sessions, accounts, verifications, organizations, members, invitations, api_keys

-- Agentes
agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  soul_md TEXT,                       -- Personalidade/instruções
  avatar_url TEXT,
  model_provider TEXT DEFAULT 'openai',  -- openai, anthropic, google, workers-ai
  model_id TEXT DEFAULT 'gpt-4o-mini',
  temperature REAL DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 4096,
  status TEXT DEFAULT 'active',
  created_at INTEGER NOT NULL,
  updated_at INTEGER
)

-- Canais conectados
channels (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,                 -- whatsapp, teams, webchat
  agent_id TEXT REFERENCES agents(id),
  config TEXT,                        -- JSON: Evolution API instance, bot token, etc.
  status TEXT DEFAULT 'disconnected', -- connected, disconnected, error
  connected_at INTEGER,
  created_at INTEGER NOT NULL
)

-- Conversas
conversations (
  id TEXT PRIMARY KEY,
  agent_id TEXT REFERENCES agents(id) NOT NULL,
  channel_id TEXT REFERENCES channels(id),
  external_contact TEXT,              -- phone number, teams user id, etc.
  summary TEXT,                       -- Session compaction summary
  status TEXT DEFAULT 'active',       -- active, archived
  message_count INTEGER DEFAULT 0,
  started_at INTEGER NOT NULL,
  last_message_at INTEGER
)

-- Mensagens
messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT REFERENCES conversations(id) NOT NULL,
  role TEXT NOT NULL,                 -- user, assistant, system
  content TEXT NOT NULL,
  token_count INTEGER,
  metadata TEXT,                      -- JSON: tool calls, attachments
  created_at INTEGER NOT NULL
)

-- Skills (prompts editáveis)
agent_skills (
  id TEXT PRIMARY KEY,
  agent_id TEXT REFERENCES agents(id) NOT NULL,
  name TEXT NOT NULL,
  instruction TEXT NOT NULL,          -- O prompt/instrução
  enabled INTEGER DEFAULT 1,
  priority INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER
)

-- Workflows (declarativos YAML/JSON)
workflows (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,         -- message.received, cron, webhook, manual
  trigger_config TEXT,                -- JSON: conditions, cron expression
  steps TEXT NOT NULL,                -- JSON: array of action steps
  enabled INTEGER DEFAULT 1,
  last_run INTEGER,
  run_count INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER
)

-- Memory facts (structured)
memory_facts (
  id TEXT PRIMARY KEY,
  agent_id TEXT REFERENCES agents(id),
  category TEXT NOT NULL,             -- preference, fact, relationship, deadline
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  source TEXT,                        -- conversation_id, manual, workflow
  confidence REAL DEFAULT 1.0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER
)

-- Documents (para vetorização)
documents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER,
  chunk_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'processing',   -- processing, ready, failed
  error TEXT,
  uploaded_by TEXT REFERENCES users(id),
  uploaded_at INTEGER NOT NULL
)

-- Automações (cron)
automations (
  id TEXT PRIMARY KEY,
  agent_id TEXT REFERENCES agents(id),
  name TEXT NOT NULL,
  cron_expression TEXT NOT NULL,
  action_type TEXT NOT NULL,          -- send_summary, check_deadlines, custom_workflow
  action_config TEXT,                 -- JSON
  enabled INTEGER DEFAULT 1,
  last_run INTEGER,
  next_run INTEGER,
  created_at INTEGER NOT NULL
)

-- Audit log
audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  metadata TEXT,
  created_at INTEGER NOT NULL
)
```

---

## UX/UI Design System (Revisado)

### Identidade Visual
- **Estilo**: Clean/minimal SaaS — inspiração Linear, Vercel, Notion
- **Cor primária**: Azul (`#2563EB` base, `#1D4ED8` hover, `#3B82F6` light)
- **Paleta neutral**: `#F9FAFB` (bg) → `#F3F4F6` (sidebar) → `#E5E7EB` (borders) → `#6B7280` (text-muted) → `#111827` (text)
- **Tipografia**: Inter (corpo) + JetBrains Mono (código/dados)
- **Bordas**: `1px solid #E5E7EB`, border-radius `8px`
- **Sombras**: `0 1px 3px rgba(0,0,0,0.1)` (cards), `0 4px 12px rgba(0,0,0,0.08)` (modals)
- **Ícones**: Lucide Icons
- **Animações**: 150-200ms ease, transitions suaves

### Layout Principal
```
┌──────────────────────────────────────────────────────────┐
│ Sidebar (240px)      │  Header: Org name + ⌘K + 🔔 + 👤 │
│ light gray (#F3F4F6) │──────────────────────────────────│
│                      │                                   │
│ GabiOS (logo)        │  Breadcrumb: Dashboard            │
│                      │                                   │
│ 🏠 Dashboard         │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐│
│ 🤖 Agentes           │  │ 12  │ │ 847 │ │  3  │ │ 98% ││
│ 💬 Conversas         │  │agents│ │ msgs│ │chans│ │ up  ││
│ 🔧 Workflows         │  │ +5% │ │+12% │ │ ✓  │ │     ││
│ 📚 Knowledge         │  └─────┘ └─────┘ └─────┘ └─────┘│
│ ⏰ Automações        │                                   │
│ 📊 Analytics         │  ┌──────────────┐ ┌──────────────┐│
│ ─────────────        │  │  Recent      │ │  Activity    ││
│ ⚙️ Settings           │  │  Convos      │ │  Chart       ││
│ 👥 Membros           │  └──────────────┘ └──────────────┘│
│                      │                          💬 (FAB) │
└──────────────────────────────────────────────────────────┘
```

### Onboarding Flow (5 passos)
```
┌─────────────────────────────────────────┐
│         Bem-vindo ao GabiOS             │
│                                         │
│  ● ○ ○ ○ ○  Passo 1 de 5              │
│                                         │
│  Qual o nome da sua organização?        │
│  ┌─────────────────────────────────┐    │
│  │ Ex: Escritório Silva & Souza   │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Selecione seu segmento:               │
│  [Jurídico] [Contábil] [Atendimento]   │
│  [Saúde] [Educação] [Outro]            │
│                                         │
│           [Continuar →]                 │
└─────────────────────────────────────────┘
```

Passos:
1. **Org** — nome, segmento vertical
2. **Agente** — nome, template ou SOUL.md do zero
3. **Canal** — conectar WhatsApp (QR) ou usar só WebChat
4. **Teste** — enviar mensagem e ver resposta
5. **Done** — dashboard com checklist de "próximos passos"

### Telas V1.0

| Tela | Descrição |
|---|---|
| **Landing** | Hero + features + pricing + CTA |
| **Auth** | Sign-in / Sign-up clean |
| **Onboarding** | Wizard 5 passos com stepper visual |
| **Dashboard** | Stats com sparklines e %, atividade recente, saúde dos canais |
| **Agentes** | Cards de agentes com status indicator. Click → editor split (SOUL.md + preview + config) |
| **Chat** | Split view: lista conversas à esquerda, thread com streaming à direita |
| **Settings** | Tabs: Organização, Membros, API Keys, Billing |
| **Command Palette** | `⌘K` overlay: busca agentes, conversas, settings, ações rápidas |
| **Floating Chat** | FAB bottom-right → drawer 400px com mini-chat contextual |

---

## Observability Stack

| Ferramenta | Propósito |
|---|---|
| **Cloudflare Analytics Engine** | Métricas: mensagens/dia, tokens consumidos, latência |
| **Logpush** | Logs estruturados para Worker requests |
| **Sentry** | Error tracking + performance monitoring |
| **Dashboard Analytics** | Tela no admin: uso por tenant, custo estimado, saúde |

### Métricas-chave a rastrear
- Mensagens processadas / tenant / dia
- Tokens consumidos / tenant / dia (custo)
- Latência média de resposta do agente
- Taxa de erro por canal
- Uptime por canal (WhatsApp, Teams)
- Tempo de onboarding (signup → primeira mensagem)

---

## Riscos e Mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Evolution API instabilidade | WhatsApp offline | Health check + auto-reconnect + alertas |
| Custo de AI tokens escala | Margem negativa | AI Gateway caching + rate limits por tenant |
| Schema drift entre tenants | Dados corrompidos | Tenant provisioner + migration runner automatizado |
| Onboarding abandono | Churn alto | Wizard guiado + email de follow-up |
| D1 limits (10GB/banco) | Dados overflow | Archiving de conversas antigas para R2 |
