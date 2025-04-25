
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.6.0
 * Query Engine version: f676762280b54cd07c770017ed3711ddde35f37a
 */
Prisma.prismaVersion = {
  client: "6.6.0",
  engine: "f676762280b54cd07c770017ed3711ddde35f37a"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.AccountScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  provider: 'provider',
  providerAccountId: 'providerAccountId',
  refresh_token: 'refresh_token',
  access_token: 'access_token',
  expires_at: 'expires_at',
  token_type: 'token_type',
  scope: 'scope',
  id_token: 'id_token',
  session_state: 'session_state'
};

exports.Prisma.ClientSatisfactionScalarFieldEnum = {
  id: 'id',
  rating: 'rating',
  feedback: 'feedback',
  createdAt: 'createdAt',
  userId: 'userId',
  accountRepId: 'accountRepId'
};

exports.Prisma.ConversationScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  isStarred: 'isStarred',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  gaAccountId: 'gaAccountId',
  gaPropertyId: 'gaPropertyId',
  userId: 'userId'
};

exports.Prisma.GaAccountScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  gaAccountId: 'gaAccountId',
  gaAccountName: 'gaAccountName'
};

exports.Prisma.GaPropertyScalarFieldEnum = {
  id: 'id',
  gaPropertyId: 'gaPropertyId',
  gaPropertyName: 'gaPropertyName',
  gaAccountId: 'gaAccountId'
};

exports.Prisma.GaImportRunScalarFieldEnum = {
  id: 'id',
  gaPropertyId: 'gaPropertyId',
  dateStart: 'dateStart',
  dateEnd: 'dateEnd',
  status: 'status',
  errorMessage: 'errorMessage',
  requestedByUserId: 'requestedByUserId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.GaKpiDailyScalarFieldEnum = {
  id: 'id',
  gaPropertyId: 'gaPropertyId',
  date: 'date',
  sessions: 'sessions',
  screenPageViewsPerSession: 'screenPageViewsPerSession',
  engagementRate: 'engagementRate',
  avgSessionDurationSec: 'avgSessionDurationSec',
  goalCompletions: 'goalCompletions',
  goalCompletionRate: 'goalCompletionRate',
  createdAt: 'createdAt'
};

exports.Prisma.GaKpiMonthlyScalarFieldEnum = {
  id: 'id',
  gaPropertyId: 'gaPropertyId',
  month: 'month',
  sessions: 'sessions',
  screenPageViewsPerSession: 'screenPageViewsPerSession',
  engagementRate: 'engagementRate',
  avgSessionDurationSec: 'avgSessionDurationSec',
  goalCompletions: 'goalCompletions',
  goalCompletionRate: 'goalCompletionRate',
  createdAt: 'createdAt'
};

exports.Prisma.GaChannelDailyScalarFieldEnum = {
  id: 'id',
  gaPropertyId: 'gaPropertyId',
  date: 'date',
  channelGroup: 'channelGroup',
  sessions: 'sessions',
  screenPageViewsPerSession: 'screenPageViewsPerSession',
  engagementRate: 'engagementRate',
  avgSessionDurationSec: 'avgSessionDurationSec',
  goalCompletions: 'goalCompletions',
  goalCompletionRate: 'goalCompletionRate',
  createdAt: 'createdAt'
};

exports.Prisma.GaSourceDailyScalarFieldEnum = {
  id: 'id',
  gaPropertyId: 'gaPropertyId',
  date: 'date',
  trafficSource: 'trafficSource',
  sessions: 'sessions',
  screenPageViewsPerSession: 'screenPageViewsPerSession',
  engagementRate: 'engagementRate',
  avgSessionDurationSec: 'avgSessionDurationSec',
  goalCompletions: 'goalCompletions',
  goalCompletionRate: 'goalCompletionRate',
  createdAt: 'createdAt'
};

exports.Prisma.SessionScalarFieldEnum = {
  id: 'id',
  sessionToken: 'sessionToken',
  userId: 'userId',
  expires: 'expires'
};

exports.Prisma.VerificationTokenScalarFieldEnum = {
  identifier: 'identifier',
  token: 'token',
  expires: 'expires'
};

exports.Prisma.RoleScalarFieldEnum = {
  id: 'id',
  name: 'name',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MessageScalarFieldEnum = {
  id: 'id',
  content: 'content',
  isRead: 'isRead',
  archived: 'archived',
  isThreadStart: 'isThreadStart',
  threadId: 'threadId',
  parentId: 'parentId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  senderId: 'senderId',
  recipientId: 'recipientId'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  type: 'type',
  title: 'title',
  content: 'content',
  isRead: 'isRead',
  createdAt: 'createdAt',
  userId: 'userId'
};

exports.Prisma.ParsedPieGraphDataScalarFieldEnum = {
  id: 'id',
  queryId: 'queryId',
  channel: 'channel',
  source: 'source',
  sessions: 'sessions',
  conversionRate: 'conversionRate',
  conversions: 'conversions',
  bounces: 'bounces',
  prevSessionsDiff: 'prevSessionsDiff',
  prevConversionRateDiff: 'prevConversionRateDiff',
  prevConversionsDiff: 'prevConversionsDiff',
  prevBouncesDiff: 'prevBouncesDiff',
  yearSessionsDiff: 'yearSessionsDiff',
  yearConversionRateDiff: 'yearConversionRateDiff',
  yearConversionsDiff: 'yearConversionsDiff',
  yearBouncesDiff: 'yearBouncesDiff',
  createdAt: 'createdAt'
};

exports.Prisma.ParsedQueryDataScalarFieldEnum = {
  id: 'id',
  queryId: 'queryId',
  date: 'date',
  channel: 'channel',
  source: 'source',
  sessions: 'sessions',
  conversionRate: 'conversionRate',
  conversions: 'conversions',
  bounces: 'bounces',
  createdAt: 'createdAt',
  engagedSessions: 'engagedSessions',
  bounceRate: 'bounceRate',
  newUsers: 'newUsers'
};

exports.Prisma.ParsedQuerySummaryScalarFieldEnum = {
  id: 'id',
  queryId: 'queryId',
  date: 'date',
  totalEngagedSessions: 'totalEngagedSessions',
  averageBounceRate: 'averageBounceRate',
  totalNewUsers: 'totalNewUsers',
  totalConversions: 'totalConversions',
  createdAt: 'createdAt'
};

exports.Prisma.QueryScalarFieldEnum = {
  id: 'id',
  content: 'content',
  response: 'response',
  status: 'status',
  rating: 'rating',
  metadata: 'metadata',
  lineGraphData: 'lineGraphData',
  pieGraphData: 'pieGraphData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  userId: 'userId',
  conversationId: 'conversationId'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  password: 'password',
  emailVerified: 'emailVerified',
  image: 'image',
  roleId: 'roleId',
  isActive: 'isActive',
  accountRepId: 'accountRepId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserSettingsScalarFieldEnum = {
  id: 'id',
  emailNotifications: 'emailNotifications',
  theme: 'theme',
  apiCredits: 'apiCredits',
  apiCreditsLimit: 'apiCreditsLimit',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  userId: 'userId'
};

exports.Prisma.TicketScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  status: 'status',
  priority: 'priority',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  assignedToId: 'assignedToId',
  clientId: 'clientId'
};

exports.Prisma.TicketAttachmentScalarFieldEnum = {
  id: 'id',
  name: 'name',
  url: 'url',
  createdAt: 'createdAt',
  ticketId: 'ticketId'
};

exports.Prisma.TicketCommentScalarFieldEnum = {
  id: 'id',
  content: 'content',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  ticketId: 'ticketId',
  authorId: 'authorId'
};

exports.Prisma.TicketTagScalarFieldEnum = {
  id: 'id',
  name: 'name',
  createdAt: 'createdAt'
};

exports.Prisma.MessageAttachmentScalarFieldEnum = {
  id: 'id',
  filename: 'filename',
  fileSize: 'fileSize',
  mimeType: 'mimeType',
  url: 'url',
  createdAt: 'createdAt',
  messageId: 'messageId'
};

exports.Prisma.ClientActivityScalarFieldEnum = {
  id: 'id',
  type: 'type',
  description: 'description',
  status: 'status',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  userId: 'userId'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.ImportStatus = exports.$Enums.ImportStatus = {
  queued: 'queued',
  ok: 'ok',
  error: 'error'
};

exports.NotificationType = exports.$Enums.NotificationType = {
  SYSTEM: 'SYSTEM',
  MESSAGE: 'MESSAGE',
  QUERY_COMPLETE: 'QUERY_COMPLETE',
  REPORT_GENERATED: 'REPORT_GENERATED'
};

exports.QueryStatus = exports.$Enums.QueryStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

exports.TicketStatus = exports.$Enums.TicketStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED'
};

exports.TicketPriority = exports.$Enums.TicketPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH'
};

exports.ActivityStatus = exports.$Enums.ActivityStatus = {
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
  PENDING: 'PENDING'
};

exports.Prisma.ModelName = {
  Account: 'Account',
  ClientSatisfaction: 'ClientSatisfaction',
  Conversation: 'Conversation',
  GaAccount: 'GaAccount',
  GaProperty: 'GaProperty',
  GaImportRun: 'GaImportRun',
  GaKpiDaily: 'GaKpiDaily',
  GaKpiMonthly: 'GaKpiMonthly',
  GaChannelDaily: 'GaChannelDaily',
  GaSourceDaily: 'GaSourceDaily',
  Session: 'Session',
  VerificationToken: 'VerificationToken',
  Role: 'Role',
  Message: 'Message',
  Notification: 'Notification',
  ParsedPieGraphData: 'ParsedPieGraphData',
  ParsedQueryData: 'ParsedQueryData',
  ParsedQuerySummary: 'ParsedQuerySummary',
  Query: 'Query',
  User: 'User',
  UserSettings: 'UserSettings',
  Ticket: 'Ticket',
  TicketAttachment: 'TicketAttachment',
  TicketComment: 'TicketComment',
  TicketTag: 'TicketTag',
  MessageAttachment: 'MessageAttachment',
  ClientActivity: 'ClientActivity'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }

        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
