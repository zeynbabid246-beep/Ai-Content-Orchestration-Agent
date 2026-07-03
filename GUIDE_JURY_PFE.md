# Guide Complet — Questions Jury PFE : AiContentFlow

> Document de préparation technique — couverture exhaustive des choix d'architecture,
> des concepts clés et des questions probables du jury.

---

## Table des matières

1. [Architecture globale détaillée](#1-architecture-globale-détaillée)
2. [Intégration du backend Python dans le backend .NET](#2-intégration-du-backend-python-dans-le-backend-net)
3. [Orchestrateurs : combien et où ?](#3-orchestrateurs--combien-et-où-)
4. [Pourquoi PostgreSQL et pas SQL Server ?](#4-pourquoi-postgresql-et-pas-sql-server-)
5. [Pourquoi Kanban ?](#5-pourquoi-kanban-)
6. [Diagramme de classes — explication et questions](#6-diagramme-de-classes--explication-et-questions)
7. [Threads et les plateformes sociales — implémentation](#7-threads-et-les-plateformes-sociales--implémentation)
8. [OAuth 2.0 — rôle et fonctionnement](#8-oauth-20--rôle-et-fonctionnement)
9. [TLS et SMTP — implémentation et justification](#9-tls-et-smtp--implémentation-et-justification)
10. [Principes SOLID](#10-principes-solid)
11. [Clean Architecture — extensibilité, dépendance, testabilité](#11-clean-architecture--extensibilité-dépendance-testabilité)
12. [Rôle des Controllers](#12-rôle-des-controllers)
13. [Dependency Injection et Entity Framework Core](#13-dependency-injection-et-entity-framework-core)
14. [Pourquoi Buffer, LinkedIn Pages et Pomelli dans l'état de l'art ?](#14-pourquoi-buffer-linkedin-pages-et-pomelli-dans-létat-de-lart-)
15. [Pourquoi Clean Architecture et .NET ?](#15-pourquoi-clean-architecture-et-net-)
16. [Pourquoi React 19 et FSD ?](#16-pourquoi-react-19-et-fsd-)
17. [Pourquoi Hangfire ?](#17-pourquoi-hangfire-)
18. [Autres questions probables du jury](#18-autres-questions-probables-du-jury)

---

## 1. Architecture globale détaillée

### Vue d'ensemble

Le système repose sur **4 couches distinctes** qui communiquent entre elles de manière unidirectionnelle.

```
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND  React 19 + TypeScript + Vite                         │
│  Feature-Sliced Design (FSD)                                    │
│  Port : 5173                                                     │
└──────────────────────┬──────────────────────────────────────────┘
                       │  REST API (JSON / JWT Bearer Token)
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  BACKEND .NET  ASP.NET Core 10                                  │
│  Clean Architecture : API → Application → Domain ← Infrastructure│
│  Port : 7075 (HTTPS) / 5063 (HTTP)                              │
│  Entity Framework Core 10 + Hangfire                             │
└────────────┬──────────────────────────────┬─────────────────────┘
             │  HTTP interne (localhost:8000)│  SQL (EF Core)
             ▼                              ▼
┌────────────────────────┐    ┌────────────────────────┐
│  BACKEND PYTHON        │    │  PostgreSQL 16          │
│  FastAPI (port 8000)   │    │  Tables : Users, Teams, │
│  Multi-Agents IA       │    │  ContentPosts, Variants,│
│  LangGraph             │    │  Campaigns, SocialAccs, │
│  Qdrant (vecteurs)     │    │  PublicationAnalytics..│
│  Ollama (embeddings)   │    └────────────────────────┘
└────────────┬───────────┘
             │  HTTPS
             ▼
┌─────────────────────────────────────────────────────────────────┐
│  SERVICES EXTERNES                                               │
│  • Groq API (llama-3.3-70b-versatile) — génération de texte     │
│  • OpenAI / Gemini — image generation                           │
│  • LinkedIn / Facebook / Instagram / Threads APIs                │
│  • Stability AI (optionnel) — arrière-plans IA                  │
└─────────────────────────────────────────────────────────────────┘
```

### Couche 1 — Frontend (React 19)

- **Rôle** : interface utilisateur, rendu des pages, appels API REST.
- **FSD** : chaque fonctionnalité est isolée dans son propre slice (`features/brand-studio`, `features/campaigns`, etc.).
- Communique avec le backend .NET via Axios + JWT Bearer Token dans chaque header.
- Aucune logique métier : juste de la présentation et des appels réseau.

### Couche 2 — Backend .NET (ASP.NET Core 10)

Organisé en **4 projets** (Clean Architecture) :

| Projet | Rôle |
|---|---|
| `AiContentFlow.API` | Controllers, Middleware, configuration Hangfire |
| `AiContentFlow.Application` | Cas d'usage, interfaces, DTOs, services métier |
| `AiContentFlow.Domain` | Entités métier, règles de domaine, enums |
| `AiContentFlow.Infrastructure` | EF Core, publishers, services email, AI clients |

**Flux d'une requête typique :**
```
Request HTTP
  → [JWT Middleware]
  → [Rate Limiter]
  → [Controller] (reçoit, valide, délègue)
  → [Application Service] (logique métier)
  → [Infrastructure] (DB / Python Backend / Email)
  → Response JSON
```

### Couche 3 — Backend Python (FastAPI multi-agents)

**6 agents spécialisés + 1 orchestrateur LangGraph :**

| Agent | Endpoint | Rôle |
|---|---|---|
| Brand Agent | `/api/brand/analyze` | Scrape + analyse la marque |
| Strategy Agent | `/api/strategy/generate` | Génère la stratégie marketing |
| Planning Agent | `/api/planning/generate` | Crée le planning éditorial |
| Campaign Content Agent | `/api/campaign-content/suggest` | Génère les posts de campagne |
| Creative Agent | `/api/creative/generate-poster` | Génère les affiches (PIL) |
| Assistant Agent | `/api/assistant/chat` | Chatbot IA contextuel |
| Orchestrateur | `/api/orchestrator/run` | Orchestre Brand→Trend→Strategy→Content |

### Couche 4 — Base de données PostgreSQL

- Gérée par Entity Framework Core via des migrations versionées.
- Hangfire utilise le **même** serveur PostgreSQL pour ses tables internes de jobs.
- Les tokens OAuth des réseaux sociaux sont stockés **chiffrés** (AES-GCM 256-bit) dans la colonne `OAuthToken`.

---

## 2. Intégration du backend Python dans le backend .NET

### Pattern utilisé : Proxy HTTP interne

Le backend .NET ne connaît pas les détails du backend Python. Il passe uniquement par une interface :

```csharp
// Application/Common/Interfaces/ILocalAiBackendClient.cs
public interface ILocalAiBackendClient
{
    Task<JsonElement> AnalyzeBrandAsync(...);
    Task<JsonElement> GenerateStrategyAsync(...);
    Task<JsonElement> GeneratePlanningAsync(...);
    Task<JsonElement> SuggestCampaignAsync(...);
}
```

L'implémentation dans Infrastructure fait des appels HTTP vers `localhost:8000` :

```csharp
// Infrastructure/AI/LocalAiBackendClient.cs
var response = await _http.PostAsJsonAsync("/api/strategy/generate", payload);
var json = await response.Content.ReadFromJsonAsync<JsonElement>();
```

### Configuration du mode IA

`appsettings.json` contrôle quel backend est utilisé :

```json
"AI": { "ProviderMode": "LocalBackend" }
```

- **`LocalBackend`** → appels HTTP vers Python (localhost:8000).
- **`ExternalProviders`** → Groq directement via `ITextGenerationService`.

La vérification se fait dans chaque service :

```csharp
private bool IsExternalProviderMode()
    => (_configuration["AI:ProviderMode"] ?? "LocalBackend")
       .Equals("ExternalProviders", StringComparison.OrdinalIgnoreCase);
```

### Séquence complète d'un appel

```
[Frontend] POST /api/ai/campaign/strategy
     → [CampaignController] → [AiContentService.GenerateCampaignStrategyStepAsync()]
          → if LocalBackend → [LocalAiBackendClient] → HTTP POST localhost:8000/api/strategy/generate
               → [FastAPI StrategyService] → [LLM Groq/Ollama] → JSON strategy
          ← JsonElement strategy
     ← CampaignStrategyStepResponseDto
[Frontend] affiche la stratégie
```

---

## 3. Orchestrateurs : combien et où ?

### Il y a **2 niveaux d'orchestration** dans le projet.

#### Orchestrateur 1 — Python LangGraph (`orchestrator_service.py`)

C'est un **graphe d'états** (StateGraph) construit avec LangGraph.

**5 nœuds dans le graphe :**

```
retrieve_context_node → trend_node → strategy_node → content_node → review_node → END
```

| Nœud | Rôle |
|---|---|
| `retrieve_context_node` | Récupère le contexte de marque (Qdrant RAG ou contexte manuel) |
| `trend_node` | Interroge les sources de tendances (Google Trends, Reddit, News) |
| `strategy_node` | Construit le prompt de stratégie enrichi |
| `content_node` | Appelle le ContentService pour générer le texte du post |
| `review_node` | Nettoie et finalise le contenu généré |

L'orchestrateur est exposé via `/api/orchestrator/run` et est aussi utilisé par l'Assistant Agent (`route_from_assistant()`).

#### Orchestrateur 2 — .NET AiContentService

Le `AiContentService.cs` orchestre les **3 étapes de création de campagne** de façon séquentielle dans l'interface utilisateur :

1. **Étape Strategy** → `GenerateCampaignStrategyStepAsync()`
2. **Étape Planning** → `GenerateCampaignPlanningStepAsync()`
3. **Étape Content** → `GenerateCampaignContentStepAsync()`

Chaque étape appelle le backend Python (ou Groq en mode ExternalProviders).

**Total : 2 orchestrateurs** — un LangGraph en Python, un workflow séquentiel en .NET.

---

## 4. Pourquoi PostgreSQL et pas SQL Server ?

### Réponse courte

PostgreSQL est **open source, performant, et mieux adapté** à notre stack technique.

### Comparaison directe

| Critère | PostgreSQL 16 | SQL Server |
|---|---|---|
| Licence | **Gratuit** (open source) | Payant (coût élevé en prod) |
| Support JSON natif | **JSONB** (indexable, opérateurs riches) | JSON limité (pas d'index JSON natif) |
| Support Linux | Natif | Limité (SQL Server Linux moins mature) |
| Compatibilité EF Core | Totale (Npgsql) | Totale (Microsoft.Data.SqlClient) |
| Compatibilité Hangfire | `Hangfire.PostgreSql` natif | `Hangfire.SqlServer` |
| UUID natif | `uuid` type natif | `uniqueidentifier` |
| Performances | Très bonnes sur requêtes complexes | Bonnes mais coût licence |
| Ecosystème Cloud | AWS RDS, Supabase, Neon (gratuit) | Azure SQL seulement (payant) |

### Justification principale pour notre projet

1. **JSONB** : nos entités (`ContentPost`, `PostVariant`, `TeamBrandStudio`) stockent des données JSON semi-structurées. PostgreSQL indexe et interroge ces colonnes JSONB efficacement.
2. **Coût zéro** : projet académique → PostgreSQL est gratuit, SQL Server nécessiterait une licence.
3. **Hangfire.PostgreSql** : intégration native sans configuration supplémentaire.
4. **Npgsql EF Core** : le provider .NET officiel est mature, maintenu par la communauté PostgreSQL.

---

## 5. Pourquoi Kanban ?

### Définition

Kanban est une méthode Agile à **flux continu** : pas de sprints, pas de durée fixe, mais un flux de tâches qui avancent de gauche à droite sur un tableau.

### Pourquoi pas Scrum ?

| Critère | Scrum | Kanban |
|---|---|---|
| Durée des cycles | Sprints fixes (2 semaines) | Flux continu |
| Besoins changeants | Difficile en mid-sprint | Facilement adaptable |
| Équipe | Rôles définis (Scrum Master, PO) | Flexible |
| Livrables | À chaque fin de sprint | Dès que prêt |
| Adapté à notre contexte | Non | **Oui** |

### Justification dans notre contexte

Notre projet avait des **besoins évolutifs** :
- L'intégration des agents IA révélait de nouveaux besoins à chaque étape.
- On ne pouvait pas planifier des sprints fixes quand l'architecture IA n'était pas encore validée.
- Kanban nous permettait d'**ajouter, reprioriser ou bloquer** des tâches sans attendre la fin d'un sprint.

**Colonnes utilisées :**
```
Backlog → Sélectionné → Analyse → Développement → Tests → Terminé
```

**WIP Limits** : maximum 3 tâches en développement simultanément → évite la surcharge cognitive et les conflits de code.

---

## 6. Diagramme de classes — explication et questions

### Entités principales

#### `ContentPost`
Représente un post créé par l'utilisateur (texte, image, campagne associée).
- `ImageUrl` : image partagée entre toutes les variantes de ce post.
- `Campaign?` : optionnel, le post peut être indépendant d'une campagne.
- `ICollection<PostVariant>` : un post peut avoir une variante par plateforme.

#### `PostVariant`
Représente **l'adaptation d'un post pour une plateforme spécifique**.
- `Platform : SocialPlatform` (LinkedIn, Facebook, Instagram, Threads).
- `ContentJson` : contenu sérialisé en JSON (`{ "text": "...", "imageUrl": "..." }`).
- **Indépendant du ContentPost après création** : modifier le parent ne modifie pas la variante.
- `ICollection<PostPublication>` : plusieurs publications planifiées sont possibles.

#### `PostPublication`
Représente une publication planifiée d'une variante.
- `ScheduledAt` : date/heure cible.
- `Status` : Pending → Processing → Published / Failed.
- Liée à un `SocialAccount` (le compte sur lequel publier).

#### `PublishJob`
Job Hangfire déclenché par `PostPublication`.
- Exécuté par le `PublishScheduledVariantsJob` toutes les minutes.
- Appelle le `PublisherFactory` → `IPublisher` → API sociale.

#### `SocialAccount`
Compte réseau social d'un utilisateur.
- `OAuthToken` : token d'accès **chiffré** AES-GCM.
- `ExternalAccountId` : identifiant fourni par l'API sociale (ex: LinkedIn member ID).
- `Platform` : LinkedIn, Facebook, Instagram, Threads.

#### `Campaign`
Représente une campagne marketing.
- `StrategyJson` : stratégie générée par l'IA (JSON brut).
- `PlanningJson` : planning éditorial (JSON brut).
- `ICollection<ContentPost>` : posts appartenant à la campagne.

#### `TeamBrandStudio`
Profil de marque de l'équipe.
- Contient : nom, résumé, couleurs, logo, pilliers de contenu, ton de voix.
- Utilisé par l'IA pour contextualiser la génération de contenu.

#### `PublicationAnalytics`
Métriques d'engagement récupérées depuis les APIs sociales.
- Likes, commentaires, partages, impressions.
- Synchronisé par `SyncPublicationAnalyticsJob` (toutes les heures via Hangfire).

### Relation clé : VariantContentMerge

`VariantContentMerge` est une classe utilitaire (non une entité) qui, **au moment de la publication**, copie l'`ImageUrl` du `ContentPost` parent dans le `contentJson` de la variante, si la variante n'a pas déjà sa propre image.

```csharp
// Avant publish, on merge :
var mergedJson = VariantContentMerge.MergePostImageIntoContentJson(
    variant.ContentJson, variant.ContentPost?.ImageUrl);
```

---

### Questions possibles du jury sur le diagramme de classes

**Q1 : Pourquoi stocker le contenu de la variante en JSON et non en colonnes typées ?**
> Chaque plateforme a ses propres champs (LinkedIn : texte + hashtags, Instagram : caption + alt-text, etc.). Un JSON flexible évite d'ajouter une colonne par champ par plateforme. C'est le pattern **EAV simplifié**.

**Q2 : Pourquoi PostVariant est-il indépendant de ContentPost après création ?**
> C'est un choix de conception délibéré. Une fois la variante générée, l'éditeur peut la modifier manuellement. Si ContentPost changeait en cascade, les modifications manuelles seraient écrasées.

**Q3 : Comment garantissez-vous qu'une variante n'est pas publiée deux fois ?**
> Le `Status` de `PostPublication` est mis à jour atomiquement. Hangfire garantit qu'un job est exécuté une seule fois grâce à son mécanisme de verrouillage pessimiste (lock en base).

**Q4 : Comment est modélisée la relation Team / User ?**
> Via `UserTeam` (table de jointure many-to-many) avec un rôle (`Admin`, `Editor`, `Viewer`). C'est le pattern RBAC (Role-Based Access Control).

**Q5 : Comment sont sécurisés les tokens OAuth stockés dans SocialAccount ?**
> Chiffrés via AES-GCM 256-bit avant insertion en base (dans `ProtectedSocialCredentialStore`). La clé est dérivée du secret JWT de l'application via SHA-256.

---

## 7. Threads et les plateformes sociales — implémentation

### Threads est **pleinement implémenté**

`ThreadsPublisher.cs` utilise l'API officielle Threads (Meta Graph API v1.0 sur `graph.threads.net`).

### Architecture de publication : Pattern Strategy + Factory

```
IPublisher (interface)
├── LinkedInPublisher     → LinkedIn UGC Posts API v2
├── FacebookPublisher     → Facebook Graph API
├── InstagramPublisher    → Instagram Graph API
└── ThreadsPublisher      → Threads API (graph.threads.net/v1.0)
```

`PublisherFactory` sélectionne l'implémentation correcte :
```csharp
public IPublisher GetPublisher(SocialPlatform platform)
    => _publishers.FirstOrDefault(p => p.Platform == platform)
       ?? throw new NotSupportedException(...);
```

### Processus de publication Threads (spécifique)

Threads utilise un système en **2 étapes** obligatoires :

**Étape 1 : Création du container**
```
POST /{threadsUserId}/threads
  → media_type: "TEXT" ou "IMAGE"
  → text: "..."
  → image_url: "..." (si image)
  → Retourne : creationId
```

**Étape 2 : Polling jusqu'à status = FINISHED**
```
GET /{containerId}?fields=status
  → Attend status = "FINISHED" (toutes les 2s, max 30 tentatives)
```

**Étape 3 : Publication**
```
POST /{threadsUserId}/threads_publish
  → creation_id: "..."
  → Retourne : publishId
```

### Flux OAuth par plateforme

| Plateforme | Type OAuth | Scope |
|---|---|---|
| LinkedIn | OAuth 2.0 Authorization Code | `openid`, `profile`, `email`, `w_member_social` |
| Facebook | OAuth 2.0 (Meta) | `pages_manage_posts`, `pages_read_engagement` |
| Instagram | OAuth 2.0 (via Facebook) | `instagram_basic`, `instagram_content_publish` |
| Threads | OAuth 2.0 (Meta Threads API) | `threads_basic`, `threads_content_publish` |

---

## 8. OAuth 2.0 — rôle et fonctionnement

### Définition

OAuth 2.0 est un **protocole d'autorisation** (pas d'authentification) qui permet à notre application d'accéder aux APIs sociales **au nom de l'utilisateur**, sans jamais connaître son mot de passe.

### Flux Authorization Code (utilisé dans notre projet)

```
1. L'utilisateur clique "Connecter LinkedIn"
   → Backend génère une URL d'autorisation avec client_id + redirect_uri + state
   → Redirige vers accounts.linkedin.com/oauth/v2/authorization

2. L'utilisateur accepte sur LinkedIn
   → LinkedIn redirige vers notre redirect_uri avec un CODE

3. Notre backend échange le CODE contre un ACCESS TOKEN
   → POST https://www.linkedin.com/oauth/v2/accessToken
   → Reçoit : access_token + expires_in + (optionnel) refresh_token

4. On stocke le token chiffré en base (AES-GCM)
   → Chaque publication utilise ce token dans le header Authorization

5. À chaque publication :
   → Authorization: Bearer <access_token>
```

### Rôle dans notre architecture

- **Sécurité** : l'utilisateur n'entre jamais son mot de passe dans notre app.
- **Granularité** : on demande uniquement les permissions nécessaires (scope minimal).
- **Révocabilité** : l'utilisateur peut révoquer l'accès depuis LinkedIn à tout moment.
- **Refresh Token** : `SocialTokenRefreshJob` renouvelle automatiquement les tokens expirés (exécuté quotidiennement par Hangfire).

### Implémentation

```csharp
// ILinkedInAuthService
string GetLoginUrl(string state);  // Étape 1 : génère l'URL
Task<SocialAuthResult> HandleCallbackAsync(string code, string state);  // Étape 3 : échange le code

// ProtectedSocialCredentialStore
await store.StoreAsync(account, accessToken, refreshToken, expiry);  // Chiffre + sauvegarde
var token = await store.GetAccessTokenAsync(account);  // Déchiffre pour utilisation
```

---

## 9. TLS et SMTP — implémentation et justification

### SMTP avec TLS dans le projet

**Fichier : `SmtpEmailService.cs`**

```csharp
using var client = new SmtpClient(_emailSettings.SmtpServer, _emailSettings.SmtpPort)
{
    Credentials = new NetworkCredential(_emailSettings.Username, _emailSettings.Password),
    EnableSsl = true,      // ← Active TLS/STARTTLS
    DeliveryMethod = SmtpDeliveryMethod.Network,
    UseDefaultCredentials = false
};
```

**Configuration :**
```
SmtpServer = smtp.gmail.com
SmtpPort   = 587     ← Port STARTTLS (pas 465 qui est SSL pur)
EnableSsl  = true    ← Élève la connexion en TLS via STARTTLS
```

### Pourquoi TLS et pas juste SMTP ?

| Critère | SMTP sans TLS | SMTP avec TLS |
|---|---|---|
| Données en transit | **En clair** (lisibles) | **Chiffrées** |
| Mot de passe | Visible sur le réseau | Protégé |
| Interception | Possible (MITM) | Impossible |
| Gmail | **Refuse** les connexions sans TLS | Accepté |
| Standard actuel | Obsolète | **Obligatoire** |

### STARTTLS vs SSL/TLS

- **Port 465 (SSL)** : connexion chiffrée dès le début.
- **Port 587 (STARTTLS)** : connexion commence en clair, puis `STARTTLS` élève la session en TLS.
- On utilise le port **587 avec `EnableSsl = true`** : .NET gère automatiquement la négociation STARTTLS.

### TLS dans l'API REST

L'API .NET écoute en HTTPS (port 7075) en développement via le certificat développeur .NET (`dotnet dev-certs`). En production, un reverse proxy (Nginx / Kestrel) gère le certificat TLS (Let's Encrypt ou certificat d'entreprise).

### Pourquoi utiliser des App Passwords Gmail ?

Gmail bloque l'authentification basique avec le mot de passe principal depuis 2022. L'**App Password** est un mot de passe spécifique à l'application, révocable indépendamment, qui contourne l'obligation 2FA pour les apps SMTP.

---

## 10. Principes SOLID

### S — Single Responsibility Principle

> Une classe = une seule raison de changer.

**Exemple dans notre projet :**
- `SmtpEmailService` : s'occupe uniquement d'envoyer des emails.
- `ProtectedSocialCredentialStore` : s'occupe uniquement de chiffrer/déchiffrer les tokens.
- `BrandImportProcessor` : s'occupe uniquement de l'import de marque.

Si on mélangeait email + import + tokens dans une seule classe, modifier l'email risquerait de casser l'import. SOLID l'empêche.

### O — Open/Closed Principle

> Ouvert à l'extension, fermé à la modification.

**Exemple :**
Pour ajouter une **5ème plateforme** (ex: TikTok), on crée simplement `TikTokPublisher : IPublisher` et on l'enregistre dans DI. On ne modifie pas `PublisherFactory`, pas `IPublisher`, pas `PublicationsController`.

### L — Liskov Substitution Principle

> Un sous-type doit pouvoir remplacer son type de base sans erreur.

**Exemple :**
Partout où on utilise `IPublisher`, on peut substituer `LinkedInPublisher`, `ThreadsPublisher` ou `FacebookPublisher` sans que le code appelant ne le sache ni ne se comporte différemment.

### I — Interface Segregation Principle

> Des interfaces petites et spécifiques valent mieux qu'une grosse interface générale.

**Exemple :**
Au lieu d'une interface `ISocialService` avec 20 méthodes, on a :
- `IPublisher` → uniquement `PublishAsync()`
- `ISocialAuthService` → `GetLoginUrl()` + `HandleCallbackAsync()`
- `ISocialCredentialStore` → `StoreAsync()` + `GetAccessTokenAsync()`

### D — Dependency Inversion Principle

> Dépendre des abstractions, pas des implémentations.

**Exemple :**
`AiContentService` (Application) dépend de `ILocalAiBackendClient` (interface).
Il ne connaît pas `LocalAiBackendClient` (Infrastructure) qui fait les vrais appels HTTP.

Ce principe est la base même de la Clean Architecture.

---

## 11. Clean Architecture — extensibilité, dépendance, testabilité

### Règle fondamentale

**Les dépendances ne vont que vers l'intérieur.**

```
API → Application → Domain  ← Infrastructure
```

- **Domain** : ne dépend de rien.
- **Application** : dépend du Domain, déclare des interfaces.
- **Infrastructure** : implémente les interfaces déclarées par Application.
- **API** : orchestre Application et Infrastructure, configure DI.

### Exemple concret d'extensibilité

**Scénario : on veut ajouter TikTok comme nouvelle plateforme.**

Fichiers à créer :
1. `Domain/Models/SocialPlatform.cs` → ajouter `TikTok` à l'enum.
2. `Infrastructure/Publishers/TikTokPublisher.cs` → implémenter `IPublisher`.
3. `Infrastructure/DI` → enregistrer `TikTokPublisher` comme `IPublisher`.

Fichiers **non modifiés** :
- `PublisherFactory` → aucun changement.
- `PublicationsController` → aucun changement.
- `PostPublication` → aucun changement.
- Tous les autres publishers → aucun changement.

C'est le principe Open/Closed appliqué via Clean Architecture.

### Exemple concret de testabilité

**Test unitaire du `BrandImportProcessor` sans base de données :**

```csharp
// Arrange
var mockRepo = new Mock<IBrandStudioRepository>();
var mockAiClient = new Mock<ILocalAiBackendClient>();
var mockTextGen = new Mock<ITextGenerationService>();
var mockConfig = new Mock<IConfiguration>();
mockConfig.Setup(c => c["AI:ProviderMode"]).Returns("ExternalProviders");
mockTextGen.Setup(t => t.GenerateTextAsync(It.IsAny<string>(), ...))
           .ReturnsAsync("{ \"parsed_profile\": {...} }");

var processor = new BrandImportProcessor(
    mockRepo.Object, mockAiClient.Object,
    mockTextGen.Object, mockConfig.Object);

// Act
await processor.ProcessAsync(1, CancellationToken.None);

// Assert
mockTextGen.Verify(t => t.GenerateTextAsync(...), Times.Once);
mockAiClient.Verify(a => a.AnalyzeBrandAsync(...), Times.Never); // ExternalProviders mode
```

Sans Clean Architecture (sans interfaces), on ne pourrait pas mocker la base de données ni le client IA.

### Exemple concret d'inversion de dépendance

```
AiContentService (Application)
    ↓ dépend de (interface)
ITextGenerationService (Application/Interfaces)
    ↑ implémenté par
TextGenerationService (Infrastructure)
    → appelle Groq API
```

Si demain on veut passer à Claude d'Anthropic, on crée `AnthropicTextGenerationService : ITextGenerationService` et on change une ligne dans la DI. L'`AiContentService` n'est pas modifié.

---

## 12. Rôle des Controllers

### Définition

Un Controller est la **porte d'entrée HTTP** de l'application. Il :
1. Reçoit la requête HTTP.
2. Valide les données d'entrée.
3. Extrait l'identité de l'utilisateur (claims JWT).
4. Délègue au service Application.
5. Retourne le code HTTP approprié.

### Ce qu'un Controller NE fait PAS

- Pas de logique métier (accès DB, calculs, règles).
- Pas d'appels directs aux repositories.
- Pas de manipulation de données.

### Exemple dans notre projet

```csharp
[ApiController]
[Authorize]
[Route("api/teams/{teamId:guid}/social-accounts")]
public class SocialAccountsController : ControllerBase
{
    private readonly ISocialAccountService _socialAccountService;

    [HttpPost]
    public async Task<ActionResult<SocialAccountResponseDto>> Create(
        Guid teamId, [FromBody] CreateSocialAccountDto dto)
    {
        var userId = GetCurrentUserId();  // Extraction du JWT
        if (string.IsNullOrEmpty(userId))
            return Unauthorized("...");   // Validation

        var result = await _socialAccountService.CreateAsync(teamId, userId, dto);  // Délégation
        return CreatedAtAction(..., result);  // Réponse HTTP 201
    }
}
```

Le controller fait exactement 3 choses : extraire l'identité → déléguer → retourner le bon code HTTP.

---

## 13. Dependency Injection et Entity Framework Core

### Dependency Injection (DI)

#### Définition

La DI est un pattern dans lequel les dépendances d'une classe lui sont **fournies de l'extérieur** au lieu d'être créées à l'intérieur. ASP.NET Core intègre un conteneur DI natif.

#### Avantages

- **Testabilité** : on peut injecter des mocks à la place des implémentations réelles.
- **Extensibilité** : changer d'implémentation = changer une seule ligne dans `Program.cs`.
- **Durée de vie contrôlée** : `Scoped` (par requête), `Singleton` (partagé), `Transient` (à chaque injection).

#### Dans notre projet

```csharp
// Dans AddProjectDependencies() (Infrastructure/DependencyInjection.cs)
services.AddScoped<IBrandStudioRepository, BrandStudioRepository>();
services.AddScoped<ITextGenerationService, TextGenerationService>();
services.AddScoped<IEmailService, SmtpEmailService>();
services.AddScoped<ISocialCredentialStore, ProtectedSocialCredentialStore>();
services.AddSingleton<IPublisherFactory, PublisherFactory>();
```

La classe `BrandImportProcessor` déclare ses besoins dans son constructeur → le conteneur les résout automatiquement.

### Entity Framework Core

#### Définition

EF Core est un **ORM** (Object-Relational Mapper) : il traduit les classes C# en tables SQL et vice-versa.

#### Fonctionnement

```csharp
// 1. On déclare une entité
public class ContentPost
{
    public int Id { get; set; }
    public string Title { get; set; }
    public Guid TeamId { get; set; }
    public Team Team { get; set; }
}

// 2. On la déclare dans le DbContext
public DbSet<ContentPost> ContentPosts { get; set; }

// 3. EF Core génère la migration SQL
// dotnet ef migrations add AddContentPost
// → CREATE TABLE "ContentPosts" (Id INT, Title TEXT, TeamId UUID, ...)

// 4. On requête en C# (pas en SQL)
var posts = await _context.ContentPosts
    .Where(p => p.TeamId == teamId)
    .Include(p => p.Variants)
    .ToListAsync();
```

#### Pourquoi EF Core et pas Dapper ?

| | EF Core | Dapper |
|---|---|---|
| Productivité | Très haute (migrations auto) | Moyenne (SQL manuel) |
| Migrations | Automatiques et versionnées | Manuelles |
| Relations | Navigation properties | Joins manuels |
| Performances | Très bonnes avec AsNoTracking | Meilleures pour requêtes complexes |
| Courbe | Modérée | Faible |

Pour notre projet avec Clean Architecture et évolution rapide du schéma, EF Core est le bon choix.

---

## 14. Pourquoi Buffer, LinkedIn Pages et Pomelli dans l'état de l'art ?

### Justification du choix de ces 3 outils

Ces outils ont été choisis car ils représentent **3 catégories distinctes** :

| Outil | Catégorie | Ce qu'il fait bien | Sa limite |
|---|---|---|---|
| **Buffer** | Planification multi-plateforme | Publication, calendrier, analytics basiques | IA très limitée, pas de génération de contenu avancée |
| **LinkedIn Pages** | Natif mono-plateforme | Intégration parfaite LinkedIn | 1 seule plateforme, pas de multi-canal |
| **Pomelli** | Génération IA | Posts générés par IA | Pas de publication multi-plateforme intégrée |

### Pourquoi pas Hootsuite, Sprout Social, Later... ?

Le jury peut poser cette question. La réponse est :

- **Hootsuite / Sprout Social** : excellents pour la planification, mais l'IA y est superficielle (suggestions basiques). Surtout, ils ne proposent pas d'orchestration IA bout-en-bout (stratégie → planning → contenu → publication).
- **Later** : centré Instagram, pas vraiment multi-plateforme au sens large.
- **Jasper / Copy.ai** : génèrent du texte mais n'ont aucune capacité de publication.

**La conclusion de notre analyse** : aucun outil existant ne combine les 5 modules que nous proposons (Brand Studio + Stratégie IA + Planning + Génération multi-plateforme + Publication + Analytics). AiContentFlow comble exactement cette lacune.

---

## 15. Pourquoi Clean Architecture et .NET ?

### Pourquoi Clean Architecture ?

#### Arguments

1. **Séparation des préoccupations** : la logique métier (Application/Domain) ne dépend d'aucun framework. On peut tester sans base de données.
2. **Évolutivité** : ajouter une plateforme, changer de LLM, remplacer l'ORM → modifications localisées dans Infrastructure.
3. **Maintenabilité** : chaque développeur sait exactement où mettre son code.
4. **Testabilité** : les interfaces permettent de mocker n'importe quelle dépendance.

#### Alternatives considérées

| Architecture | Avantage | Inconvénient |
|---|---|---|
| MVC classique | Simple, rapide à démarrer | Logique métier éparpillée dans les controllers |
| Monolithique en couches | Familier | Couplage fort, difficile à tester |
| Microservices | Scalabilité extrême | Complexité opérationnelle excessive pour un PFE |
| **Clean Architecture** | Testable, extensible | Légère courbe au démarrage |

Clean Architecture est le bon compromis pour un projet qui doit évoluer (agents IA, nouvelles plateformes) sans devenir incontrôlable.

### Pourquoi .NET / ASP.NET Core 10 ?

| Critère | .NET 10 | Node.js | Spring Boot (Java) |
|---|---|---|---|
| Performance | **Top 3 mondial** (TechEmpower benchmarks) | Bonne | Bonne |
| Type safety | **C# statiquement typé** | JS (optionnel avec TS) | Java statiquement typé |
| Async/await | Natif, performant (Thread Pool) | Event loop | CompletableFuture |
| EF Core | Mature, migrations automatiques | Prisma (moins mature) | Hibernate |
| Hangfire | Support natif PostgreSQL | Pas d'équivalent natif | Spring Batch |
| JWT + OAuth | Intégré dans ASP.NET Core Identity | Bibliothèques tierces | Spring Security |
| Cross-platform | Linux / Windows / Mac | Linux / Windows / Mac | Linux / Windows / Mac |
| LTS | .NET 10 LTS (support long terme) | LTS versions | LTS |

ASP.NET Core 10 offre la productivité maximale pour une application REST avec authentification, DI, background jobs et ORM intégrés.

---

## 16. Pourquoi React 19 et FSD ?

### Pourquoi React 19 ?

| Critère | React 19 | Angular | Vue 3 |
|---|---|---|---|
| Popularité | **#1 mondial** | #3 | #2 |
| Écosystème | **Immense** (npm, bibliothèques) | Moyen | Bon |
| Courbe d'apprentissage | Modérée | Steep | Faible |
| TypeScript | Support excellent | Intégré | Support excellent |
| Performance | **React Compiler** (v19) | Bon | Bon |
| Communauté | Très large | Large | Moyenne |

**React 19 spécifiquement** apporte :
- **React Compiler** : optimisation automatique du rendu (réduit les re-renders inutiles sans `useMemo`/`useCallback` manuels).
- **Actions** : gestion native des mutations asynchrones.
- **use() hook** : lecture des Promises directement dans les composants.

### Pourquoi FSD (Feature-Sliced Design) ?

FSD est une **architecture frontend** qui organise le code par fonctionnalité plutôt que par type de fichier.

#### Structure conventionnelle (sans FSD)

```
src/
  components/   → tout mélangé
  services/     → tout mélangé
  hooks/        → tout mélangé
```

#### Structure FSD

```
src/
  app/          → configuration globale
  pages/        → pages de l'application
  features/
    brand-studio/    → import, formulaire marque
    campaigns/       → création campagne, stratégie, planning
    publications/    → calendrier, publication
    analytics/       → métriques, graphiques
  entities/
    content-post/    → types, hooks liés aux posts
    social-account/  → types, hooks liés aux comptes
  shared/
    ui/          → composants réutilisables
    api/         → client Axios
    lib/         → utilitaires
```

**Avantages pour notre projet :**
- Un développeur travaillant sur `campaigns` ne touche que le slice `campaigns`.
- Pas de dépendances circulaires (les slices ne s'importent pas entre eux à même niveau).
- Extensible : ajouter un module = ajouter un slice sans toucher les autres.

---

## 17. Pourquoi Hangfire ?

### Problème à résoudre

La publication sur les réseaux sociaux doit se faire à une **date et heure précises**, même si l'utilisateur n'est pas connecté à ce moment-là. On ne peut pas bloquer une requête HTTP pendant des heures.

### Solution : background jobs avec Hangfire

Hangfire est une bibliothèque .NET qui permet de créer et d'exécuter des **tâches en arrière-plan** de façon fiable, avec persistance dans la base de données.

### Jobs dans notre projet

**Définis dans `Program.cs` :**

```csharp
// Toutes les minutes : vérifie les publications à publier
recurringJobs.AddOrUpdate<PublishScheduledVariantsJob>(
    "publish-scheduled-variants",
    job => job.ExecuteAsync(CancellationToken.None),
    Cron.Minutely);

// Toutes les heures : synchronise les métriques d'engagement
recurringJobs.AddOrUpdate<SyncPublicationAnalyticsJob>(
    "sync-publication-analytics",
    job => job.ExecuteAsync(CancellationToken.None),
    Cron.Hourly);

// Tous les jours : renouvelle les tokens OAuth expirés
recurringJobs.AddOrUpdate<SocialTokenRefreshJob>(
    "social-token-refresh",
    job => job.ExecuteAsync(CancellationToken.None),
    Cron.Daily);
```

### Pourquoi Hangfire et pas une alternative ?

| Critère | Hangfire | Quartz.NET | Azure Service Bus | Cron Linux |
|---|---|---|---|---|
| Persistance | **PostgreSQL** (déjà utilisé) | SQL / RAM | Azure (payant) | Aucune |
| Retry automatique | **Oui** | Manuel | Oui | Non |
| Dashboard web | **/hangfire** intégré | Non | Azure Portal | Non |
| Intégration .NET DI | **Natif** | Partielle | SDK | Non |
| CRON + Jobs one-shot | Les deux | Les deux | Non | CRON seulement |
| Coût | **Gratuit** (open source) | Gratuit | Payant | Gratuit |

**Hangfire stocke ses jobs dans PostgreSQL** (même base que l'application), ce qui évite d'ajouter un service externe. Le dashboard `/hangfire` permet de visualiser, retenter ou annuler des jobs en temps réel.

### Garanties de fiabilité

- Si le serveur redémarre pendant l'exécution d'un job, Hangfire le **retente automatiquement** au redémarrage.
- Les jobs ratés après N tentatives passent en état `Failed` et sont visibles dans le dashboard.
- Le verrouillage pessimiste en base garantit qu'un job n'est exécuté qu'**une seule fois**, même avec plusieurs instances du serveur.

---

## 18. Autres questions probables du jury

### Sur la sécurité

**Q : Comment protégez-vous l'API contre les attaques par force brute ?**
> Rate Limiter ASP.NET Core natif. Deux politiques : `auth` (20 req/min par IP) et `sensitive` (30 req/min par user). Code HTTP 429 retourné si dépassé.

**Q : Comment fonctionne votre système JWT ?**
> À la connexion, on génère un Access Token (courte durée, 15-60 min) et un Refresh Token (longue durée, stocké en base). Le client envoie le JWT dans chaque header `Authorization: Bearer <token>`. À expiration, le Refresh Token permet d'en obtenir un nouveau sans reconnexion.

**Q : Que se passe-t-il si un token OAuth LinkedIn expire ?**
> `SocialTokenRefreshJob` (Hangfire, quotidien) détecte les tokens proches de l'expiration et les renouvelle automatiquement via le Refresh Token LinkedIn. Si le refresh échoue, le compte est marqué comme nécessitant une reconnexion.

**Q : Vos tokens sociaux sont-ils sécurisés si la base de données fuit ?**
> Oui. Ils sont chiffrés avec AES-GCM 256-bit dans `ProtectedSocialCredentialStore`. La clé est dérivée du secret JWT (stocké dans les variables d'environnement, pas en base). Un attaquant avec la DB seule ne peut pas déchiffrer les tokens.

---

### Sur l'IA

**Q : Quelle est la différence entre Groq et Ollama ?**
> Groq est une API cloud (inférence GPU ultra-rapide sur des puces LPU) pour des modèles comme llama-3.3-70b. Ollama est une solution locale qui fait tourner des modèles sur la machine du développeur. On utilise Ollama pour les embeddings (nomic-embed-text) et Groq pour la génération de texte.

**Q : Comment fonctionne le RAG (Retrieval-Augmented Generation) ?**
> La marque est vectorisée lors de l'import (texte → vecteurs via Ollama nomic-embed-text → Qdrant). Lors de la génération, on récupère les chunks les plus proches sémantiquement (top-K) et on les injecte dans le prompt. Ainsi l'IA génère du contenu aligné avec la marque sans avoir été fine-tunée dessus.

**Q : Pourquoi LangGraph pour l'orchestrateur ?**
> LangGraph permet de modéliser le pipeline d'agents comme un graphe d'états. Chaque nœud est une étape (récupération contexte, tendances, stratégie, contenu, révision). Le graphe est compilé en avance (`graph.compile()`), ce qui permet de visualiser et déboguer le flux d'exécution via un diagramme Mermaid (`/api/orchestrator/graph/mermaid`).

---

### Sur le frontend

**Q : Pourquoi Vite et pas Create React App ou Next.js ?**
> Vite offre des temps de démarrage et de rechargement à chaud (HMR) 10-100x plus rapides que Webpack (utilisé par CRA). Next.js ajouterait du SSR/SSG dont on n'a pas besoin pour une SPA d'administration. Vite est le standard moderne pour les SPA React en 2025.

**Q : Comment gérez-vous l'état global côté frontend ?**
> Zustand (store léger) pour l'état global (équipe sélectionnée, utilisateur connecté). React Query / TanStack Query pour le cache des données serveur (posts, campagnes, analytics) avec invalidation automatique.

---

### Sur l'architecture générale

**Q : Votre système est-il scalable ?**
> Oui, à plusieurs niveaux : (1) le backend .NET peut être déployé en plusieurs instances (Hangfire utilise PostgreSQL comme coordinateur), (2) PostgreSQL supporte la réplication et le sharding, (3) le backend Python peut être scalé indépendamment avec plusieurs workers uvicorn. La séparation backend .NET / Python permet aussi de scaler les deux composants indépendamment selon la charge.

**Q : Pourquoi deux backends (.NET et Python) et pas un seul ?**
> Les deux domaines ont des écosystèmes radicalement différents. Python est la référence absolue pour l'IA : LangChain, LangGraph, transformers, FAISS, Qdrant, scraping. .NET est supérieur pour les APIs REST d'entreprise : authentification, ORM, sécurité, background jobs. Les utiliser ensemble (polyglot architecture) est une approche industri ellement validée.

**Q : Comment gérez-vous les erreurs entre le .NET et le Python ?**
> `LocalAiBackendClient` intercepte toutes les exceptions HTTP. Si le backend Python est indisponible (timeout, 5xx), le `AiContentService` vérifie `IsExternalProviderMode()` et bascule sur Groq directement. Les erreurs sont loggées et propagées avec des messages clairs vers le frontend.

**Q : Comment testez-vous votre application ?**
> Tests unitaires .NET avec xUnit + Moq (le projet `AiContentFlow.Application.Tests` contient des tests pour les services, les publishers et les utilitaires comme `VariantContentMerge`). Les interfaces et la Clean Architecture rendent les mocks triviaux. Côté Python, des tests unitaires pytest testent les services IA.

---

*Document généré le 2026-06-24 — AiContentFlow PFE ISIMM*
