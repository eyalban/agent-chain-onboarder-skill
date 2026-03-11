"""
Generate the HW4 assignment PDF: Agent Identity, Trust & Verifiable Behavior Infrastructure
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER
from reportlab.lib.colors import HexColor
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether,
)

OUTPUT = "HW4_Eyal_Ban_Agent_Identity_Trust.pdf"

doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=letter,
    topMargin=0.75 * inch,
    bottomMargin=0.75 * inch,
    leftMargin=1 * inch,
    rightMargin=1 * inch,
)

styles = getSampleStyleSheet()

# Custom styles
styles.add(ParagraphStyle(
    name="DocTitle",
    parent=styles["Title"],
    fontSize=16,
    spaceAfter=4,
    alignment=TA_CENTER,
))
styles.add(ParagraphStyle(
    name="Subtitle",
    parent=styles["Normal"],
    fontSize=10,
    alignment=TA_CENTER,
    textColor=HexColor("#555555"),
    spaceAfter=16,
))
styles.add(ParagraphStyle(
    name="SectionHead",
    parent=styles["Heading2"],
    fontSize=12,
    spaceBefore=14,
    spaceAfter=6,
    textColor=HexColor("#1a1a1a"),
))
styles.add(ParagraphStyle(
    name="Body",
    parent=styles["Normal"],
    fontSize=10,
    leading=14,
    alignment=TA_JUSTIFY,
    spaceAfter=6,
))
styles.add(ParagraphStyle(
    name="BulletCustom",
    parent=styles["Normal"],
    fontSize=10,
    leading=14,
    leftIndent=18,
    bulletIndent=6,
    spaceAfter=3,
))
styles.add(ParagraphStyle(
    name="SmallItalic",
    parent=styles["Normal"],
    fontSize=9,
    leading=12,
    textColor=HexColor("#444444"),
    alignment=TA_JUSTIFY,
    spaceAfter=4,
))

story = []

# ── Title ────────────────────────────────────────────────────────────

story.append(Paragraph("Agent Identity, Trust &amp; Verifiable Behavior Infrastructure", styles["DocTitle"]))
story.append(Paragraph("HW4: Agentic Infrastructure Exploration &mdash; Eyal Ban &mdash; MIT Media Lab, AI Agents Class", styles["Subtitle"]))
story.append(HRFlowable(width="100%", thickness=0.5, color=HexColor("#cccccc")))
story.append(Spacer(1, 8))

# ── 1. Topic & Why It Matters ────────────────────────────────────────

story.append(Paragraph("1. Topic of Interest and Why It Matters", styles["SectionHead"]))

story.append(Paragraph(
    "As AI agents move from demos to production, a foundational question emerges: "
    "<i>how do you know you can trust an agent you have never interacted with before?</i> "
    "Today there is no standard way to answer the questions every agent-to-agent or human-to-agent "
    "interaction needs answered: Who made this agent? What can it do? Has its behavior changed since "
    "I last trusted it? Can I verify its past track record?",
    styles["Body"],
))
story.append(Paragraph(
    "This is the <b>agent identity, trust, and verifiable behavior</b> problem. It sits at the "
    "intersection of cryptographic identity, on-chain reputation, and hardware-based code verification. "
    "Without this infrastructure layer, agent ecosystems cannot scale safely&mdash;every interaction "
    "requires a leap of faith. The protocols emerging in this space aim to make that leap unnecessary.",
    styles["Body"],
))

# ── 2. Landscape ─────────────────────────────────────────────────────

story.append(Paragraph("2. Existing Players and Landscape", styles["SectionHead"]))

story.append(Paragraph(
    "I surveyed four approaches that each address a different slice of the trust stack:",
    styles["Body"],
))

table_data = [
    ["Protocol / Framework", "What It Proves", "Key Limitation"],
    [
        "Fetch.ai uAgents\n+ Almanac",
        '"Same entity" (identity)\nCrypto keypair + on-chain\nregistry as decentralized DNS',
        "No behavior verification.\nCreator can rewrite logic,\nrestart with same seed\u2014no one knows.",
    ],
    [
        "Phala Network dstack\n(TEE-based)",
        '"Same code" (integrity)\nHardware attestation proves\nexact code running in enclave',
        "Requires Intel TDX hardware.\nAttestation proves code, not intent.",
    ],
    [
        "ERC-8004\n(Ethereum standard)",
        '"Others vouch for it" (reputation)\nNFT identity + on-chain\nfeedback + validation hooks',
        "Trust is social, not cryptographic.\nReputation can be gamed.",
    ],
    [
        "VERA Protocol\n(Berlin AI Labs)",
        "Claims cryptographic\nProof of Execution (PoE)",
        "No public repo found.\nCannot verify claims independently.",
    ],
]

t = Table(table_data, colWidths=[1.7 * inch, 2.1 * inch, 2.5 * inch])
t.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), HexColor("#2d2d2d")),
    ("TEXTCOLOR", (0, 0), (-1, 0), HexColor("#ffffff")),
    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
    ("FONTSIZE", (0, 0), (-1, -1), 8),
    ("LEADING", (0, 0), (-1, -1), 10),
    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("GRID", (0, 0), (-1, -1), 0.4, HexColor("#cccccc")),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [HexColor("#f9f9f9"), HexColor("#ffffff")]),
    ("TOPPADDING", (0, 0), (-1, -1), 4),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
]))
story.append(t)
story.append(Spacer(1, 6))

story.append(Paragraph(
    "<b>Key insight:</b> No single protocol solves the full trust stack. Real agent trust likely requires "
    "identity + code verification + reputation composed together. ERC-8004 is notable because its "
    "Validation Registry is explicitly designed as a plug-in point for external attestation systems "
    "like Phala's TEE proofs&mdash;bridging the social and cryptographic layers.",
    styles["Body"],
))

# ── 3. Protocol Run Locally ──────────────────────────────────────────

story.append(Paragraph("3. Open-Source Protocol Run: ERC-8004 on Base Sepolia", styles["SectionHead"]))

story.append(Paragraph(
    "I chose to work hands-on with <b>ERC-8004</b> (live on Ethereum mainnet since January 2026). "
    "Rather than just calling contract functions from a local script, I designed a complete end-to-end "
    "experiment: have an autonomous AI agent register <i>itself</i> on-chain.",
    styles["Body"],
))

story.append(Paragraph(
    "<b>Setup:</b> I used my OpenClaw agent \"Foxtail,\" running on a Hostinger VPS in Docker "
    "(GPT-5.2, Node.js v22, accessible via Telegram). The ERC-8004 contracts are deployed on "
    "Base Sepolia (an L2 testnet). I wrote six ethers.js v6 scripts that walk through the full "
    "agent lifecycle:",
    styles["Body"],
))

steps = [
    "<b>Generate wallet</b> &mdash; Each agent gets its own Ethereum keypair.",
    "<b>Fund wallet</b> &mdash; A pre-funded \"funder\" wallet sends testnet ETH for gas.",
    "<b>Register</b> &mdash; The agent calls <font face='Courier' size='9'>register(string)</font> on the IdentityRegistry. "
    "This mints an ERC-721 NFT as the agent's portable identity. The agent's own wallet is the caller, "
    "so the agent owns its own NFT.",
    "<b>Set metadata</b> &mdash; The agent self-introspects (hostname, model, tools, platform), writes an "
    "<font face='Courier' size='9'>agent-config.json</font>, SHA-256 hashes it, and stores the hash on-chain via "
    "<font face='Courier' size='9'>setMetadata</font>. Anyone can later re-hash the config and compare.",
    "<b>Read back</b> &mdash; Verify all on-chain data matches.",
    "<b>Give feedback</b> &mdash; Test the ReputationRegistry by posting a feedback score.",
]
for step in steps:
    story.append(Paragraph(step, styles["BulletCustom"], bulletText="\u2022"))

story.append(Spacer(1, 4))
story.append(Paragraph(
    "After testing each step individually with Foxtail, I consolidated them into a single idempotent "
    "script (<font face='Courier' size='9'>onboard.mjs</font>) and packaged it as a downloadable skill. "
    "Any agent can clone the repo, create a config, and run one command to get an on-chain identity. "
    "Foxtail successfully registered as <b>Agent ID 1759</b> on Base Sepolia.",
    styles["Body"],
))

story.append(Paragraph(
    "I then built a <b>Join39 app</b> around the same logic: a Vercel serverless function at "
    "<font face='Courier' size='9'>POST /api/onboard</font> that any Join39 agent can call as a tool "
    "during conversation. The agent provides its name and platform; the server generates a wallet, "
    "funds it, registers on-chain, sets metadata, and returns a full identity card with the wallet "
    "private key&mdash;all in under 10 seconds. Submitted to the Join39 Agent Store as "
    "\"<b>ERC-8004 Agent Onboarder</b>.\"",
    styles["Body"],
))

# ── 4. What I Learned ───────────────────────────────────────────────

story.append(Paragraph("4. What I Learned", styles["SectionHead"]))

story.append(Paragraph("<b>What worked well:</b>", styles["Body"]))
worked = [
    "The ERC-8004 contract design is clean. Three registries (Identity, Reputation, Validation) "
    "with clear separation of concerns. The NFT-as-identity model makes agent identities transferable "
    "and composable with existing Ethereum tooling.",
    "On-chain metadata via <font face='Courier' size='9'>setMetadata(agentId, key, value)</font> is "
    "flexible&mdash;arbitrary key-value pairs, no schema enforcement. This makes it easy to store "
    "config hashes, platform info, or any future metadata without contract upgrades.",
    "Base Sepolia L2 transactions confirm in ~2 seconds, making interactive agent registration practical. "
    "The full 4-transaction onboarding flow completes in under 10 seconds.",
]
for item in worked:
    story.append(Paragraph(item, styles["BulletCustom"], bulletText="\u2022"))

story.append(Spacer(1, 4))
story.append(Paragraph("<b>What was confusing or tricky:</b>", styles["Body"]))
tricky = [
    "<b>ethers.js v6 overloaded functions:</b> The IdentityRegistry has multiple "
    "<font face='Courier' size='9'>register</font> overloads. In ethers v6, you must use bracket notation "
    "(<font face='Courier' size='9'>contract[\"register(string)\"](uri)</font>) to disambiguate. This is "
    "poorly documented and caused early failures.",
    "<b>Nonce race conditions:</b> Sending two metadata transactions back-to-back caused "
    "\"replacement fee too low\" errors. The RPC provider had not updated the nonce from the first tx "
    "before the second was sent. Required explicit nonce management "
    "(<font face='Courier' size='9'>{ nonce: nonce++ }</font>).",
    "<b>Testnet faucet friction:</b> Every programmatic faucet requires API keys, mainnet ETH, or "
    "ENS names. Manual funding was the only frictionless option&mdash;ironic for agent automation.",
]
for item in tricky:
    story.append(Paragraph(item, styles["BulletCustom"], bulletText="\u2022"))

story.append(Spacer(1, 4))
story.append(Paragraph("<b>Limitations and tradeoffs:</b>", styles["Body"]))
limits = [
    "<b>Reputation is social, not cryptographic.</b> ERC-8004's ReputationRegistry lets anyone post "
    "feedback. There is no Sybil resistance&mdash;an attacker can create many wallets and post fake "
    "positive reviews. The ValidationRegistry (for third-party attestations) helps, but the core "
    "reputation layer is gameable.",
    "<b>Config hash proves nothing alone.</b> Storing a SHA-256 hash on-chain proves the config "
    "existed at registration time, but not that the agent is <i>still</i> running that config. "
    "Without TEE attestation or periodic re-verification, the hash is a snapshot, not a guarantee.",
    "<b>Ownership model is nuanced.</b> The agent \"owns\" its NFT (its wallet calls register), "
    "but the creator controls the infrastructure (VPS, Docker, .env file with the private key). "
    "True agent self-sovereignty requires TEEs&mdash;without them, the creator can always access "
    "the agent's wallet.",
]
for item in limits:
    story.append(Paragraph(item, styles["BulletCustom"], bulletText="\u2022"))

# ── 5. Why This Interests Me ────────────────────────────────────────

story.append(Paragraph("5. Why This Area Interests Me", styles["SectionHead"]))

story.append(Paragraph(
    "I am building a startup called <b>Magic</b> focused on tokenizing agents&mdash;agent as an asset "
    "with ownership, licensing, royalties, and governance. This assignment forced me to go deeper than "
    "\"just mint an NFT\" and confront what identity and trust actually mean in agent ecosystems.",
    styles["Body"],
))
story.append(Paragraph(
    "The key realization: the trust stack is layered, and each layer needs different technology. "
    "Crypto keypairs prove identity (same entity), TEEs prove code integrity (same code), and "
    "on-chain reputation proves social trust (others vouch for it). ERC-8004 is positioned at the "
    "social trust layer but, critically, its Validation Registry creates the plug-in point where "
    "cryptographic proofs (like Phala's TEE attestations) can be composed in. This composability "
    "is what makes the standard interesting for Magic's roadmap&mdash;the NFT identity is not just "
    "proof of ownership, but an anchor point for an accumulating trust profile.",
    styles["Body"],
))

story.append(Spacer(1, 8))
story.append(HRFlowable(width="100%", thickness=0.5, color=HexColor("#cccccc")))
story.append(Spacer(1, 4))
story.append(Paragraph(
    "GitHub: github.com/eyalban/agent-chain-onboarder-skill &nbsp;|&nbsp; "
    "Join39 App: ERC-8004 Agent Onboarder &nbsp;|&nbsp; "
    "Agent ID 1759 on Base Sepolia",
    styles["SmallItalic"],
))

# ── Build ────────────────────────────────────────────────────────────

doc.build(story)
print(f"Generated: {OUTPUT}")
