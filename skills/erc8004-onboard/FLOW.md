# ERC-8004 Onboard Skill — Flow Graph

## High-Level Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                        ONBOARD FLOW                             │
│                                                                 │
│   Validate ──► Generate ──► Fund ──► Register ──► Set ──► Read  │
│   Prereqs      Wallet       Agent    On-Chain     Meta   Back   │
│                                                                 │
│   Step 0       Step 1       Step 2   Step 3       Step 4 Step 5 │
└─────────────────────────────────────────────────────────────────┘
```

## Detailed Flow

```
                            ┌───────────┐
                            │   START   │
                            └─────┬─────┘
                                  │
                    ══════════════╪══════════════
                    ║   STEP 0: PREREQUISITES   ║
                    ══════════════╪══════════════
                                  │
                        ┌─────────▼─────────┐
                        │ FUNDER_PRIVATE_KEY │
                        │   set in .env?     │
                        └────┬──────────┬────┘
                          NO │          │ YES
                     ┌───────▼──┐       │
                     │ ✖ ERROR  │       │
                     │ Setup    │       │
                     │ .env     │       │
                     └──────────┘       │
                        ┌───────────────▼───────────────┐
                        │ agent-config.json exists?      │
                        │ (script dir or home dir)       │
                        └────┬─────────────────────┬────┘
                          NO │                     │ YES
                     ┌───────▼──┐                  │
                     │ ✖ ERROR  │                  │
                     │ Create   │                  │
                     │ config   │                  │
                     └──────────┘                  │
                        ┌──────────────────────────▼────┐
                        │ Config has name + platform?    │
                        └────┬─────────────────────┬────┘
                          NO │                     │ YES
                     ┌───────▼──┐                  │
                     │ ✖ ERROR  │                  │
                     │ Missing  │                  │
                     │ fields   │                  │
                     └──────────┘                  │
                        ┌──────────────────────────▼────┐
                        │ Funder balance ≥ 0.002 ETH?   │
                        └────┬─────────────────────┬────┘
                          NO │                     │ YES
                     ┌───────▼──┐                  │
                     │ ✖ ERROR  │                  │
                     │ Use      │                  │
                     │ faucet   │                  │
                     └──────────┘                  │
                                                   │
                    ═══════════════════╪════════════╧═══
                    ║  STEP 1: AGENT WALLET GENERATION ║
                    ═══════════════════╪════════════════
                                       │
                        ┌──────────────▼────────────┐
                        │ AGENT_PRIVATE_KEY in .env? │
                        └────┬─────────────────┬────┘
                          NO │                 │ YES
                             │          ┌──────▼──────┐
                             │          │ Load wallet │
                             │          │ from .env   │
                             │          └──────┬──────┘
                   ┌─────────▼─────────┐       │
                   │ createRandom()    │       │
                   │ Save key to .env  │       │
                   │ Save meta to      │       │
                   │ ~/.agent-wallet   │       │
                   └─────────┬─────────┘       │
                             └───────┬─────────┘
                                     │
                    ═════════════╪════╧═════════
                    ║  STEP 2: FUND AGENT WALLET  ║
                    ═════════════╪═════════════════
                                 │
                        ┌────────▼──────────────┐
                        │ Agent balance          │
                        │ ≥ 0.001 ETH?           │
                        └────┬─────────────┬────┘
                          NO │             │ YES
                             │      ┌──────▼──────┐
                             │      │ Skip        │
                             │      │ (idempotent)│
                             │      └──────┬──────┘
                   ┌─────────▼─────────┐   │
                   │ Funder sends      │   │
                   │ 0.002 ETH to      │   │
                   │ agent wallet      │   │
                   │ → Wait for tx     │   │
                   └─────────┬─────────┘   │
                             └──────┬──────┘
                                    │
                    ════════════╪════╧══════════
                    ║  STEP 3: REGISTER ON ERC-8004  ║
                    ════════════╪════════════════════
                                │
                        ┌───────▼───────────┐
                        │ AGENT_ID in .env? │
                        └────┬─────────┬────┘
                          NO │         │ YES
                             │  ┌──────▼──────┐
                             │  │ Load ID     │
                             │  │ from .env   │
                             │  └──────┬──────┘
                   ┌─────────▼─────────┐   │
                   │ register(agentURI)│   │
                   │ → Mint ERC-721    │   │
                   │ → Parse event     │   │
                   │ → Save ID to .env │   │
                   └────┬────┬─────────┘   │
                   event│    │event        │
                   not  │    │found        │
                   found│    │             │
              ┌─────────▼┐   │             │
              │ ✖ ERROR  │   │             │
              │ No event │   │             │
              └──────────┘   │             │
                             └──────┬──────┘
                                    │
                    ════════════╪════╧══════════
                    ║  STEP 4: SET METADATA          ║
                    ════════════╪════════════════════
                                │
                   ┌────────────▼────────────┐
                   │ SHA256(agent-config)     │
                   │ → configHash            │
                   └────────────┬────────────┘
                                │
                   ┌────────────▼────────────┐
                   │ Read on-chain:          │
                   │  • configHash           │
                   │  • agentPlatform        │
                   └────┬──────────────┬─────┘
                        │              │
                   Both match?    One or both
                        │          differ
                        │              │
                 ┌──────▼──────┐  ┌────▼──────────────────┐
                 │ Skip        │  │ Tx 1: setMetadata     │
                 │ (idempotent)│  │  ("configHash", hash) │
                 └──────┬──────┘  │ Tx 2: setMetadata     │
                        │         │  ("agentPlatform", p)  │
                        │         │ (sequential nonces)    │
                        │         └────┬──────────────────┘
                        └──────┬──────┘
                               │
                    ═══════════╪══════════════
                    ║  STEP 5: READ BACK & DISPLAY  ║
                    ═══════════╪═════════════════════
                               │
                   ┌───────────▼───────────┐
                   │ Read-only calls:      │
                   │  • ownerOf(agentId)   │
                   │  • tokenURI(agentId)  │
                   │  • getAgentWallet()   │
                   │  • getMetadata() ×2   │
                   └───────────┬───────────┘
                               │
                   ┌───────────▼───────────┐
                   │ Display identity card │
                   │ + JSON summary        │
                   └───────────┬───────────┘
                               │
                         ┌─────▼─────┐
                         │    END    │
                         └───────────┘
```

## Idempotency Summary

Every step checks state before acting — the entire flow is safe to re-run:

| Step | Check | If Already Done |
|------|-------|-----------------|
| 1 | `AGENT_PRIVATE_KEY` in `.env` | Reuse existing wallet |
| 2 | Agent balance ≥ 0.001 ETH | Skip funding |
| 3 | `AGENT_ID` in `.env` | Skip registration |
| 4 | On-chain metadata matches | Skip transactions |
| 5 | *(always runs)* | Read-only, no side effects |

## Auxiliary Flows

```
┌──────────────────────────────────────────────────────┐
│                  GIVE FEEDBACK                        │
│                                                       │
│  Load AGENT_ID ──► Use funder wallet ──► giveFeedback │
│       from .env    (can't self-rate)     (score, tags)│
│                                          ──► readBack │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│              JOIN39 WEB API                           │
│                                                       │
│  POST /api/onboard ──► Full Steps 1-5 ──► Return ID  │
│   {name, platform}     (single request)   + key      │
│                                                       │
│  GET /api/lookup?agentId=N ──► Read on-chain ──► JSON │
└──────────────────────────────────────────────────────┘
```
