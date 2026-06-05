# AiContentFlow — Frontend Rules & Product Context

## Product Vision

AiContentFlow is a multi-tenant SaaS platform for:
- content operations
- editorial workflows
- publishing workflows
- scheduling
- analytics
- social media distribution

The frontend must reflect the architectural separation between:

1. Editorial / Content Domain
2. Publishing / Delivery Domain

These are separate concerns.

---

# Core UX Philosophy

The application is NOT:
- a simple AI prompt wrapper
- a social media toy dashboard
- a basic scheduler

The application IS:
- a professional publishing operations platform
- a workflow-driven SaaS
- a multi-tenant collaborative system
- an AI-assisted content infrastructure

The UI should feel:
- operational
- structured
- scalable
- clean
- trustworthy
- workflow-oriented

Avoid:
- clutter
- excessive gradients
- over-animation
- consumer-social-app aesthetics

---

# Important Domain Concepts

## Team
Top-level tenant organization.

Everything belongs directly or indirectly to a Team.

Examples:
- OpenAI
- Acme
- HubSpot

---

## Channels

IMPORTANT:
A Channel is NOT:
- a platform
- a content category
- a hashtag-like grouping

A Channel IS:
- a publishing workspace
- an operational domain
- a publishing identity

Examples:
- Product & Growth
- Recruitment
- Education

A Channel groups:
- social accounts
- branding
- publishing configuration
- campaigns
- publishing strategy

---

## Campaigns

Campaigns belong to ONE Channel.

Campaigns organize:
- initiatives
- launches
- seasonal operations
- marketing efforts

---

## ContentPosts

Core editorial content entity.

Posts can be created in TWO scopes:

### 1. Direct / Standalone Post Creation
Fast workflow.

A post may exist WITHOUT:
- channel
- campaign

This is intentional.

Use case:
- quick content generation
- lightweight workflows
- rapid publishing

---

### 2. Structured Workflow Creation

A post can also belong to:
- channel
- campaign

This is the operational publishing workflow.

---

## PostVariants

Platform-specific content adaptations.

Examples:
- LinkedIn version
- Twitter version
- Facebook version

IMPORTANT:
PostVariants are CONTENT ONLY.

They do NOT manage:
- publishing state
- retries
- scheduling
- analytics

---

## Brand Studio

Brand Studio is a NEW global feature.

Brand Studio belongs to the Team level.

It is NOT tied to:
- campaigns
- channels
- individual posts

Brand Studio represents:
- reusable organizational intelligence
- reusable brand context
- reusable AI context

---

# Brand Studio Vision

The team admin provides:
- company website URL

The backend later:
- scrapes the website
- extracts structured brand information
- stores reusable context

This context later powers:
- AI generation
- channel guidance
- campaign assistance
- content adaptation
- future automation systems

---

# Important Brand Studio Rule

Brand Studio does NOT replace Channel branding.

Difference:

## Brand Studio
Global organization-level intelligence.

Examples:
- company mission
- tone
- products
- services
- target audience
- company identity

---

## Channel Branding
Operational publishing identity for a specific Channel.

Examples:
- Product & Growth tone
- Recruitment tone
- educational publishing tone

Both layers must coexist.

---

# Sidebar Navigation

Suggested structure:

- Dashboard
- Generate
- Scheduler
- Brand Studio
- Channels
- Campaigns
- Content Feed
- Team Members
- Profile

Brand Studio is a CORE platform feature.

---

# Frontend Architecture Rules

## Feature Isolation

Every feature must be isolated.

Structure example:

src/
  features/
    brand-studio/
    channels/
    campaigns/
    publishing/
    scheduler/

Avoid:
- giant shared folders
- mixed feature logic
- unrelated state coupling

---

## API Layer Rules

Never call APIs directly inside components.

Use:
- services
- hooks
- typed API clients

Example:
- brandStudio.service.ts
- useBrandStudio.ts

---

## State Rules

Separate:
- auth state
- team state
- editorial state
- publishing state
- brand studio state

Avoid giant global stores.

---

## Component Rules

Prefer:
- reusable UI primitives
- dumb presentational components
- feature containers
- isolated loading states

Avoid:
- 1000-line pages
- business logic inside JSX
- duplicated fetch logic

---

# Brand Studio Frontend Requirements

## Initial State

If Brand Studio is not configured:
- show onboarding experience
- explain the feature
- request website URL

---

## Import Flow

Flow:

1. User submits URL
2. Backend creates import job
3. Frontend polls job status
4. UI updates progressively
5. Result stored in Team Brand Studio

---

## Required States

Brand imports are asynchronous.

Support:
- queued
- processing
- completed
- failed

Never fake instant completion.

---

## Future-Proof UI

UI must anticipate future additions:
- uploaded documents
- PDF ingestion
- assets
- AI memory
- brand guidelines
- tone profiles
- competitor intelligence
- knowledge base

Do NOT hardcode architecture around only one website URL forever.

---

# Routing Rules

Examples:
- /dashboard
- /generate
- /scheduler
- /brand-studio
- /channels/:id
- /campaigns/:id

---

# UX Direction

The UI should communicate:
- operational clarity
- workflow structure
- publishing reliability
- AI transparency

Users should understand:
- where context comes from
- what is organizational context
- what is channel-level context
- what AI is using

---

# AI Context Hierarchy

Future generation priority:

1. explicit user prompt
2. channel context
3. campaign context
4. Brand Studio context
5. platform adaptation rules

Frontend should later expose these layers visually.

---

# Design Direction

Prefer:
- clean cards
- soft borders
- structured spacing
- readable typography
- dark SaaS aesthetic

Avoid:
- random accent colors
- inconsistent spacing
- heavy neumorphism
- flashy consumer UI


UX should be clear and professional , nothing overdone or overshown , and everything clear and obvious
