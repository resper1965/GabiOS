# GabiOS — Modelo de Segurança

## Princípios

1. **Isolamento por padrão** — cada tenant tem seu próprio banco de dados
2. **Mínimo privilégio** — RBAC com 3 papéis (owner/admin/member)
3. **Defense in depth** — múltiplas camadas de proteção
4. **Transparência** — audit log de todas as ações administrativas

## Camadas de Segurança

### 1. Autenticação

**Better Auth** gerencia sessões e identidade:

- **Sessions**: Cookies HTTP-only, Secure, SameSite=Lax
- **Password hashing**: bcrypt (cost factor 12)
- **Session expiry**: 7 dias (configurable)
- **CSRF protection**: Token-based, validado em toda mutation

**Métodos de login:**
- Email + password (v1.0)
- Magic link via email (v1.1)
- OAuth (Google, GitHub) (v2)

### 2. Autorização (RBAC)

3 papéis hierárquicos:

```
Owner → Admin → Member

Owner: controle total (billing, membros, API keys, tudo)
Admin: gestão operacional (agentes, canais, workflows, docs)
Member: uso apenas (chat, ver dashboard)
```

**Enforcement:**
- Middleware RBAC em toda rota de API
- Server-side check em loaders/actions do React Router
- Client-side: itens de UI ocultados por role (não confiável sozinho)

### 3. Isolamento de Tenant

**Database:**
- Cada tenant = 1 banco D1 separado
- Impossível cross-tenant query por design
- Middleware resolve tenant antes de qualquer operação

**Storage (R2):**
- Prefixo por tenant: `tenant-{id}/`
- Validação de prefixo em todo upload/download
- Signed URLs com expiração para downloads

**Vetorização (Vectorize):**
- Index separado por tenant
- Queries sempre scoped ao index do tenant

### 4. API Security

**Rate Limiting:**
- Por IP: 100 req/min (global)
- Por tenant: 1000 req/min (authenticated)
- Por endpoint: limites específicos para `/api/chat` (30 req/min)

**Input Validation:**
- Zod schemas em todos os endpoints
- Sanitização de HTML/XSS em inputs de texto
- Limite de payload: 10MB (uploads: 50MB)

**API Keys:**
- Geradas via Better Auth API Key plugin
- Scoped por tenant
- Revogáveis a qualquer momento
- Hash armazenado, nunca o valor raw

### 5. Segurança de Dados

**Em trânsito:**
- TLS 1.3 (enforced pelo Cloudflare)
- HSTS headers
- Certificate pinning (não aplicável — Cloudflare gerencia)

**Em repouso:**
- D1: encryption at rest (gerenciado pelo Cloudflare)
- R2: encryption at rest (AES-256)
- Vectorize: encryption at rest

**Dados sensíveis:**
- API keys de LLM: armazenadas encrypted no D1
- Tokens de sessão WhatsApp: armazenados na Evolution API
- Secrets de webhook: hash + comparação timing-safe

### 6. Segurança do WhatsApp (Evolution API)

- Evolution API rodando em container isolado
- Comunicação via HTTPS (não HTTP)
- Webhook secret para validar origem das mensagens
- Rate limiting de mensagens enviadas (anti-spam)
- Não armazena mídia localmente — redirect para R2

### 7. Headers de Segurança

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0 (CSP é mais efetivo)
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' wss:;
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### 8. Audit Log

Todas as ações administrativas são logadas:

```sql
audit_logs (
  id, actor_id, action, target_type, target_id, metadata, created_at
)
```

**Ações logadas:**
- Criar/editar/deletar agente
- Conectar/desconectar canal
- Criar/editar/deletar workflow
- Adicionar/remover membro
- Alterar role de membro
- Gerar/revogar API key
- Upload/delete documento
- Alterações de billing

### 9. AI Safety

**Prompt injection defense:**
- System prompts são injetados server-side (nunca pelo client)
- SOUL.md é sanitizado antes de injeção
- Separação clara entre system prompt, user message e context

**Data leakage prevention:**
- Agentes de um tenant nunca têm acesso a dados de outro tenant
- Context window é montado exclusivamente com dados do tenant
- Logs de AI requests não contêm conteúdo das mensagens (apenas metadata)

**Content moderation:**
- Configurável por tenant: filtro de conteúdo on/off
- AI Gateway pode aplicar content policies
- Alertas para detecção de conteúdo sensível (PII, dados financeiros)

## Incident Response

1. **Detecção**: Sentry alertas + Analytics Engine anomalias
2. **Contenção**: Suspender tenant ou desconectar canal afetado
3. **Investigação**: Audit logs + request logs (Logpush)
4. **Resolução**: Fix + deploy + post-mortem
5. **Comunicação**: Notificar tenants afetados

## Compliance

| Framework | Status |
|---|---|
| LGPD | Dados isolados por tenant, deletion on request |
| SOC 2 | Via Cloudflare (infraestrutura) |
| ISO 27001 | Via Cloudflare (infraestrutura) |
| PCI DSS | Não aplicável (não processa cartões) |

## Vulnerabilidades Conhecidas e Aceitas

1. **Evolution API (Baileys)** — WhatsApp não-oficial; risco de ban pela Meta
2. **Shared R2 bucket** — isolamento por prefixo (não por bucket). Risco mitigado por validação server-side
3. **Cloudflare dependency** — vendor lock-in. Mitigação: abstrações nos services

## Reporting

Para reportar vulnerabilidades de segurança, envie email para: security@gabios.ai
