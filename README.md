# GabiOS

> Plataforma SaaS de agentes AI na nuvem. Crie, configure e conecte agentes inteligentes aos canais que seus clientes já usam.

## O que é

GabiOS é um "sistema operacional" cloud para agentes AI. Inspirado no [OpenClaw](https://github.com/openclaw/openclaw), adaptado para rodar inteiramente na nuvem como SaaS multi-tenant.

**Gabi** é o runtime/OS invisível — os clientes criam seus próprios agentes com identidades, personalidades e habilidades personalizadas.

## Para quem

- Freelancers e autônomos que querem um assistente AI
- Equipes e PMEs que precisam de automação inteligente
- Escritórios de advocacia, contabilidade, atendimento
- Qualquer vertical que se beneficie de agentes AI conectados a WhatsApp, Teams e Web

## Stack

| Componente | Tecnologia |
|---|---|
| Frontend | React Router v7 |
| Backend | Cloudflare Workers + Hono |
| Database | D1 (isolado por tenant) |
| Storage | R2 |
| Vetorização | Vectorize |
| AI | Cloudflare AI Gateway + Vercel AI SDK |
| Auth | Better Auth (Admin + Org + API Key + Agent Auth) |
| WhatsApp | Evolution API |
| Teams | MS Teams Bot Framework |

## Documentação

- [DESIGN.md](./DESIGN.md) — Documento de design e decisões
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Arquitetura técnica detalhada
- [SECURITY.md](./SECURITY.md) — Modelo de segurança
- [CODEBASE.md](./CODEBASE.md) — Guia do codebase
- [VISION.md](./VISION.md) — Visão do produto

## Desenvolvimento

```bash
# Pré-requisitos
node >= 22
pnpm >= 9

# Setup
pnpm install
pnpm dev

# Deploy
pnpm deploy
```

## Licença

Proprietário — todos os direitos reservados.
