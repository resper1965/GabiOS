# GabiOS — Arquitetura Técnica

## Visão Geral

GabiOS usa uma arquitetura **monolito modular** sobre Cloudflare Workers, com separação lógica de domínios internamente e Durable Objects apenas onde persistência stateful é necessária.

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Edge                           │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Main Worker (app.ts)                     │   │
│  │                                                       │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │   │
│  │  │ React Router │  │  Hono API    │  │ Middleware  │  │   │
│  │  │ v7 (SSR)     │  │  Server      │  │ Stack      │  │   │
│  │  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘  │   │
│  │         │                 │                 │         │   │
│  │  ┌──────┴─────────────────┴─────────────────┴──────┐  │   │
│  │  │              Service Layer                       │  │   │
│  │  │                                                  │  │   │
│  │  │  ai-gateway ─ memory-engine ─ vectorizer        │  │   │
│  │  │  evolution-api ─ teams-bot ─ workflow-engine     │  │   │
│  │  │  compactor ─ tenant-provisioner                  │  │   │
│  │  └──────────────────────┬───────────────────────────┘  │   │
│  └─────────────────────────┼──────────────────────────────┘   │
│                            │                                  │
│  ┌─────────┐  ┌───────┐  ┌┴────────┐  ┌──────────┐          │
│  │ D1      │  │  R2   │  │Vectorize│  │AI Gateway│          │
│  │(per-    │  │(files)│  │(embeds) │  │(LLM proxy│          │
│  │ tenant) │  │       │  │         │  │          │          │
│  └─────────┘  └───────┘  └─────────┘  └──────────┘          │
│                                                              │
│  ┌──────────────────┐  ┌─────────────────┐                  │
│  │ D1 Master        │  │ Cron Worker      │                  │
│  │ (tenant registry)│  │ (scheduled tasks)│                  │
│  └──────────────────┘  └─────────────────┘                  │
└──────────────────────────────────────────────────────────────┘

         ┌──────────────────────────────┐
         │    External Services          │
         │                              │
         │  Evolution API (WhatsApp)    │
         │  MS Teams Bot Service        │
         │  Sentry (error tracking)     │
         └──────────────────────────────┘
```

## Componentes

### 1. Main Worker (`workers/app.ts`)

Entry point único que combina React Router v7 (SSR) com Hono API server.

```
Request → Middleware Stack → Route Handler → Response
                │
                ├── Auth (Better Auth)
                ├── RBAC (role check)
                ├── Tenant Resolution (header/cookie → D1 binding)
                └── Rate Limiting
```

**Responsabilidades:**
- Servir páginas React (SSR + client hydration)
- Servir API REST via Hono
- Resolver tenant e injetar binding D1 correto
- Autenticação e autorização

### 2. React Router v7 (Frontend)

Single Page App com Server-Side Rendering via Cloudflare Workers.

**Padrões:**
- `loader()` para data fetching server-side
- `action()` para mutations
- Streaming via Vercel AI SDK `useChat()` hook
- Client-side routing para navegação instantânea

**Routes:**
```
/                       → Landing page
/auth/sign-in          → Login
/auth/sign-up          → Registro
/onboarding/*          → Wizard 5 passos
/dashboard             → Overview (stats, atividade)
/dashboard/agents      → Lista de agentes
/dashboard/agents/:id  → Editor de agente (SOUL.md, config)
/dashboard/chat        → Conversas (split view)
/dashboard/chat/:id    → Thread individual
/dashboard/knowledge   → Upload e gestão de docs
/dashboard/workflows   → Lista de workflows
/dashboard/workflows/:id → Editor de workflow
/dashboard/automations → Cron jobs
/dashboard/channels    → Status dos canais
/dashboard/analytics   → Métricas de uso
/dashboard/settings    → Org, billing
/dashboard/settings/members    → RBAC, convites
/dashboard/settings/api-keys   → API keys
/admin                 → Super-admin (tenants)
```

### 3. Hono API Server

API REST para o frontend e integrações externas.

**Endpoints:**
```
POST   /api/agents              → Criar agente
GET    /api/agents              → Listar agentes
GET    /api/agents/:id          → Detalhe do agente
PUT    /api/agents/:id          → Atualizar agente
DELETE /api/agents/:id          → Deletar agente

POST   /api/chat                → Enviar mensagem (streaming)
GET    /api/conversations       → Listar conversas
GET    /api/conversations/:id   → Mensagens da conversa

POST   /api/knowledge/upload    → Upload de documento
GET    /api/knowledge           → Listar documentos
POST   /api/knowledge/search    → Busca vetorial

POST   /api/workflows           → Criar workflow
GET    /api/workflows           → Listar workflows
PUT    /api/workflows/:id       → Atualizar workflow

POST   /api/channels/whatsapp/connect   → Iniciar sessão WhatsApp
POST   /api/channels/teams/connect      → Configurar bot Teams
GET    /api/channels                    → Status dos canais

POST   /api/automations         → Criar cron job
GET    /api/automations         → Listar automações

GET    /api/analytics           → Métricas de uso

# Webhooks (recebidos de serviços externos)
POST   /api/webhooks/evolution  → Mensagens do WhatsApp
POST   /api/webhooks/teams      → Mensagens do Teams
```

### 4. Middleware Stack

```typescript
// Ordem de execução:
1. CORS
2. CSRF Protection
3. Rate Limiting (por IP + por tenant)
4. Auth (Better Auth session validation)
5. Tenant Resolution (extrair tenant do user → carregar D1 binding)
6. RBAC (verificar role para a rota)
7. Request Logging (Analytics Engine)
```

### 5. Service Layer

#### AI Gateway Client (`services/ai-gateway.ts`)
- Proxy para Cloudflare AI Gateway
- Suporta múltiplos provedores (OpenAI, Anthropic, Google, Workers AI)
- Configuração de modelo por agente
- Caching automático de respostas idênticas

#### Memory Engine (`services/memory-engine.ts`)
Orquestra as 3 camadas de memória:

```
┌─────────────────────────────────────────────┐
│              Memory Engine                   │
│                                             │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐ │
│  │ Session   │  │ Structured│  │ Vectorial│ │
│  │ Compactor │  │ Facts (D1)│  │ (Vect.)  │ │
│  │           │  │           │  │          │ │
│  │ Resumo da │  │ "Cliente  │  │ Busca em │ │
│  │ conversa  │  │  prefere  │  │ docs por │ │
│  │ anterior  │  │  email"   │  │ semântica│ │
│  └──────────┘  └───────────┘  └──────────┘ │
│                                             │
│  Prioridade: Compaction → Facts → RAG       │
└─────────────────────────────────────────────┘
```

**Fluxo por mensagem:**
1. Carregar compaction summary da conversa atual
2. Buscar facts relevantes do agente (por categoria)
3. Fazer busca vetorial nos documentos do tenant
4. Montar context window: system prompt + SOUL.md + memory + user message
5. Enviar ao AI Gateway
6. Após resposta, extrair novos facts (se houver)
7. Se conversa longa, rodar compaction

#### Evolution API Client (`services/evolution-api.ts`)
- REST client para Evolution API self-hosted
- Gerencia instâncias WhatsApp por tenant
- Recebe webhooks de mensagens recebidas
- Envia mensagens (texto, imagem, documento, áudio)
- Health check e auto-reconnect

#### Workflow Engine (`services/workflow-engine.ts`)
- Parseia workflows YAML/JSON
- Executa steps sequencialmente
- Suporta triggers: message.received, cron, webhook, manual
- Actions: buscar knowledge, responder, notificar, chamar API

#### Tenant Provisioner (`services/tenant-provisioner.ts`)
- Cria novo D1 database via Cloudflare API
- Aplica migrações iniciais
- Registra no D1 Master (registry)
- Gerencia schema versioning

### 6. Cron Worker (`workers/cron-runner.ts`)

Worker separado com `scheduled` handler do Cloudflare.

```
Trigger (cada minuto) → Consultar D1 Master → Para cada tenant:
  → Buscar automações com next_run <= now
  → Executar ação (via Service Layer)
  → Atualizar last_run e next_run
```

## Tenant Isolation

### Modelo de Isolamento

```
                    ┌──────────────┐
                    │  D1 Master   │
                    │  (registry)  │
                    │              │
                    │ tenants[]    │
                    └──────┬───────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
     ┌──────┴───┐   ┌─────┴────┐   ┌─────┴────┐
     │ D1       │   │ D1       │   │ D1       │
     │ Tenant A │   │ Tenant B │   │ Tenant C │
     │          │   │          │   │          │
     │ agents   │   │ agents   │   │ agents   │
     │ messages │   │ messages │   │ messages │
     │ docs     │   │ docs     │   │ docs     │
     └──────────┘   └──────────┘   └──────────┘
```

**Como funciona:**
1. User faz login → session contém `tenantId`
2. Middleware resolve `tenantId` → busca `d1_database_id` no Master
3. Cria binding dinâmico para o D1 do tenant
4. Todas as queries dali em diante vão para o D1 correto

**Limitações D1:**
- 10GB por banco (suficiente para < 50 tenants inicialmente)
- Archiving de conversas antigas → R2 (bulk export)

### R2 (Storage)

Cada tenant tem um prefixo isolado no mesmo bucket R2:

```
gabios-storage/
├── tenant-a/
│   ├── documents/
│   │   ├── doc-001.pdf
│   │   └── doc-002.docx
│   └── exports/
│       └── conversations-2026-01.json
├── tenant-b/
│   └── documents/
│       └── doc-001.pdf
```

### Vectorize

Um index Vectorize por tenant:

```
gabios-vectors-{tenant-id}
```

Cada vetor contém metadata: `{ docId, chunkIndex, text }`

## Fluxo de Mensagem (WhatsApp)

```
1. Usuário envia msg no WhatsApp
2. Evolution API recebe → POST /api/webhooks/evolution
3. Webhook handler:
   a. Identifica tenant pelo número do WhatsApp
   b. Identifica ou cria conversa
   c. Salva mensagem no D1
   d. Roteia para agente vinculado ao canal
4. Agent Runner:
   a. Monta context: SOUL.md + skills + memória + histórico
   b. Chama AI Gateway (streaming)
   c. Salva resposta no D1
   d. Envia resposta via Evolution API
5. Pós-processamento:
   a. Extrai facts (se configurado)
   b. Atualiza conversation.last_message_at
   c. Verifica triggers de workflow
   d. Loga métricas no Analytics Engine
```

## Fluxo de Chat Web

```
1. Usuário abre /dashboard/chat
2. React: useChat() do Vercel AI SDK
3. POST /api/chat (streaming)
4. Server:
   a. Auth + tenant check
   b. Monta context (memory engine)
   c. AI Gateway call (streaming)
   d. Stream tokens via SSE
5. Client: renderiza tokens em tempo real
6. Ao finalizar: salva mensagem completa no D1
```

## Autenticação e Autorização

### Better Auth Config

```
Plugins:
- admin()         → Super-admin para gestão de tenants
- organization()  → Multi-org (cada tenant = 1 org)
- apiKey()        → API keys para integrações
- agentAuth()     → Identidade para agentes AI (futuro v2)

Custom fields:
- user.role       → "owner" | "admin" | "member"
- user.tenantId   → FK para D1 Master
```

### RBAC Matrix

| Recurso | Owner | Admin | Member |
|---|:---:|:---:|:---:|
| Ver dashboard | ✓ | ✓ | ✓ |
| Usar chat | ✓ | ✓ | ✓ |
| Criar agente | ✓ | ✓ | ✗ |
| Editar agente | ✓ | ✓ | ✗ |
| Configurar canais | ✓ | ✓ | ✗ |
| Gerenciar workflows | ✓ | ✓ | ✗ |
| Upload documentos | ✓ | ✓ | ✗ |
| Ver analytics | ✓ | ✓ | ✗ |
| Gerenciar membros | ✓ | ✗ | ✗ |
| Billing | ✓ | ✗ | ✗ |
| API keys | ✓ | ✗ | ✗ |

## Observability

### Métricas (Analytics Engine)

```typescript
// Eventos rastreados:
{
  "message.sent": { tenantId, agentId, channel, tokenCount },
  "message.received": { tenantId, agentId, channel },
  "ai.request": { tenantId, provider, model, latencyMs, tokenCount, cached },
  "workflow.executed": { tenantId, workflowId, success, durationMs },
  "channel.status": { tenantId, channel, status },
  "error": { tenantId, service, error, stack }
}
```

### Error Tracking (Sentry)

- Captura exceções não-tratadas no Worker
- Source maps para stack traces legíveis
- Alertas para erros críticos (canal offline, AI timeout)

### Health Check

```
GET /api/health → {
  status: "ok",
  version: "1.0.0",
  services: {
    d1: "ok",
    r2: "ok",
    vectorize: "ok",
    aiGateway: "ok",
    evolutionApi: "ok" | "degraded" | "down"
  }
}
```

## Segurança

Ver [SECURITY.md](./SECURITY.md) para detalhes completos.

## Dependências Externas

| Serviço | Propósito | Custo |
|---|---|---|
| Cloudflare Workers | Compute | Pay-per-use (generous free tier) |
| Cloudflare D1 | Database | $0.75/mi reads, $1.00/mi writes |
| Cloudflare R2 | File storage | $0.015/GB/mês |
| Cloudflare Vectorize | Embeddings | $0.01/mi queries |
| Cloudflare AI Gateway | LLM proxy | Free (pay for LLM usage) |
| Evolution API | WhatsApp | Self-hosted (free) |
| Sentry | Error tracking | Free tier |
| LLM Provider | AI responses | Pay-per-token (varies) |
