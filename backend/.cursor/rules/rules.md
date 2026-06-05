Admin and editor have the same authorities , except that admin can manage team members.
A Channel is a logical publishing workspace/domain inside a Team.
A Channel groups:
links to team-scoped social accounts (optional per platform)
campaigns
publishing configuration
branding identity
publishing strategy
potentially channel-specific members later
A Channel is NOT:
a social media platform
a single social account
a simple content tag
A Channel behaves more like:
a department
a publishing hub
a communication workspace
an operational publishing domain 
However , a user can create posts , schedule them or post them to his social accounts without creating channels (Quick Generate: team-scoped posts with null ChannelId; any team-connected account may publish)

Social accounts are team-scoped. Channels link to existing team accounts via ChannelSocialAccounts (one account per platform per channel). OAuth from a channel auto-links; OAuth from Quick Generate adds to the team only.

8.2 Campaigns belong to Channels
Campaigns operate inside one publishing domain.

8.3 PostVariants are content-only entities
No infrastructure or publishing logic inside variants.
8.4 PostPublications are execution units
Publishing lifecycle management belongs here.
8.5 PublishJobs are infrastructure-level
Jobs are execution mechanisms, not business content.
8.6 Analytics belong to Publications
Never directly to generic posts.
8.7 Avoid God Entities
Do not overload entities with unrelated responsibilities.
8.8 Use JSON carefully
Only for flexible/dynamic provider settings.
8.9 Preserve tenant isolation
Authorization and querying must remain tenant-safe.
9. ENGINEERING GOALS
The architecture should optimize for:
maintainability
scalability
tenant isolation

resiliency
retry safety
clean separation of concerns
extensibility
future platform integrations
AI workflow integration(brand studio will be ai scraped , campaigns can be set manually , or the ai can propose a campaign , detailing the posts and the days that they will be posted , as well as the platforms that they will be posted on )
background processing reliability



