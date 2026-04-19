# GabiOS — Plano de Desenvolvimento

## SDLC (Software Development Lifecycle)

### Metodologia

**Kanban contínuo** com sprints de 1 semana para review/retro.

```
Backlog → In Progress → Review → Testing → Done → Deployed
```

### Ambientes

| Ambiente | Branch | URL | Propósito |
|---|---|---|---|
| **Local** | qualquer | `localhost:5173` | Desenvolvimento |
| **Preview** | PR branches | `pr-{n}.gabios.pages.dev` | Review de PRs |
| **Staging** | `staging` | `staging.gabios.ai` | Teste integrado |
| **Produção** | `main` | `app.gabios.ai` | Produção |

### Fluxo de Trabalho

```
1. Criar issue no GitHub (feature/bug/task)
2. Criar branch: feat/GOS-{issue}-descricao ou fix/GOS-{issue}-descricao
3. Desenvolver localmente com `pnpm dev`
4. Escrever testes (unit + integration)
5. Commit com Conventional Commits
6. Push → CI roda automaticamente
7. Abrir PR → Preview deploy automático
8. Code review + aprovação
9. Merge to main → Deploy automático para staging
10. Smoke test em staging
11. Tag release → Deploy para produção
```

---

## SSDLC (Secure Software Development Lifecycle)

### Fase 1 — Planejamento

- [ ] Threat modeling para cada feature (STRIDE)
- [ ] Definir requisitos de segurança no issue
- [ ] Revisar dependências antes de adicionar

### Fase 2 — Desenvolvimento

- [ ] Validação de input com Zod em todo endpoint
- [ ] Parameterized queries (Drizzle ORM — já previne SQL injection)
- [ ] Secrets via environment variables (nunca hardcoded)
- [ ] Sanitização de HTML/XSS em inputs de texto
- [ ] RBAC check em toda rota

### Fase 3 — Build & CI

```yaml
# .github/workflows/ci.yml
Pipeline de CI:
  1. Install dependencies (pnpm install --frozen-lockfile)
  2. Type check (tsc --noEmit)
  3. Lint (eslint + prettier)
  4. Unit tests (vitest)
  5. Security audit (pnpm audit)
  6. SAST scan (semgrep)
  7. Dependency check (snyk/npm audit)
  8. Build (react-router build)
  9. Integration tests (vitest + miniflare)
```

### Fase 4 — Teste

| Tipo | Ferramenta | Cobertura |
|---|---|---|
| Unit | Vitest | Services, utils, validators |
| Integration | Vitest + Miniflare | API endpoints, DB queries |
| E2E | Playwright | Fluxos críticos (onboarding, chat) |
| Security | Semgrep + pnpm audit | SAST + dependency vulns |
| Load | k6 (futuro) | Performance sob carga |

### Fase 5 — Deploy

- [ ] Preview deploy em cada PR (Cloudflare Pages)
- [ ] Staging automático no merge para `main`
- [ ] Produção manual via tag release
- [ ] Rollback instantâneo (Cloudflare permite reverter deploys)

### Fase 6 — Monitoramento

- [ ] Sentry para error tracking
- [ ] Analytics Engine para métricas de negócio
- [ ] Logpush para logs de acesso
- [ ] Alertas: canal offline, error rate > 1%, latência > 5s

### Checklist de Segurança por PR

```markdown
## Security Checklist
- [ ] Input validation com Zod
- [ ] RBAC check na rota
- [ ] Sem secrets hardcoded
- [ ] Queries via Drizzle (parameterized)
- [ ] Sanitização de user input
- [ ] Teste de caso de erro/edge case
- [ ] Sem dados de tenant leaking
```

---

## GitHub Setup

### Repositório

```
github.com/antigravity/gabios (privado)
```

### Branch Strategy

```
main (produção)
  └── staging (pré-produção)
       └── feat/GOS-123-descricao (feature branches)
       └── fix/GOS-456-descricao (bugfix branches)
       └── chore/GOS-789-descricao (manutenção)
```

### Branch Protection Rules

**`main`:**
- Require PR review (1 aprovação)
- Require status checks (CI green)
- Require linear history (squash merge)
- No force push
- No direct commits

**`staging`:**
- Require status checks (CI green)
- Allow squash merge from feature branches

### Labels

| Label | Cor | Uso |
|---|---|---|
| `feature` | 🟢 | Nova funcionalidade |
| `bug` | 🔴 | Correção de bug |
| `security` | 🟡 | Issue de segurança |
| `chore` | ⚪ | Manutenção, deps, configs |
| `docs` | 🔵 | Documentação |
| `priority: high` | 🔴 | Urgente |
| `priority: medium` | 🟡 | Normal |
| `priority: low` | 🟢 | Pode esperar |
| `v1.0` | 🟣 | Milestone MVP |
| `v1.1` | 🟣 | Milestone Multi-agent |
| `v1.2` | 🟣 | Milestone Workflows |

### Conventional Commits

```
feat: add agent SOUL.md editor
fix: prevent cross-tenant data access in memory facts
chore: update drizzle-orm to 0.35
docs: add AGENTS.md with agentic model
test: add integration tests for chat streaming
security: add rate limiting to /api/chat
```

### Issue Templates

#### Feature Request
```markdown
## Descrição
[O que precisa ser construído]

## Motivação
[Por que isso é necessário]

## Critérios de Aceite
- [ ] ...
- [ ] ...

## Security Considerations
[Alguma implicação de segurança?]

## Milestone
v1.0 / v1.1 / v1.2 / v2
```

#### Bug Report
```markdown
## Descrição
[O que está errado]

## Passos para Reproduzir
1. ...
2. ...

## Comportamento Esperado
[O que deveria acontecer]

## Comportamento Atual
[O que acontece]

## Ambiente
- Tenant: ...
- Browser: ...
- Canal: ...
```

### PR Template
```markdown
## O que mudou
[Resumo das alterações]

## Tipo
- [ ] Feature
- [ ] Bug fix
- [ ] Chore
- [ ] Security

## Testes
- [ ] Unit tests adicionados/atualizados
- [ ] Integration tests adicionados/atualizados
- [ ] Testado manualmente

## Security Checklist
- [ ] Input validation com Zod
- [ ] RBAC check na rota
- [ ] Sem secrets hardcoded
- [ ] Sem dados de tenant leaking

## Screenshots
[Se aplicável]

## Issue
Closes #...
```

---

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main, staging]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test:unit
      - run: pnpm test:integration
      
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm audit --audit-level=high
      - uses: returntocorp/semgrep-action@v1
        with:
          config: p/typescript p/owasp-top-ten
  
  build:
    needs: [quality, security]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      
  preview:
    if: github.event_name == 'pull_request'
    needs: [build]
    runs-on: ubuntu-latest
    steps:
      - uses: cloudflare/wrangler-action@v3
        with:
          command: pages deploy ./build --project-name=gabios --branch=${{ github.head_ref }}
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}

  deploy-staging:
    if: github.ref == 'refs/heads/main'
    needs: [build]
    runs-on: ubuntu-latest
    steps:
      - uses: cloudflare/wrangler-action@v3
        with:
          command: deploy --env staging
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags: ['v*']

jobs:
  deploy-production:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      
      - uses: cloudflare/wrangler-action@v3
        with:
          command: deploy --env production
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          generate_release_notes: true
```

---

## Deploy na Cloudflare

### Infraestrutura

```yaml
# wrangler.jsonc
{
  "name": "gabios",
  "compatibility_date": "2025-01-01",
  "main": "workers/app.ts",
  
  // Ambientes
  "env": {
    "staging": {
      "name": "gabios-staging",
      "routes": [{ "pattern": "staging.gabios.ai/*" }],
      "vars": { "ENVIRONMENT": "staging" }
    },
    "production": {
      "name": "gabios-production", 
      "routes": [{ "pattern": "app.gabios.ai/*" }],
      "vars": { "ENVIRONMENT": "production" }
    }
  },
  
  // Bindings
  "d1_databases": [
    { "binding": "DB_MASTER", "database_name": "gabios-master", "database_id": "..." }
  ],
  "r2_buckets": [
    { "binding": "R2_STORAGE", "bucket_name": "gabios-storage" }
  ],
  "vectorize": [
    { "binding": "VECTORIZE", "index_name": "gabios-vectors" }
  ],
  "ai": {
    "binding": "AI"
  },
  
  // Cron
  "triggers": {
    "crons": ["* * * * *"]  // A cada minuto
  }
}
```

### Secrets (via Wrangler)

```bash
# Auth
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put BETTER_AUTH_URL

# AI
wrangler secret put OPENAI_API_KEY
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put AI_GATEWAY_ENDPOINT

# Evolution API
wrangler secret put EVOLUTION_API_URL
wrangler secret put EVOLUTION_API_KEY

# Error tracking
wrangler secret put SENTRY_DSN

# Cloudflare API (para tenant provisioning)
wrangler secret put CLOUDFLARE_ACCOUNT_ID
wrangler secret put CLOUDFLARE_API_TOKEN
```

### DNS Setup

```
gabios.ai          → Landing page (Cloudflare Pages)
app.gabios.ai      → Main Worker (produção)
staging.gabios.ai  → Main Worker (staging)
api.gabios.ai      → CNAME para app.gabios.ai (futuro)
```

### Deploy Checklist (Primeiro Deploy)

```bash
# 1. Criar D1 Master
wrangler d1 create gabios-master

# 2. Criar R2 Bucket
wrangler r2 bucket create gabios-storage

# 3. Criar Vectorize Index
wrangler vectorize create gabios-vectors --dimensions=1536 --metric=cosine

# 4. Configurar secrets
wrangler secret put BETTER_AUTH_SECRET
# ... (todos os secrets acima)

# 5. Rodar migrações do Master
wrangler d1 execute gabios-master --file=db/migrations/master/001_init.sql

# 6. Deploy staging
wrangler deploy --env staging

# 7. Smoke test staging
curl https://staging.gabios.ai/api/health

# 8. Deploy produção
wrangler deploy --env production
```

---

## Scripts npm

```json
{
  "scripts": {
    "dev": "react-router dev",
    "build": "react-router build",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . && prettier --check .",
    "lint:fix": "eslint --fix . && prettier --write .",
    "test:unit": "vitest run --dir tests/unit",
    "test:integration": "vitest run --dir tests/integration",
    "test:e2e": "playwright test",
    "test": "vitest run",
    "db:generate": "drizzle-kit generate",
    "db:migrate:master": "wrangler d1 execute gabios-master --file=db/migrations/master/latest.sql",
    "db:migrate:tenant": "tsx scripts/migrate-all.ts",
    "tenant:create": "tsx scripts/provision-tenant.ts",
    "deploy:staging": "wrangler deploy --env staging",
    "deploy:production": "wrangler deploy --env production"
  }
}
```

---

## Milestones e Cronograma

### V1.0 — MVP (Semanas 1-4)

| Semana | Entregas |
|---|---|
| **S1** | Scaffold (React Router + CF Workers), Better Auth, D1 Master schema, Landing page |
| **S2** | Dashboard layout (sidebar + header + ⌘K), Onboarding wizard, Agent CRUD |
| **S3** | Chat web (Vercel AI SDK streaming), AI Gateway, Session compaction |
| **S4** | Analytics dashboard, Health check, CI/CD completo, Deploy staging + prod |

### V1.1 — Multi-agent + WhatsApp (Semanas 5-6)

| Semana | Entregas |
|---|---|
| **S5** | Multi-agente, SOUL.md templates, Evolution API integration |
| **S6** | RAG pipeline (upload → R2 → Vectorize → search), Webhook handler |

### V1.2 — Teams + Workflows (Semanas 7-8)

| Semana | Entregas |
|---|---|
| **S7** | MS Teams bot, Structured memory facts, API Keys |
| **S8** | Workflow engine (YAML), Cron worker, Automações UI |
