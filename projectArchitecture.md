# AiContentFlow — Global Project Architecture

## Platform Overview

AiContentFlow is a multi-tenant SaaS platform for:
- content operations
- campaign management
- publishing workflows
- scheduling
- analytics
- social media distribution
- future AI-assisted operations

The system is architected as:
- a workflow-driven publishing platform
- a distributed publishing system
- an integration-heavy backend
- a scalable multi-tenant system

---

# Core Architectural Separation

The platform separates TWO major domains:

## 1. Editorial / Content Domain

Responsible for:
- content creation
- collaboration
- campaigns
- content adaptation
- editorial workflows

Answers:
"What content are we creating?"

---

## 2. Publishing / Delivery Domain

Responsible for:
- scheduling
- retries
- execution
- delivery tracking
- analytics synchronization
- external API communication

Answers:
"How, where, and when is content delivered?"

IMPORTANT:
Do NOT mix these concerns.

---

# Multi-Tenancy

## Team

Top-level tenant organization.

Everything belongs directly or indirectly to a Team.

Examples:
- Acme
- OpenAI
- HubSpot

Goals:
- strict tenant isolation
- predictable querying
- safe async execution
- scalability

---

# Channels

IMPORTANT:
Channels are NOT platforms.

Channels are:
- publishing workspaces
- operational publishing domains
- organizational publishing units

Examples:
- Product & Growth
- Recruitment
- Education

Channels group:
- social accounts
- branding
- publishing strategy
- publishing configuration
- campaigns

Channels are aggregate roots.

Campaigns belong to ONE Channel.

---

# Campaigns

Campaigns are organizational initiatives inside Channels.

Examples:
- Product launch
- Hiring sprint
- Black Friday
- Educational series

---

# ContentPosts

Core editorial content.

Posts support TWO creation scopes:

## Direct Posts
Can exist WITHOUT:
- channels
- campaigns

Fast lightweight workflow.

---

## Structured Posts
Can belong to:
- channels
- campaigns

Operational publishing workflow.

---

# PostVariants

Platform-specific content adaptations.

Examples:
- LinkedIn adaptation
- Twitter adaptation
- Instagram adaptation

IMPORTANT:
PostVariants are CONTENT ONLY.

They do NOT manage:
- retries
- publishing states
- analytics
- scheduling

---

# SocialAccounts

Connected external accounts.

Examples:
- LinkedIn Company Page
- Twitter Account
- Facebook Page

SocialAccounts belong to Channels.

---

# PostPublications

CORE publishing execution entity.

Represents:
ONE delivery of ONE PostVariant to ONE SocialAccount.

Handles:
- scheduling
- retries
- failures
- execution state
- external IDs
- publishing lifecycle

IMPORTANT:
Publishing logic belongs here,
NOT inside PostVariants.

---

# PublishJobs

Infrastructure-level async jobs.

Handled through Hangfire.

---

# PublicationAnalytics

Analytics tied to PostPublications.

Metrics are platform-specific.

---

# Brand Studio

Brand Studio is a NEW Team-level capability.

Purpose:
- ingest organizational intelligence
- centralize reusable AI context
- avoid repeated manual prompting

---

# Brand Studio Responsibilities

Initial input:
- website URL

Future responsibilities:
- website scraping
- structured extraction
- AI enrichment
- document ingestion
- knowledge base construction
- tone modeling
- brand memory

---

# Brand Studio Scope

Brand Studio belongs to the Team level.

It is NOT:
- a campaign feature
- a channel replacement
- a publishing execution component

Brand Studio provides GLOBAL organizational context.

---

# Relationship Between Brand Studio & Channels

Brand Studio:
- global company intelligence

Channel Branding:
- operational publishing identity

Example:

Brand Studio:
- company mission
- values
- products
- tone
- audience

Recruitment Channel:
- hiring tone
- recruitment positioning
- employer branding

Product & Growth Channel:
- growth positioning
- acquisition messaging
- product communication style

These layers complement each other.

---

# Brand Studio Import Flow

1. Team admin submits website URL
2. Backend creates import job
3. Website is scraped asynchronously
4. Relevant information extracted
5. Structured data stored
6. Status updated
7. Context becomes reusable

---

# Async Architecture Rules

AI-related operations are long-running.

Use:
- jobs
- queues
- polling
- retries
- persisted states

Avoid synchronous AI assumptions.

---

# Suggested Brand Studio Entities

## TeamBrandStudio

Fields:
- id
- teamId
- websiteUrl
- companyName
- description
- mission
- targetAudience
- keywords
- toneOfVoice
- createdAt
- updatedAt

---

## BrandImportJob

Fields:
- id
- teamBrandStudioId
- status
- startedAt
- completedAt
- error
- rawSnapshot

---

# API Suggestions

POST /brand-studio/import
GET /brand-studio
GET /brand-studio/jobs/:id

---

# Critical Rules

## Rule 1
Channels are publishing workspaces/domains.

## Rule 2
Campaigns belong to Channels.

## Rule 3
PostVariants are content-only.

## Rule 4
PostPublications are execution units.

## Rule 5
Do NOT mix editorial logic with delivery logic.

## Rule 6
Preserve tenant isolation everywhere.

## Rule 7
Avoid fat entities and God objects.

## Rule 8
Do NOT hardcode Brand Studio around a single URL forever.

---

# Current Priorities

Focus on:
- architecture validation
- flow consistency
- tenant safety
- async reliability
- state consistency
- infrastructure hardening

NOT current priorities:
- microservices
- premature optimization
- advanced AI systems