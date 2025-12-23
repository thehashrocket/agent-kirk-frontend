# Prisma Schema Diagram

This diagram is generated from `prisma/schema.prisma`.

```mermaid
erDiagram
  Account {
    String id PK
    String userId
    String type
    String provider
    String providerAccountId
    String refresh_token "nullable"
    String access_token "nullable"
    Int expires_at "nullable"
    String token_type "nullable"
    String scope "nullable"
    String id_token "nullable"
    String session_state "nullable"
    DateTime createdAt
    DateTime updatedAt
  }

  CampaignRecipients {
    String id PK
    String email "nullable"
    Int delivered
    Int opens
    Int uniqueOpens
    Int clicks
    Int bounces
    Int spamReports
    Int unsubscribes
    String address_1 "nullable"
    String address_2 "nullable"
    String city "nullable"
    String state "nullable"
    String zip "nullable"
    String sector "nullable"
    String market "nullable"
    String addressId "nullable"
    String coreSegment "nullable"
    String subSegment "nullable"
    String emailCampaignId "nullable"
    String uspsCampaignId "nullable"
    String sendgridMessageId "nullable"
    DateTime lastEventAt "nullable"
    String lastEventType "nullable"
    String lastEventDetail "nullable"
    DateTime createdAt
    DateTime updatedAt
  }

  ClientActivity {
    String id PK
    String type
    String description
    ActivityStatus status
    Json metadata "nullable"
    DateTime createdAt
    DateTime updatedAt
    String userId
  }

  ClientSatisfaction {
    String id PK
    Float rating
    String feedback "nullable"
    String userId
    String accountRepId
    DateTime createdAt
  }

  Company {
    String id PK
    String name
    DateTime createdAt
    DateTime updatedAt
  }

  Conversation {
    String id PK
    String title
    Boolean isStarred
    DateTime createdAt
    DateTime updatedAt
    String userId
    String description "nullable"
    String gaAccountId "nullable"
    String gaPropertyId "nullable"
    String clientId "nullable"
  }

  EmailCampaign {
    String id PK
    DateTime createdAt
    DateTime updatedAt
    String campaignId UK
    String campaignName
    String status "nullable"
    String[] categories
    DateTime sendAt "nullable"
    DateTime singleSendCreatedAt "nullable"
    DateTime singleSendUpdatedAt "nullable"
    Boolean isAbTest "nullable"
    Json abTest "nullable"
    String emailClientId
  }

  EmailCampaignContent {
    String id PK
    String subject
    String type
    Int recipients
    DateTime createdAt
    DateTime updatedAt
    String contentType
    DateTime createTime
    String emailCampaignId UK
    String htmlContent
    String plainContent
    DateTime sendTime
    String webId
  }

  EmailCampaignDailyStats {
    String id PK
    DateTime date
    Int opens
    Int clicks
    Int bounces
    Int unsubscribes
    String variation
    String phase
    Int requests
    Int delivered
    DateTime createdAt
    DateTime updatedAt
    Int bounceDrops
    Int cumulativeBounceRate
    Int cumulativeSpamReportsRate
    Int cumulativeTotalClickRate
    Int cumulativeTotalOpenRate
    Int cumulativeUniqueClickRate
    Int cumulativeUniqueOpenRate
    Int cumulativeUnsubscribeRate
    Int dailyBounceRate
    Int dailySpamReportsRate
    Int dailyTotalClickRate
    Int dailyTotalClickToOpenRate
    Int dailyTotalOpenRate
    Int dailyUniqueClickRate
    Int dailyUniqueClickToOpenRate
    Int dailyUniqueOpenRate
    Int dailyUnsubscribeRate
    String emailCampaignId
    String emailClientId
    String singleSendName
    Int spamReportDrops
    Int spamReports
    Int totalClicks
    Int totalOpens
    Int uniqueClicks
    Int uniqueOpens
  }

  EmailClient {
    String id PK
    DateTime createdAt
    DateTime updatedAt
    String clientName
  }

  EmailClientCredentials {
    String id PK
    DateTime createdAt
    DateTime updatedAt
    String apiKey
    String emailClientId
    String platformName
  }

  EmailGlobalDailyStats {
    String id PK
    DateTime date
    DateTime createdAt
    DateTime updatedAt
    Int bounces
    Int clicks
    String emailClientId
    Int opens
    Int unsubs
  }

  GaAccount {
    String id PK
    String gaAccountId UK
    String gaAccountName
    Boolean deleted
    DateTime createdAt
    DateTime updatedAt
  }

  GaProperty {
    String id PK
    String gaPropertyId UK
    String gaPropertyName
    String gaAccountId
    Boolean deleted
    DateTime createdAt
    DateTime updatedAt
  }

  GaImportRun {
    String id PK
    String gaPropertyId
    DateTime dateStart
    DateTime dateEnd
    ImportStatus status
    String errorMessage "nullable"
    String requestedByUserId
    DateTime createdAt
    DateTime updatedAt
  }

  GaKpiDaily {
    String id PK
    String gaPropertyId
    DateTime date
    Int sessions
    Float screenPageViewsPerSession
    Float engagementRate
    Int avgSessionDurationSec
    Int goalCompletions
    Float goalCompletionRate
    DateTime createdAt
    DateTime updatedAt
  }

  GaKpiMonthly {
    String id PK
    String gaPropertyId
    Int month
    Int sessions
    Float screenPageViewsPerSession
    Float engagementRate
    Int avgSessionDurationSec
    Int goalCompletions
    Float goalCompletionRate
    DateTime createdAt
    DateTime updatedAt
  }

  GaChannelDaily {
    String id PK
    String gaPropertyId
    DateTime date
    String channelGroup
    Int sessions
    Float screenPageViewsPerSession
    Float engagementRate
    Int avgSessionDurationSec
    Int goalCompletions
    Float goalCompletionRate
    DateTime createdAt
    DateTime updatedAt
    Int newUsers
    Int users
  }

  GaSourceDaily {
    String id PK
    String gaPropertyId
    DateTime date
    String trafficSource
    Int sessions
    Float screenPageViewsPerSession
    Float engagementRate
    Int avgSessionDurationSec
    Int goalCompletions
    Float goalCompletionRate
    DateTime createdAt
    DateTime updatedAt
    Int newUsers
    Int users
  }

  Log {
    String id PK
    String eventMessage "nullable"
    String eventType "nullable"
    String errorMessage "nullable"
    String errorStackTrace "nullable"
    String message "nullable"
    Json metrics "nullable"
    String nodeName "nullable"
    Json payload "nullable"
    String queryId "nullable"
    Json sourceReferences "nullable"
    String userId "nullable"
    String workflowName "nullable"
    String environment "nullable"
    String serviceName "nullable"
    String version "nullable"
    String requestId "nullable"
    String sessionId "nullable"
    String ipAddress "nullable"
    String userAgent "nullable"
    Int duration "nullable"
    Int memoryUsage "nullable"
    Float cpuUsage "nullable"
    String severity "nullable"
    Boolean isAuthenticated "nullable"
    Json permissions "nullable"
    String modelName "nullable"
    Json tokenUsage "nullable"
    Float temperature "nullable"
    Int maxTokens "nullable"
    String clientId "nullable"
    String pageUrl "nullable"
    String componentName "nullable"
    String errorCode "nullable"
    String errorCategory "nullable"
    Int retryCount "nullable"
    DateTime createdAt
    DateTime updatedAt
  }

  Memory {
    String id PK
    String content
    String queryId
    DateTime createdAt
    DateTime updatedAt
    String userId
  }

  Message {
    String id PK
    String content
    String senderId
    String recipientId
    Boolean isRead
    DateTime createdAt
    DateTime updatedAt
    Boolean archived
    Boolean isThreadStart
    String parentId "nullable"
    String threadId "nullable"
  }

  MessageAttachment {
    String id PK
    String filename
    Int fileSize
    String mimeType
    String url
    DateTime createdAt
    String messageId
  }

  Notification {
    String id PK
    String userId
    NotificationType type
    String title
    String content
    Boolean isRead
    DateTime createdAt
    DateTime updatedAt
    String link "nullable"
  }

  ParsedPieGraphData {
    String id PK
    String queryId
    String channel
    String source
    Int sessions
    Float conversionRate
    Int conversions
    Int bounces
    Float prevSessionsDiff
    Float prevConversionRateDiff
    Float prevConversionsDiff
    Float prevBouncesDiff
    Float yearSessionsDiff
    Float yearConversionRateDiff
    Float yearConversionsDiff
    Float yearBouncesDiff
    DateTime createdAt
    DateTime updatedAt
  }

  ParsedQueryData {
    String id PK
    String queryId
    DateTime date
    String channel
    String source
    Int sessions
    Float conversionRate
    Int conversions
    Int bounces
    DateTime createdAt
    Float bounceRate "nullable"
    Int engagedSessions "nullable"
    Int newUsers "nullable"
  }

  ParsedQuerySummary {
    String id PK
    String queryId
    DateTime date
    Int totalEngagedSessions
    Float averageBounceRate
    Int totalNewUsers
    Int totalConversions
    DateTime createdAt
  }

  Query {
    String id PK
    String userId
    String response "nullable"
    DateTime createdAt
    DateTime updatedAt
    String content
    QueryStatus status
    String conversationId "nullable"
    Int rating
    Json metadata "nullable"
    Json lineGraphData "nullable"
    Json pieGraphData "nullable"
  }

  Role {
    String id PK
    String name UK
    DateTime createdAt
    DateTime updatedAt
  }

  Session {
    String id PK
    String userId
    DateTime expires
    String sessionToken UK
  }

  SproutFacebookAnalytics {
    String id PK
    String sproutSocialAccountId
    Int customerProfileId
    DateTime reportingDate
    Int engagements "nullable"
    Int impressions "nullable"
    Int impressionsUnique "nullable"
    Int followersCount "nullable"
    Int postContentClicks "nullable"
    Int postContentClicksOther "nullable"
    Int postLinkClicks "nullable"
    Int postPhotoViewClicks "nullable"
    Int tabViews "nullable"
    Int videoViews "nullable"
    Int videoViews10s "nullable"
    Int videoViewsOrganic "nullable"
    Int videoViewsPaid "nullable"
    Int videoViewsUnique "nullable"
    DateTime createdAt
    DateTime updatedAt
    Int netFollowerGrowth "nullable"
  }

  SproutFacebookPost {
    String id PK
    String sproutSocialAccountId
    String postType
    String postStatus
    String postLink
    String postText
    String postNativeId
    DateTime postCreatedTime
    DateTime postSentTime
    DateTime postLastUpdated
    DateTime createdAt
    DateTime updatedAt
  }

  SproutFacebookPostAnalytics {
    String id PK
    Int angryReactions "nullable"
    String clientNativeId
    Int commentsCount "nullable"
    Int hahaReactions "nullable"
    Int impressions "nullable"
    Int impressionsFollower "nullable"
    Int impressionsNonFollower "nullable"
    Int impressionsNonViral "nullable"
    Int impressionsOrganic "nullable"
    Int impressionsPaid "nullable"
    Int impressionsViral "nullable"
    Int likes "nullable"
    Int loveReactions "nullable"
    Int postContentClicks "nullable"
    Int postContentClicksOther "nullable"
    Int postLinkClicks "nullable"
    String postNativeId
    Int postPhotoViewClicks "nullable"
    Int postVideoPlayClicks "nullable"
    Int questionAnswers "nullable"
    Int reach "nullable"
    Int reachFollower "nullable"
    Int reachNonViral "nullable"
    Int reachOrganic "nullable"
    Int reachPaid "nullable"
    Int reachViral "nullable"
    Int reactions "nullable"
    DateTime reportingDate
    Int sadReactions "nullable"
    Int sharesCount "nullable"
    String sproutSocialAccountId
    Int videoLength "nullable"
    Int videoViews "nullable"
    Int videoViewsAutoplay "nullable"
    Int videoViewsOrganic "nullable"
    Int videoViewsPaid "nullable"
    Int wowReactions "nullable"
    DateTime createdAt
    DateTime updatedAt
  }

  SproutInstagramAnalytics {
    String id PK
    String sproutSocialAccountId
    Int customerProfileId
    DateTime reportingDate
    Int commentsCount "nullable"
    Int engagements "nullable"
    Int impressions "nullable"
    Int impressionsUnique "nullable"
    Int followersCount "nullable"
    Int likes "nullable"
    Int saves "nullable"
    Int videoViews "nullable"
    DateTime createdAt
    DateTime updatedAt
    Int emailContacts "nullable"
    Int getDirectionsClicks "nullable"
    Int phoneCallClicks "nullable"
    Json postsSendByContentType "nullable"
    Json postsSentByPostType "nullable"
    Int postsSentCount "nullable"
    Int profileFollowerAdds "nullable"
    Int profileFollowers "nullable"
    Int profileImpressionsUnique "nullable"
    Int profileReachUnique "nullable"
    Int profileViews "nullable"
    Int profileViewsUnique "nullable"
    Int websiteClicks "nullable"
  }

  SproutInstagramFollowersByCity {
    String id PK
    String sproutInstagramAnalyticsId
    String city
    Int count
    DateTime createdAt
    DateTime updatedAt
  }

  SproutInstagramFollowersByCountry {
    String id PK
    String sproutInstagramAnalyticsId
    String country
    Int count
    DateTime createdAt
    DateTime updatedAt
  }

  SproutLinkedInAnalytics {
    String id PK
    String sproutSocialAccountId
    Int customerProfileId
    DateTime reportingDate
    Int engagements "nullable"
    Int impressions "nullable"
    Int impressionsUnique "nullable"
    Int followersCount "nullable"
    Int reactions "nullable"
    DateTime createdAt
    DateTime updatedAt
  }

  SproutPinterestAnalytics {
    String id PK
    String sproutSocialAccountId
    Int customerProfileId
    DateTime reportingDate
    Int followersCount "nullable"
    Int followingCount "nullable"
    DateTime createdAt
    DateTime updatedAt
  }

  SproutSocialAccount {
    String id PK
    Int customerProfileId UK
    String networkType
    String name
    String nativeName
    String link
    String nativeId
    Int[] groups
    DateTime createdAt
    DateTime updatedAt
  }

  Ticket {
    String id PK
    String title
    String description
    TicketStatus status
    TicketPriority priority
    DateTime createdAt
    DateTime updatedAt
    String assignedToId "nullable"
    String clientId
  }

  TicketAttachment {
    String id PK
    String name
    String url
    DateTime createdAt
    String ticketId
  }

  TicketComment {
    String id PK
    String content
    DateTime createdAt
    DateTime updatedAt
    String ticketId
    String authorId
  }

  TicketTag {
    String id PK
    String name UK
    DateTime createdAt
  }

  UserToSproutSocialAccount {
    String id PK
    String userId
    String sproutSocialAccountId
    DateTime createdAt
    DateTime updatedAt
  }

  UserToGaAccount {
    String id PK
    String userId
    String gaAccountId
    DateTime createdAt
    DateTime updatedAt
  }

  User {
    String id PK
    String email UK "nullable"
    DateTime createdAt
    DateTime updatedAt
    String roleId
    DateTime emailVerified "nullable"
    String image "nullable"
    String name "nullable"
    String accountRepId "nullable"
    Boolean isActive
    String password "nullable"
    Boolean deleted
    String companyId "nullable"
  }

  UserSettings {
    String id PK
    String userId UK
    Boolean emailNotifications
    DateTime createdAt
    DateTime updatedAt
    String theme "nullable"
    Int apiCredits
    Int apiCreditsLimit
  }

  UserToEmailClient {
    String id PK
    String userId
    String emailClientId
    DateTime createdAt
    DateTime updatedAt
  }

  UserToUspsClient {
    String id PK
    String userId
    String uspsClientId
    DateTime createdAt
    DateTime updatedAt
  }

  UspsCampaign {
    String id PK
    String campaignName UK
    String order "nullable"
    String reportId
    String sector "nullable"
    DateTime sendDate
    String type "nullable"
    String uspsClientId
    DateTime createdAt
    DateTime updatedAt
  }

  UspsCampaignSummary {
    String id PK
    Int finalScanCount
    DateTime mailDate
    Int numberDelivered
    Float percentDelivered
    Float percentFinalScan
    Float percentOnTime
    Float percentScanned
    Int pieces
    String reportId
    DateTime scanDate
    Int totalScanned
    String uspsCampaignId
    DateTime createdAt
    DateTime updatedAt
  }

  UspsCampaignZipStats {
    String id PK
    DateTime date
    Int scans
    String uspsCampaignId
    String zipCode
    DateTime createdAt
    DateTime updatedAt
  }

  UspsClient {
    String id PK
    String clientName
    DateTime createdAt
    DateTime updatedAt
  }

  VerificationToken {
    String identifier
    String token UK
    DateTime expires
  }
  Company o|--o{ User : "company"
  Conversation o|--o{ Query : "conversation"
  EmailCampaign o|--o{ CampaignRecipients : "emailCampaign"
  EmailCampaign ||--o| EmailCampaignContent : "EmailCampaign"
  EmailCampaign ||--o{ EmailCampaignDailyStats : "EmailCampaign"
  EmailClient ||--o{ EmailCampaign : "emailClient"
  EmailClient ||--o{ EmailCampaignDailyStats : "emailClient"
  EmailClient ||--o{ EmailClientCredentials : "emailClient"
  EmailClient ||--o{ EmailGlobalDailyStats : "emailClient"
  EmailClient ||--o{ UserToEmailClient : "emailClient"
  GaAccount o|--o{ Conversation : "gaAccount"
  GaAccount ||--o{ GaProperty : "gaAccount"
  GaAccount ||--o{ UserToGaAccount : "gaAccount"
  GaProperty o|--o{ Conversation : "gaProperty"
  GaProperty ||--o{ GaChannelDaily : "gaProperty"
  GaProperty ||--o{ GaImportRun : "gaProperty"
  GaProperty ||--o{ GaKpiDaily : "gaProperty"
  GaProperty ||--o{ GaKpiMonthly : "gaProperty"
  GaProperty ||--o{ GaSourceDaily : "gaProperty"
  Message o|--o{ Message : "parent"
  Message ||--o{ MessageAttachment : "message"
  Query o|--o{ Log : "query"
  Query ||--o{ ParsedPieGraphData : "query"
  Query ||--o{ ParsedQueryData : "query"
  Query ||--o{ ParsedQuerySummary : "query"
  Role ||--o{ User : "role"
  SproutInstagramAnalytics ||--o{ SproutInstagramFollowersByCity : "sproutInstagramAnalytics"
  SproutInstagramAnalytics ||--o{ SproutInstagramFollowersByCountry : "sproutInstagramAnalytics"
  SproutSocialAccount ||--o{ SproutFacebookAnalytics : "sproutSocialAccount"
  SproutSocialAccount ||--o{ SproutFacebookPost : "sproutSocialAccount"
  SproutSocialAccount ||--o{ SproutFacebookPostAnalytics : "sproutSocialAccount"
  SproutSocialAccount ||--o{ SproutInstagramAnalytics : "sproutSocialAccount"
  SproutSocialAccount ||--o{ SproutLinkedInAnalytics : "sproutSocialAccount"
  SproutSocialAccount ||--o{ SproutPinterestAnalytics : "sproutSocialAccount"
  SproutSocialAccount ||--o{ UserToSproutSocialAccount : "sproutSocialAccount"
  Ticket ||--o{ TicketAttachment : "ticket"
  Ticket ||--o{ TicketComment : "ticket"
  Ticket o{--o{ TicketTag : "many-to-many"
  User ||--o{ Account : "user"
  User ||--o{ ClientActivity : "user"
  User ||--o{ ClientSatisfaction : "accountRep"
  User ||--o{ ClientSatisfaction : "user"
  User o|--o{ Conversation : "client"
  User ||--o{ Conversation : "user"
  User ||--o{ GaImportRun : "requestedBy"
  User o|--o{ Log : "user"
  User ||--o{ Memory : "user"
  User ||--o{ Message : "recipient"
  User ||--o{ Message : "sender"
  User ||--o{ Notification : "user"
  User ||--o{ Query : "user"
  User ||--o{ Session : "user"
  User o|--o{ Ticket : "assignedTo"
  User ||--o{ Ticket : "client"
  User ||--o{ TicketComment : "author"
  User o|--o{ User : "accountRep"
  User ||--o| UserSettings : "user"
  User ||--o{ UserToEmailClient : "user"
  User ||--o{ UserToGaAccount : "user"
  User ||--o{ UserToSproutSocialAccount : "user"
  User ||--o{ UserToUspsClient : "user"
  UspsCampaign o|--o{ CampaignRecipients : "uspsCampaign"
  UspsCampaign ||--o{ UspsCampaignSummary : "UspsCampaign"
  UspsCampaign ||--o{ UspsCampaignZipStats : "UspsCampaign"
  UspsClient ||--o{ UserToUspsClient : "uspsClient"
  UspsClient ||--o{ UspsCampaign : "UspsClient"
```
