# GabiOS — Modelo de Agentes

## Visão Geral

No GabiOS, agentes são **entidades agênticas e orquestradas**. Isso significa que:

1. **Agênticos** — possuem autonomia para usar ferramentas, tomar decisões e executar múltiplos passos para completar uma tarefa
2. **Orquestrados** — o GabiOS (runtime "Gabi") coordena a execução, gerencia contexto, e roteia mensagens entre agentes

## Agent Loop (Ciclo Agêntico)

Inspirado no OpenClaw Agent Loop, adaptado para cloud:

```
                    ┌─────────────────────┐
                    │   Mensagem Recebida  │
                    │   (WhatsApp/Web/     │
                    │    Teams)            │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Router (Gabi OS)   │
                    │   Identifica agente  │
                    │   destino            │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Context Builder    │
                    │                      │
                    │  1. System prompt    │
                    │  2. SOUL.md          │
                    │  3. Skills ativos    │
                    │  4. Session compact  │
                    │  5. Memory facts     │
                    │  6. RAG context      │
                    │  7. Tool definitions │
                    │  8. Histórico recente│
                    └──────────┬──────────┘
                               │
              ┌────────────────▼────────────────┐
              │         Agent Loop               │
              │                                  │
              │  ┌───────────┐                   │
              │  │ LLM Call  │◄──────────────┐   │
              │  └─────┬─────┘               │   │
              │        │                     │   │
              │   ┌────▼────┐           ┌────┴───┐
              │   │ Resposta│           │ Tool   │
              │   │ final?  │──  Não ──►│ Call   │
              │   └────┬────┘           └────┬───┘
              │        │ Sim                 │
              │        │              ┌──────▼──────┐
              │        │              │ Tool        │
              │        │              │ Executor    │
              │        │              │             │
              │        │              │ - search_kb │
              │        │              │ - send_email│
              │        │              │ - call_api  │
              │        │              │ - query_db  │
              │        │              └──────┬──────┘
              │        │                     │
              │        │              Tool result
              │        │              added to context
              │        │                     │
              │        │                     └────────┘
              └────────┼─────────────────────────────┘
                       │
              ┌────────▼────────┐
              │  Post-process   │
              │                 │
              │  - Save message │
              │  - Extract facts│
              │  - Run compactn │
              │  - Check wkflows│
              │  - Log metrics  │
              └─────────────────┘
```

## Anatomia de um Agente

```typescript
interface Agent {
  id: string;
  name: string;           // "Assistente Jurídico"
  soulMd: string;         // Personalidade e instruções
  
  // Modelo AI
  modelProvider: "openai" | "anthropic" | "google" | "workers-ai";
  modelId: string;        // "gpt-4o", "claude-sonnet-4-20250514", etc.
  temperature: number;
  maxTokens: number;
  
  // Tools habilitados
  tools: AgentTool[];
  
  // Skills (instruções extras)
  skills: AgentSkill[];
  
  // Canal vinculado
  channels: Channel[];
  
  // Configurações
  status: "active" | "paused" | "draft";
  maxLoopIterations: number;  // Limite de tool calls por mensagem (default: 10)
  thinkingEnabled: boolean;   // Extended thinking (se o modelo suportar)
}
```

## Tools (Ferramentas)

Os agentes podem usar ferramentas para agir no mundo. Cada tool é definido pelo Vercel AI SDK `tool()`:

### V1.0 — Tools Core

| Tool | Descrição | Exemplo de uso |
|---|---|---|
| `search_knowledge` | Busca vetorial nos documentos do tenant | "O que diz o contrato sobre rescisão?" |
| `get_facts` | Consulta memory facts structured | "Qual o email do cliente João?" |
| `save_fact` | Salva um fato na memória | Após extrair info da conversa |

### V1.1 — Tools de Ação

| Tool | Descrição | Exemplo de uso |
|---|---|---|
| `send_message` | Envia mensagem em outro canal | Notificar admin via Teams |
| `create_document` | Gera documento (texto) | Minuta de contrato |
| `search_web` | Pesquisa na internet | Buscar jurisprudência |
| `send_email` | Envia email | Confirmar agendamento |

### V1.2 — Tools de Integração

| Tool | Descrição | Exemplo de uso |
|---|---|---|
| `call_api` | Chama API externa configurada | Consultar sistema jurídico |
| `run_workflow` | Executa workflow por nome | Trigger manual de automação |
| `schedule_task` | Agenda tarefa futura | "Me lembre em 3 dias" |

### V2 — Tools Avançados

| Tool | Descrição |
|---|---|
| `browse_web` | Navegar e extrair dados de páginas web |
| `execute_code` | Executar código sandboxed |
| `delegate_to_agent` | Encaminhar para outro agente |

## Multi-Agent Routing

Quando há múltiplos agentes num tenant, o GabiOS precisa decidir qual agente responde:

### Estratégia 1 — Canal-based (V1)
Cada canal está vinculado a um agente. Simples e previsível.

```
WhatsApp número 1 → Agente "Atendimento"
WhatsApp número 2 → Agente "Jurídico"  
Teams → Agente "Interno"
WebChat → Agente "Geral"
```

### Estratégia 2 — Intent-based (V2)
Um agente "router" analisa a mensagem e encaminha para o agente especializado:

```
Mensagem → Router Agent → Classifica intent → Encaminha:
  - "Quero marcar consulta" → Agente Agendamento
  - "Preciso de uma minuta" → Agente Jurídico
  - "Qual o status do processo?" → Agente Consultas
```

### Estratégia 3 — Delegation (V2)
Agentes podem delegar entre si via `delegate_to_agent` tool:

```
Agente Atendimento recebe: "Preciso cancelar contrato"
  → Usa tool: delegate_to_agent("Agente Jurídico", context)
  → Agente Jurídico responde com orientação
  → Retorna ao Atendimento para comunicar ao cliente
```

## SOUL.md (Personalidade)

Cada agente tem um SOUL.md que define sua personalidade, regras e conhecimento base:

```markdown
# Dr. Silva - Assistente Jurídico

## Personalidade
Você é o Dr. Silva, um assistente jurídico especializado em direito 
trabalhista. Seja profissional, preciso e empático. Use linguagem 
acessível, evitando jargão jurídico desnecessário.

## Regras
- NUNCA forneça parecer jurídico definitivo — sempre recomende 
  consultar um advogado
- Cite artigos da CLT quando relevante
- Quando não souber, diga "Não tenho certeza, vou verificar"
- Mantenha confidencialidade absoluta sobre dados de clientes

## Conhecimento
- Especializado em CLT, convenções coletivas e jurisprudência TST
- Pode consultar a base de documentos do escritório
- Sabe calcular prazos processuais

## Tom de voz
- Formal mas acessível
- Empático com clientes em situação de conflito
- Objetivo e direto nas orientações
```

## Skills (Instruções Extras)

Skills são instruções adicionais que podem ser ativadas/desativadas por agente:

```typescript
interface AgentSkill {
  id: string;
  name: string;           // "Cálculo de Prazos"
  instruction: string;    // Prompt instruction
  enabled: boolean;
  priority: number;       // Ordem de injeção no context
}
```

**Exemplo de skill:**
```
Nome: Cálculo de Prazos Processuais
Instrução: Quando o usuário perguntar sobre prazos, use a seguinte 
tabela de referência:
- Recurso Ordinário: 8 dias úteis
- Agravo de Instrumento: 8 dias úteis  
- Embargos de Declaração: 5 dias úteis
- Recurso de Revista: 8 dias úteis
Sempre confirme o tipo de ação e a data de intimação antes de calcular.
```

## Memory Model

### Fluxo de Memória por Mensagem

```
Mensagem recebida
       │
       ▼
┌──────────────────────────────────────────┐
│ 1. Session Compaction (sempre)           │
│    Carrega resumo das conversas          │
│    anteriores deste contato              │
│    Tokens: ~200-500                      │
├──────────────────────────────────────────┤
│ 2. Structured Facts (se existirem)       │
│    Busca facts do agente por categoria   │
│    Ex: preferências, dados do cliente    │
│    Tokens: ~100-300                      │
├──────────────────────────────────────────┤
│ 3. RAG - Vectorize (se configurado)      │
│    Busca semântica nos documentos        │
│    Top 5 chunks mais relevantes          │
│    Tokens: ~500-2000                     │
├──────────────────────────────────────────┤
│ 4. Histórico recente (últimas N msgs)    │
│    Mensagens da conversa atual           │
│    Tokens: ~500-2000                     │
└──────────────────────────────────────────┘
       │
       ▼
  Context Window Total: ~1500-5000 tokens
  + System Prompt + SOUL.md + Skills + Tools
```

### Session Compaction

Quando a conversa ultrapassa um threshold (ex: 20 mensagens):

1. Envia histórico completo ao LLM com prompt: "Resuma esta conversa em um parágrafo"
2. Salva resumo no campo `conversations.summary`
3. Próxima mensagem: usa resumo em vez do histórico completo
4. Economiza tokens e mantém contexto relevante

### Fact Extraction

Após cada resposta do agente, um segundo LLM call (mais barato, ex: gpt-4o-mini) analisa:

```
"Da conversa acima, extraia fatos importantes sobre o usuário 
ou cliente. Retorne JSON: [{category, key, value}]"
```

Exemplo de facts extraídos:
```json
[
  {"category": "preference", "key": "contact_method", "value": "email"},
  {"category": "case", "key": "process_number", "value": "0001234-56.2025.5.02.0001"},
  {"category": "deadline", "key": "recurso_ordinario", "value": "2025-05-15"}
]
```

## Limites e Safety

| Parâmetro | Default | Configurável |
|---|---|---|
| Max tool calls por mensagem | 10 | Sim (1-25) |
| Max tokens por resposta | 4096 | Sim |
| Timeout por LLM call | 30s | Não |
| Max mensagens antes de compaction | 20 | Sim (10-50) |
| Max RAG chunks por query | 5 | Sim (1-10) |
| Fact extraction | Habilitado | Sim (on/off) |

## Diagrama de Componentes do Agent Runtime

```
┌─────────────────────────────────────────────────┐
│                Agent Runtime                     │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Router   │  │ Context  │  │ Agent Loop   │  │
│  │          │  │ Builder  │  │              │  │
│  │ Canal →  │  │ SOUL.md  │  │ LLM Call →   │  │
│  │ Agente   │  │ + Skills │  │ Tool Call →  │  │
│  │          │  │ + Memory │  │ LLM Call →   │  │
│  │          │  │ + RAG    │  │ Response     │  │
│  └──────────┘  └──────────┘  └──────────────┘  │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Tool     │  │ Memory   │  │ Post-        │  │
│  │ Executor │  │ Engine   │  │ Processor    │  │
│  │          │  │          │  │              │  │
│  │ search   │  │ compact  │  │ save msg     │  │
│  │ email    │  │ facts    │  │ extract facts│  │
│  │ api call │  │ RAG      │  │ check wkflow │  │
│  │ workflow │  │ history  │  │ log metrics  │  │
│  └──────────┘  └──────────┘  └──────────────┘  │
└─────────────────────────────────────────────────┘
```
