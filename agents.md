# AGENTS.md

# Project: Kids Skill Growth Social Platform Backend API

## 1. Product Summary

This backend powers a social media and skill-growth platform for children, parents, mentors, organizations, and admins.

The platform allows kids to showcase their skills through posts, projects, images, videos, achievements, and events. Parents can manage and approve child activities. Mentors can coach and guide children. Organizations can post opportunities and events. Admins manage verification, moderation, safety, reporting, and platform control.

The app experience is similar to Instagram for posts and LinkedIn for skill discovery, mentoring, and opportunities.

The backend must be designed with child safety, privacy, parental control, moderation, and scalability as first-class requirements.

---

## 2. Main User Roles

The system has the following roles:

```ts
enum UserRole {
  KID
  PARENT
  MENTOR
  ORGANIZATION
  ADMIN
  SUPER_ADMIN
}
2.1 Kid

A kid can:

Create a profile after parent approval.
Select skills and interests.
Post projects, images, videos, and achievements.
Like, comment, save, share, and repost allowed content.
Follow kids, mentors, and organizations.
View skill-based feed.
View recommended events and opportunities.
Join events with parent approval where required.
Chat only where safety rules allow.
Report users, posts, comments, messages, and events.
2.2 Parent

A parent can:

Create and manage parent account.
Link child accounts.
Approve or reject child account requests.
Control child privacy settings.
Approve mentor communication.
Approve event registration.
View child activity summary.
Chat with mentors and organizations.
Report unsafe content or users.
2.3 Mentor

A mentor can:

Create mentor profile.
Submit verification details.
Add expertise and skills.
Post educational content.
Comment and give feedback.
Be assigned to kids by admin.
Chat with kids only after approval.
Create tasks or guidance for assigned kids.
Report unsafe behavior.
2.4 Organization

An organization can:

Create organization profile.
Submit verification details.
Post opportunities.
Create events.
Publish project calls or competitions.
Interact with public content where allowed.
Contact parents/admins for child opportunities.
Not directly contact kids unless platform rules allow and parent/admin approval exists.
2.5 Admin

An admin can:

Manage users.
Approve mentors.
Approve organizations.
Approve/reject posts.
Approve/reject events.
Review reports.
Review flagged chats.
Suspend or ban accounts.
Manage skills and categories.
Assign mentors to kids.
View analytics and platform health.
2.6 Super Admin

A super admin can:

Do everything admin can do.
Manage admin accounts.
Manage system settings.
Manage platform-level permissions.
Access audit logs.
Configure moderation rules.
3. Recommended Backend Stack

Use this stack for MVP:

Framework: NestJS
Language: TypeScript
Database: PostgreSQL
ORM: Prisma
Authentication: JWT + Refresh Tokens, or Firebase Auth integration
File Storage: Firebase Storage / Cloudflare R2 / S3-compatible storage
Realtime Chat: Socket.IO
Validation: class-validator + class-transformer
API Docs: Swagger / OpenAPI
Queue Later: BullMQ + Redis
Cache Later: Redis
Search Later: Meilisearch / OpenSearch
Notifications: Firebase Cloud Messaging
Testing: Jest + Supertest

Start as a modular monolith. Do not start with microservices.

4. Backend Architecture

The backend should be one main API service with internal modules.

skill-platform-api/
  src/
    main.ts
    app.module.ts

    config/
    common/
    prisma/

    auth/
    users/
    kids/
    parents/
    mentors/
    organizations/
    skills/
    posts/
    media/
    follows/
    comments/
    reactions/
    feed/
    events/
    opportunities/
    mentor-assignments/
    chat/
    notifications/
    reports/
    moderation/
    admin/
    search/
    analytics/
    storage/
    safety/
    audit-logs/
5. Core Backend Rules
5.1 Child Safety Comes First

The system must never allow unsafe direct communication or exposure of child data.

Rules:

Kids must be linked to a parent/guardian.
Kids under the configured age threshold require parent approval.
Mentors must be verified before coaching kids.
Organizations must be verified before posting events or opportunities.
Organizations must not directly message kids by default.
Kids must not expose phone number, exact address, school address, or personal contact data.
Admin moderation must exist for posts, comments, reports, events, and flagged messages.
Every report must be stored and reviewable.
Every admin action must be audited.
5.2 Files Are Not Stored in PostgreSQL

PostgreSQL stores only metadata.

Files must be stored in external object storage.

Examples:

/users/{userId}/avatar/avatar.jpg
/posts/{postId}/media/image1.jpg
/posts/{postId}/media/video1.mp4
/events/{eventId}/banner.jpg
/mentor-documents/{mentorId}/certificate.pdf
/organization-documents/{organizationId}/license.pdf
5.3 Use Soft Delete

Most important records should use soft delete.

Use:

deletedAt?: Date

Do not permanently delete sensitive records immediately.

Soft delete applies to:

Users
Posts
Comments
Events
Messages
Reports
Mentor assignments
Organization profiles
5.4 Use Audit Logs

Every sensitive admin action must create an audit log.

Examples:

Approve mentor
Reject mentor
Approve organization
Suspend user
Approve event
Reject post
Resolve report
Assign mentor
View flagged chat
6. Environment Variables

Required .env values:

NODE_ENV=development
PORT=4000

DATABASE_URL="postgresql://user:password@localhost:5432/skill_platform"

JWT_ACCESS_SECRET="replace_me"
JWT_REFRESH_SECRET="replace_me"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="30d"

CORS_ORIGINS="http://localhost:3000,http://localhost:3001"

STORAGE_PROVIDER="firebase"
STORAGE_BUCKET=""
STORAGE_ACCESS_KEY=""
STORAGE_SECRET_KEY=""
STORAGE_REGION=""

FCM_SERVER_KEY=""

REDIS_URL="redis://localhost:6379"

ADMIN_DEFAULT_EMAIL="admin@example.com"
ADMIN_DEFAULT_PASSWORD="change_me"

Never commit .env.

7. Main Database Models

Use PostgreSQL with Prisma.

7.1 Enums
enum UserRole {
  KID
  PARENT
  MENTOR
  ORGANIZATION
  ADMIN
  SUPER_ADMIN
}

enum UserStatus {
  PENDING
  ACTIVE
  SUSPENDED
  BANNED
  DELETED
}

enum VerificationStatus {
  PENDING
  APPROVED
  REJECTED
  NEEDS_MORE_INFO
}

enum ModerationStatus {
  PENDING
  APPROVED
  REJECTED
  FLAGGED
  HIDDEN
}

enum PostType {
  TEXT
  IMAGE
  VIDEO
  PROJECT
  ACHIEVEMENT
  EVENT
  OPPORTUNITY
  REPOST
}

enum Visibility {
  PRIVATE
  PARENTS_ONLY
  FOLLOWERS
  PUBLIC_SAFE
}

enum ChatRoomType {
  KID_PARENT
  KID_MENTOR
  PARENT_MENTOR
  PARENT_ORGANIZATION
  KID_KID
  GROUP
  ADMIN_SUPPORT
}

enum ReportStatus {
  OPEN
  IN_REVIEW
  RESOLVED
  DISMISSED
}

enum NotificationType {
  LIKE
  COMMENT
  FOLLOW
  MENTOR_ASSIGNED
  EVENT_RECOMMENDED
  EVENT_APPROVED
  EVENT_REGISTRATION
  MESSAGE
  REPORT_UPDATE
  ADMIN_NOTICE
}
8. Prisma Schema Plan
8.1 User
model User {
  id              String      @id @default(uuid())
  role            UserRole
  status          UserStatus  @default(PENDING)

  email           String?     @unique
  phone           String?     @unique
  passwordHash    String?

  name            String
  username        String?     @unique
  avatarUrl       String?
  country         String?
  language        String?

  dateOfBirth     DateTime?
  lastLoginAt     DateTime?

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  deletedAt       DateTime?

  kidProfile      KidProfile?
  parentProfile   ParentProfile?
  mentorProfile   MentorProfile?
  organizationProfile OrganizationProfile?

  posts           Post[]
  comments        Comment[]
  reportsMade     Report[]    @relation("ReportsMade")
  notifications   Notification[]

  @@index([role])
  @@index([status])
  @@index([createdAt])
}
8.2 Parent Profile
model ParentProfile {
  id          String   @id @default(uuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id])

  fullName    String
  relation    String?
  country     String?
  phone       String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  children    ParentChildLink[]
}
8.3 Kid Profile
model KidProfile {
  id              String     @id @default(uuid())
  userId          String     @unique
  user            User       @relation(fields: [userId], references: [id])

  displayName     String
  bio             String?
  ageGroup        String?
  country         String?
  language        String?

  visibility      Visibility @default(PRIVATE)
  allowComments   Boolean    @default(true)
  allowChat        Boolean    @default(false)
  allowEventSuggestions Boolean @default(true)

  parentApproved  Boolean    @default(false)

  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  parents         ParentChildLink[]
  skills          KidSkill[]
  eventRegistrations EventRegistration[]
  mentorAssignments MentorAssignment[]

  @@index([parentApproved])
}
8.4 Parent Child Link
model ParentChildLink {
  id              String   @id @default(uuid())

  parentProfileId String
  parentProfile   ParentProfile @relation(fields: [parentProfileId], references: [id])

  kidProfileId    String
  kidProfile      KidProfile @relation(fields: [kidProfileId], references: [id])

  status          VerificationStatus @default(PENDING)
  approvedAt      DateTime?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([parentProfileId, kidProfileId])
  @@index([status])
}
8.5 Mentor Profile
model MentorProfile {
  id                  String   @id @default(uuid())
  userId              String   @unique
  user                User     @relation(fields: [userId], references: [id])

  bio                 String?
  expertiseSummary    String?
  yearsExperience     Int?
  verificationStatus  VerificationStatus @default(PENDING)

  rating              Float    @default(0)
  totalReviews        Int      @default(0)

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  skills              MentorSkill[]
  assignments         MentorAssignment[]
  documents           VerificationDocument[]

  @@index([verificationStatus])
}
8.6 Organization Profile
model OrganizationProfile {
  id                  String   @id @default(uuid())
  userId              String   @unique
  user                User     @relation(fields: [userId], references: [id])

  organizationName    String
  website             String?
  industry            String?
  description         String?
  contactPerson       String?
  contactEmail        String?

  verificationStatus  VerificationStatus @default(PENDING)

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  events              Event[]
  opportunities       Opportunity[]
  documents           VerificationDocument[]

  @@index([verificationStatus])
}
8.7 Verification Documents
model VerificationDocument {
  id              String   @id @default(uuid())

  mentorProfileId String?
  mentorProfile   MentorProfile? @relation(fields: [mentorProfileId], references: [id])

  organizationProfileId String?
  organizationProfile   OrganizationProfile? @relation(fields: [organizationProfileId], references: [id])

  fileUrl         String
  fileType        String
  storagePath     String?
  status          VerificationStatus @default(PENDING)

  uploadedAt      DateTime @default(now())
  reviewedAt      DateTime?
  reviewedById    String?
}
8.8 Skills
model Skill {
  id            String   @id @default(uuid())
  name          String
  slug          String   @unique
  description   String?

  parentSkillId String?
  parentSkill   Skill?   @relation("SkillTree", fields: [parentSkillId], references: [id])
  childSkills   Skill[]  @relation("SkillTree")

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  kidSkills      KidSkill[]
  mentorSkills   MentorSkill[]
  postSkills     PostSkill[]
  eventSkills    EventSkill[]
  opportunitySkills OpportunitySkill[]

  @@index([slug])
  @@index([parentSkillId])
}
8.9 Kid Skills
model KidSkill {
  id              String   @id @default(uuid())

  kidProfileId    String
  kidProfile      KidProfile @relation(fields: [kidProfileId], references: [id])

  skillId         String
  skill           Skill @relation(fields: [skillId], references: [id])

  level           String?
  confidenceScore Float    @default(0.5)
  mentorVerified Boolean  @default(false)
  source          String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([kidProfileId, skillId])
  @@index([skillId])
  @@index([confidenceScore])
}
8.10 Mentor Skills
model MentorSkill {
  id              String   @id @default(uuid())

  mentorProfileId String
  mentorProfile   MentorProfile @relation(fields: [mentorProfileId], references: [id])

  skillId         String
  skill           Skill @relation(fields: [skillId], references: [id])

  level           String?
  verified        Boolean @default(false)

  createdAt       DateTime @default(now())

  @@unique([mentorProfileId, skillId])
}
8.11 Posts
model Post {
  id                  String   @id @default(uuid())

  authorId            String
  author              User     @relation(fields: [authorId], references: [id])

  type                PostType
  caption             String?
  visibility          Visibility @default(FOLLOWERS)
  moderationStatus    ModerationStatus @default(PENDING)

  originalPostId      String?
  originalPost        Post?    @relation("Reposts", fields: [originalPostId], references: [id])
  reposts             Post[]   @relation("Reposts")

  likeCount           Int      @default(0)
  commentCount        Int      @default(0)
  shareCount          Int      @default(0)
  repostCount         Int      @default(0)
  saveCount           Int      @default(0)
  viewCount           Int      @default(0)

  safetyScore         Float    @default(1)
  qualityScore        Float    @default(0.5)

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  deletedAt           DateTime?

  media               PostMedia[]
  skills              PostSkill[]
  comments            Comment[]
  likes               PostLike[]
  saves               PostSave[]
  reports             Report[]

  @@index([authorId])
  @@index([type])
  @@index([moderationStatus])
  @@index([createdAt])
  @@index([visibility])
}
8.12 Post Media
model PostMedia {
  id              String   @id @default(uuid())

  postId          String
  post            Post     @relation(fields: [postId], references: [id])

  fileUrl         String
  thumbnailUrl    String?
  fileType        String
  mimeType        String?
  sizeBytes       Int?
  storagePath     String?

  createdAt       DateTime @default(now())

  @@index([postId])
}
8.13 Post Skills
model PostSkill {
  id              String   @id @default(uuid())

  postId          String
  post            Post     @relation(fields: [postId], references: [id])

  skillId         String
  skill           Skill    @relation(fields: [skillId], references: [id])

  weight          Float    @default(1)

  @@unique([postId, skillId])
  @@index([skillId])
}
8.14 Comments
model Comment {
  id                  String   @id @default(uuid())

  postId              String
  post                Post     @relation(fields: [postId], references: [id])

  authorId            String
  author              User     @relation(fields: [authorId], references: [id])

  parentCommentId     String?
  text                String

  moderationStatus    ModerationStatus @default(PENDING)

  likeCount           Int      @default(0)

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  deletedAt           DateTime?

  reports             Report[]

  @@index([postId])
  @@index([authorId])
  @@index([moderationStatus])
  @@index([createdAt])
}
8.15 Likes
model PostLike {
  id          String   @id @default(uuid())

  postId      String
  post        Post     @relation(fields: [postId], references: [id])

  userId      String

  createdAt   DateTime @default(now())

  @@unique([postId, userId])
  @@index([userId])
}
8.16 Saves
model PostSave {
  id          String   @id @default(uuid())

  postId      String
  post        Post     @relation(fields: [postId], references: [id])

  userId      String

  createdAt   DateTime @default(now())

  @@unique([postId, userId])
  @@index([userId])
}
8.17 Follows
model Follow {
  id            String   @id @default(uuid())

  followerId    String
  followingId   String

  createdAt     DateTime @default(now())

  @@unique([followerId, followingId])
  @@index([followerId])
  @@index([followingId])
}
8.18 Events
model Event {
  id                  String   @id @default(uuid())

  organizationProfileId String
  organizationProfile   OrganizationProfile @relation(fields: [organizationProfileId], references: [id])

  title               String
  description         String
  bannerUrl           String?

  eventType           String
  isOnline            Boolean  @default(false)
  location            String?
  externalUrl         String?

  ageMin              Int?
  ageMax              Int?

  startTime           DateTime
  endTime             DateTime

  approvalStatus      VerificationStatus @default(PENDING)
  moderationStatus    ModerationStatus @default(PENDING)

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  deletedAt           DateTime?

  skills              EventSkill[]
  registrations       EventRegistration[]
  reports             Report[]

  @@index([organizationProfileId])
  @@index([startTime])
  @@index([approvalStatus])
  @@index([moderationStatus])
}
8.19 Event Skills
model EventSkill {
  id          String @id @default(uuid())

  eventId     String
  event       Event  @relation(fields: [eventId], references: [id])

  skillId     String
  skill       Skill  @relation(fields: [skillId], references: [id])

  weight      Float  @default(1)

  @@unique([eventId, skillId])
  @@index([skillId])
}
8.20 Event Registrations
model EventRegistration {
  id              String   @id @default(uuid())

  eventId          String
  event            Event    @relation(fields: [eventId], references: [id])

  kidProfileId     String
  kidProfile       KidProfile @relation(fields: [kidProfileId], references: [id])

  parentApproved   Boolean @default(false)
  status           String  @default("PENDING")

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@unique([eventId, kidProfileId])
  @@index([kidProfileId])
  @@index([status])
}
8.21 Opportunities
model Opportunity {
  id                    String   @id @default(uuid())

  organizationProfileId  String
  organizationProfile    OrganizationProfile @relation(fields: [organizationProfileId], references: [id])

  title                 String
  description           String
  opportunityType       String

  ageMin                Int?
  ageMax                Int?
  externalUrl           String?

  approvalStatus        VerificationStatus @default(PENDING)
  moderationStatus      ModerationStatus @default(PENDING)

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  deletedAt             DateTime?

  skills                OpportunitySkill[]

  @@index([organizationProfileId])
  @@index([approvalStatus])
}
8.22 Opportunity Skills
model OpportunitySkill {
  id              String @id @default(uuid())

  opportunityId   String
  opportunity     Opportunity @relation(fields: [opportunityId], references: [id])

  skillId         String
  skill           Skill @relation(fields: [skillId], references: [id])

  weight          Float @default(1)

  @@unique([opportunityId, skillId])
}
8.23 Mentor Assignments
model MentorAssignment {
  id              String   @id @default(uuid())

  mentorProfileId String
  mentorProfile   MentorProfile @relation(fields: [mentorProfileId], references: [id])

  kidProfileId    String
  kidProfile      KidProfile @relation(fields: [kidProfileId], references: [id])

  skillId         String?
  assignedById    String

  parentApproved  Boolean @default(false)
  status          String  @default("ACTIVE")

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  endedAt         DateTime?

  @@index([mentorProfileId])
  @@index([kidProfileId])
  @@index([status])
}
8.24 Chat Rooms
model ChatRoom {
  id              String   @id @default(uuid())

  type            ChatRoomType
  safetyStatus    String   @default("ACTIVE")

  createdById     String

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime?

  members         ChatMember[]
  messages        Message[]

  @@index([type])
  @@index([safetyStatus])
}
8.25 Chat Members
model ChatMember {
  id          String   @id @default(uuid())

  roomId      String
  room        ChatRoom @relation(fields: [roomId], references: [id])

  userId      String
  role        UserRole

  joinedAt    DateTime @default(now())
  leftAt      DateTime?

  @@unique([roomId, userId])
  @@index([userId])
}
8.26 Messages
model Message {
  id                  String   @id @default(uuid())

  roomId              String
  room                ChatRoom @relation(fields: [roomId], references: [id])

  senderId            String
  text                String?
  mediaUrl            String?

  moderationStatus    ModerationStatus @default(APPROVED)
  safetyFlagged       Boolean @default(false)

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  deletedAt           DateTime?

  reports             Report[]

  @@index([roomId])
  @@index([senderId])
  @@index([createdAt])
  @@index([moderationStatus])
}
8.27 Reports
model Report {
  id              String   @id @default(uuid())

  reportedById    String
  reportedBy      User     @relation("ReportsMade", fields: [reportedById], references: [id])

  targetType      String
  targetId        String

  postId          String?
  post            Post?    @relation(fields: [postId], references: [id])

  commentId       String?
  comment         Comment? @relation(fields: [commentId], references: [id])

  messageId       String?
  message         Message? @relation(fields: [messageId], references: [id])

  eventId         String?
  event           Event?   @relation(fields: [eventId], references: [id])

  reason          String
  description     String?
  status          ReportStatus @default(OPEN)

  reviewedById    String?
  reviewedAt      DateTime?
  resolutionNote  String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([reportedById])
  @@index([targetType, targetId])
  @@index([status])
}
8.28 Notifications
model Notification {
  id              String   @id @default(uuid())

  userId          String
  user            User     @relation(fields: [userId], references: [id])

  type            NotificationType
  title           String
  body            String?
  data            Json?

  isRead          Boolean  @default(false)

  createdAt       DateTime @default(now())

  @@index([userId])
  @@index([isRead])
  @@index([createdAt])
}
8.29 User Interactions
model UserInteraction {
  id              String   @id @default(uuid())

  userId          String
  itemType        String
  itemId          String
  action          String

  skillId         String?
  durationMs      Int?
  metadata        Json?

  createdAt       DateTime @default(now())

  @@index([userId])
  @@index([itemType, itemId])
  @@index([action])
  @@index([skillId])
  @@index([createdAt])
}
8.30 Audit Logs
model AuditLog {
  id              String   @id @default(uuid())

  actorId         String?
  action          String
  targetType      String?
  targetId        String?
  metadata        Json?

  ipAddress       String?
  userAgent       String?

  createdAt       DateTime @default(now())

  @@index([actorId])
  @@index([action])
  @@index([targetType, targetId])
  @@index([createdAt])
}
9. Backend Modules
9.1 Auth Module

Path:

src/auth/

Responsibilities:

Register users.
Login users.
Refresh tokens.
Logout.
Forgot password.
Reset password.
Email/phone verification later.
Role-based authentication.
Current user endpoint.

Routes:

POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
POST /auth/forgot-password
POST /auth/reset-password
GET  /auth/me

Required guards:

JwtAuthGuard
RolesGuard
AdminGuard
ParentGuard
KidGuard
VerifiedMentorGuard
VerifiedOrganizationGuard
9.2 Users Module

Path:

src/users/

Responsibilities:

User CRUD.
Profile basics.
Avatar update.
Account status.
Soft delete.
User search for admin.
Public profile lookup with privacy rules.

Routes:

GET    /users/me
PATCH  /users/me
GET    /users/:id
GET    /users/:id/public
DELETE /users/me

Admin routes:

GET   /admin/users
GET   /admin/users/:id
PATCH /admin/users/:id/status
DELETE /admin/users/:id
9.3 Kids Module

Path:

src/kids/

Responsibilities:

Kid profile creation.
Kid profile update.
Parent approval status.
Kid privacy settings.
Child safety settings.
Kid profile view.

Routes:

POST  /kids/profile
GET   /kids/me
PATCH /kids/me
GET   /kids/:id
PATCH /kids/:id/privacy

Parent routes:

GET   /parents/me/children
POST  /parents/children/link
PATCH /parents/children/:kidId/approve
PATCH /parents/children/:kidId/settings
9.4 Parents Module

Path:

src/parents/

Responsibilities:

Parent profile.
Child links.
Child permissions.
Child event approvals.
Child mentor approvals.
Child activity summary.

Routes:

POST  /parents/profile
GET   /parents/me
PATCH /parents/me
GET   /parents/me/children
GET   /parents/children/:kidId/activity
9.5 Skills Module

Path:

src/skills/

Responsibilities:

Manage skill categories.
Add/update kid skills.
Add/update mentor skills.
Skill search.
Skill tree.

Routes:

GET    /skills
GET    /skills/tree
GET    /skills/search?q=
POST   /kids/me/skills
PATCH  /kids/me/skills/:skillId
DELETE /kids/me/skills/:skillId

Admin routes:

POST   /admin/skills
PATCH  /admin/skills/:id
DELETE /admin/skills/:id
9.6 Mentors Module

Path:

src/mentors/

Responsibilities:

Mentor profile.
Mentor verification.
Mentor skills.
Mentor public listing.
Mentor assignment support.
Mentor content.

Routes:

POST  /mentors/profile
GET   /mentors/me
PATCH /mentors/me
GET   /mentors
GET   /mentors/:id
POST  /mentors/me/documents

Admin routes:

GET   /admin/mentors/pending
PATCH /admin/mentors/:id/approve
PATCH /admin/mentors/:id/reject
9.7 Organizations Module

Path:

src/organizations/

Responsibilities:

Organization profile.
Organization verification.
Organization public listing.
Organization documents.
Organization event and opportunity management.

Routes:

POST  /organizations/profile
GET   /organizations/me
PATCH /organizations/me
GET   /organizations
GET   /organizations/:id
POST  /organizations/me/documents

Admin routes:

GET   /admin/organizations/pending
PATCH /admin/organizations/:id/approve
PATCH /admin/organizations/:id/reject
9.8 Posts Module

Path:

src/posts/

Responsibilities:

Create posts.
Edit posts.
Delete posts.
View posts.
Project posts.
Achievement posts.
Reposts.
Media attachment metadata.
Skill tagging.
Moderation status.

Routes:

POST   /posts
GET    /posts/:id
PATCH  /posts/:id
DELETE /posts/:id
POST   /posts/:id/repost
GET    /users/:userId/posts

Rules:

Kid posts may require moderation before appearing publicly.
Mentor and organization posts may require approval depending on type.
Posts with unsafe text must be flagged.
Posts must have visibility.
Posts can have multiple skills.
9.9 Media Module

Path:

src/media/

Responsibilities:

Generate upload URLs.
Store file metadata.
Validate file type.
Validate file size.
Attach media to post/event/profile.
Create thumbnails later.

Routes:

POST /media/upload-url
POST /media/complete-upload
DELETE /media/:id

Allowed file types:

image/jpeg
image/png
image/webp
video/mp4
application/pdf for verification documents only

Rules:

Do not allow executable files.
Do not allow unknown MIME types.
Restrict video size for MVP.
Restrict upload access by role.
9.10 Comments Module

Path:

src/comments/

Responsibilities:

Add comment.
Edit comment.
Delete comment.
Moderate comment.
Reply to comment.
Report comment.

Routes:

POST   /posts/:postId/comments
GET    /posts/:postId/comments
PATCH  /comments/:id
DELETE /comments/:id
POST   /comments/:id/report

Rules:

Comments from kids must pass safety filter.
Comments can be disabled by post owner or child settings.
Flag suspicious comments.
9.11 Reactions Module

Path:

src/reactions/

Responsibilities:

Like/unlike posts.
Save/unsave posts.
Like comments later.
Track engagement.

Routes:

POST   /posts/:id/like
DELETE /posts/:id/like
POST   /posts/:id/save
DELETE /posts/:id/save
GET    /users/me/saved-posts
9.12 Follows Module

Path:

src/follows/

Responsibilities:

Follow users.
Unfollow users.
Followers list.
Following list.
Follow restrictions for kids.

Routes:

POST   /users/:id/follow
DELETE /users/:id/follow
GET    /users/:id/followers
GET    /users/:id/following

Rules:

Kids may follow verified mentors and organizations.
Kids may follow other kids only if privacy settings allow.
Blocked users cannot follow each other.
Suspended users cannot follow.
9.13 Feed Module

Path:

src/feed/

Responsibilities:

Generate personalized feed.
Generate event feed.
Generate discovery feed.
Rank posts by skills, follows, freshness, safety, and engagement.
Track feed impressions.

Routes:

GET /feed
GET /feed/events
GET /feed/discover
POST /feed/:itemId/impression
POST /feed/:itemId/hide

Feed ranking formula:

feed_score =
  skill_match_score * 0.35
+ follow_score * 0.20
+ engagement_score * 0.15
+ freshness_score * 0.10
+ mentor_org_boost * 0.10
+ safety_quality_score * 0.10
- negative_feedback_penalty

Feed rules:

Only approved content appears.
Age-inappropriate content must not appear.
Organization events must be approved.
Safety score must be high enough.
Mix content types.
Avoid showing only viral content.
Prioritize learning value.

MVP feed content mix:

50% skill-matched posts
20% followed users
15% mentor content
10% organization events/opportunities
5% discovery content
9.14 Events Module

Path:

src/events/

Responsibilities:

Create events.
Update events.
Delete events.
Event skill tagging.
Event approval.
Event registration.
Parent approval.
External link handling.

Routes:

POST   /events
GET    /events
GET    /events/:id
PATCH  /events/:id
DELETE /events/:id
POST   /events/:id/register

Parent routes:

PATCH /parents/events/registrations/:id/approve
PATCH /parents/events/registrations/:id/reject

Admin routes:

GET   /admin/events/pending
PATCH /admin/events/:id/approve
PATCH /admin/events/:id/reject

Rules:

Only verified organizations can create events.
Admin approval is required before events appear.
Kids can register only if age range matches.
Parent approval may be required.
External links must be checked or approved.
9.15 Opportunities Module

Path:

src/opportunities/

Responsibilities:

Organization opportunities.
Skill-targeted opportunities.
Admin approval.
Parent-safe inquiry flow.

Routes:

POST   /opportunities
GET    /opportunities
GET    /opportunities/:id
PATCH  /opportunities/:id
DELETE /opportunities/:id

Admin routes:

GET   /admin/opportunities/pending
PATCH /admin/opportunities/:id/approve
PATCH /admin/opportunities/:id/reject

Rules:

Only verified organizations can create opportunities.
Opportunities must be approved.
Organizations should contact parents, not kids directly.
Opportunity recommendations must match skill and age.
9.16 Mentor Assignments Module

Path:

src/mentor-assignments/

Responsibilities:

Assign mentors to kids.
Parent approval.
Mentor assignment status.
Assignment history.
Skill-specific mentorship.

Routes:

GET   /kids/me/mentors
GET   /mentors/me/assigned-kids

Admin routes:

POST  /admin/mentor-assignments
PATCH /admin/mentor-assignments/:id/status

Parent routes:

PATCH /parents/mentor-assignments/:id/approve
PATCH /parents/mentor-assignments/:id/reject

Rules:

Mentor must be verified.
Kid must have parent approval.
Parent should approve mentor assignment.
Chat can be created only after assignment is approved.
9.17 Chat Module

Path:

src/chat/

Responsibilities:

Chat rooms.
Chat members.
Messages.
Message moderation.
Safety filtering.
Socket.IO realtime events.
Parent/admin reporting.

Routes:

POST /chat/rooms
GET  /chat/rooms
GET  /chat/rooms/:id
GET  /chat/rooms/:id/messages
POST /chat/rooms/:id/messages
POST /chat/messages/:id/report
DELETE /chat/messages/:id

Socket events:

chat:join
chat:leave
message:send
message:new
message:read
typing:start
typing:stop

Chat rules:

Kid ↔ Parent: allowed
Kid ↔ Mentor: allowed only after parent/admin-approved mentor assignment
Parent ↔ Mentor: allowed
Parent ↔ Organization: allowed
Kid ↔ Organization: disabled by default
Kid ↔ Kid: disabled in MVP, can be added later with parent settings
Admin ↔ User: allowed

Safety rules:

Detect phone numbers.
Detect emails.
Detect external handles.
Detect address-like content.
Detect abusive words.
Detect grooming phrases.
Detect suspicious links.
Flag messages automatically.
Allow reports.
Keep audit trail.
9.18 Notifications Module

Path:

src/notifications/

Responsibilities:

In-app notifications.
Push notifications.
Mark as read.
Notification preferences.

Routes:

GET   /notifications
PATCH /notifications/:id/read
PATCH /notifications/read-all
DELETE /notifications/:id

Trigger notifications for:

New follower.
Like.
Comment.
Mentor assignment.
Parent approval request.
Event recommendation.
Event registration.
Message.
Admin notice.
Report update.
9.19 Reports Module

Path:

src/reports/

Responsibilities:

Create reports.
View report status.
Admin report review.
Resolve reports.
Link reports to target content.

Routes:

POST /reports
GET  /reports/me

Admin routes:

GET   /admin/reports
GET   /admin/reports/:id
PATCH /admin/reports/:id/status

Reportable targets:

user
post
comment
message
event
opportunity
organization
mentor
9.20 Moderation Module

Path:

src/moderation/

Responsibilities:

Text safety check.
Link safety check.
Content approval workflow.
Comment filtering.
Message flagging.
Admin moderation queue.
Keyword rules.
Safety scoring.

Admin routes:

GET   /admin/moderation/posts
GET   /admin/moderation/comments
GET   /admin/moderation/messages
PATCH /admin/moderation/posts/:id/approve
PATCH /admin/moderation/posts/:id/reject
PATCH /admin/moderation/comments/:id/approve
PATCH /admin/moderation/comments/:id/reject
PATCH /admin/moderation/messages/:id/flag

MVP moderation checks:

No phone numbers
No email addresses
No exact address
No abusive words
No adult content phrases
No suspicious external links
No requests to move to other apps
No meeting requests without parent/admin flow
9.21 Admin Module

Path:

src/admin/

Responsibilities:

Dashboard.
User management.
Mentor approval.
Organization approval.
Event approval.
Opportunity approval.
Report management.
Moderation queue.
Skill management.
Analytics summary.
Audit logs.

Routes:

GET /admin/dashboard

GET /admin/users
GET /admin/users/:id
PATCH /admin/users/:id/status

GET /admin/mentors/pending
PATCH /admin/mentors/:id/approve
PATCH /admin/mentors/:id/reject

GET /admin/organizations/pending
PATCH /admin/organizations/:id/approve
PATCH /admin/organizations/:id/reject

GET /admin/posts/pending
PATCH /admin/posts/:id/approve
PATCH /admin/posts/:id/reject

GET /admin/events/pending
PATCH /admin/events/:id/approve
PATCH /admin/events/:id/reject

GET /admin/reports
PATCH /admin/reports/:id/status

GET /admin/audit-logs
9.22 Analytics Module

Path:

src/analytics/

Responsibilities:

Admin stats.
User growth.
Popular skills.
Event engagement.
Mentor performance.
Organization activity.
Post engagement.
Safety metrics.

Routes:

GET /admin/analytics/overview
GET /admin/analytics/users
GET /admin/analytics/skills
GET /admin/analytics/events
GET /admin/analytics/safety

MVP analytics can be simple SQL queries.

9.23 Search Module

Path:

src/search/

Responsibilities:

Search users.
Search mentors.
Search organizations.
Search posts.
Search events.
Search skills.

Routes:

GET /search?q=
GET /search/users?q=
GET /search/mentors?q=
GET /search/organizations?q=
GET /search/posts?q=
GET /search/events?q=
GET /search/skills?q=

MVP search can use PostgreSQL ILIKE/full-text search.

Later use Meilisearch or OpenSearch.

9.24 Storage Module

Path:

src/storage/

Responsibilities:

Abstract storage provider.
Upload URL creation.
File deletion.
File validation.
Storage path generation.

Interface:

interface StorageService {
  createUploadUrl(input: CreateUploadUrlInput): Promise<CreateUploadUrlResult>;
  deleteFile(storagePath: string): Promise<void>;
  getPublicUrl(storagePath: string): string;
}
9.25 Safety Module

Path:

src/safety/

Responsibilities:

Central safety rules.
Text scanning.
Link scanning.
Role communication rules.
Child privacy checks.
Feed safety filtering.
Upload validation rules.

Important functions:

canUserMessageUser(senderId, receiverId)
canUserViewProfile(viewerId, profileUserId)
canUserCommentOnPost(userId, postId)
canKidRegisterForEvent(kidId, eventId)
canOrganizationContactUser(organizationId, userId)
scanTextForUnsafeContent(text)
10. API Response Format

All APIs should return a consistent structure.

Success:

{
  "success": true,
  "message": "Request successful",
  "data": {}
}

Error:

{
  "success": false,
  "message": "Error message",
  "errorCode": "ERROR_CODE",
  "details": {}
}

Paginated response:

{
  "success": true,
  "message": "Request successful",
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
11. Authentication and Authorization
11.1 Access Token

Use short-lived access tokens.

Access token expiry: 15 minutes
11.2 Refresh Token

Use long-lived refresh tokens.

Refresh token expiry: 30 days

Store hashed refresh tokens in database if using custom auth.

11.3 Guards

Required guards:

JwtAuthGuard
RolesGuard
OwnerGuard
ParentOfKidGuard
VerifiedMentorGuard
VerifiedOrganizationGuard
AdminGuard
SuperAdminGuard
11.4 Permission Examples

A kid can edit own profile only.

A parent can update settings for linked child only.

A mentor can view assigned kids only.

An organization can edit own events only.

An admin can moderate all content.

A super admin can manage admins.

12. Feed Algorithm
12.1 Feed Candidate Sources

Feed should collect candidates from:

Approved posts with matching skills
Posts from followed users
Mentor posts related to kid skills
Organization events related to kid skills
Organization opportunities related to kid skills
Discovery content
12.2 Hard Filters

Before ranking, remove:

Unapproved posts
Rejected posts
Flagged unsafe posts
Suspended user posts
Blocked user posts
Age-inappropriate events
Unapproved organization events
Content hidden by the user
Deleted content
12.3 Ranking Formula
feed_score =
  skill_match_score * 0.35
+ follow_score * 0.20
+ engagement_score * 0.15
+ freshness_score * 0.10
+ mentor_org_boost * 0.10
+ safety_quality_score * 0.10
- negative_feedback_penalty
12.4 Skill Match Score
skill_match_score = sum(kid_skill_confidence * item_skill_weight)

Normalize to 0–1.

12.5 Follow Score
1.0 if user follows author
0.5 if similar kids follow author
0.1 otherwise
12.6 Engagement Score

Use:

likes
comments
saves
shares
reposts
event registrations
completion/view duration

Do not over-optimize for addictive engagement.

12.7 Freshness Score
freshness_score = 1 / (1 + age_in_days)
12.8 Safety Quality Score

Use:

1.0 for safe, high-quality approved content
0.5 for low-quality but approved content
0.0 for unsafe content, which should already be filtered
13. Event Recommendation Algorithm

Hard filters:

Event must be approved
Organization must be verified
Kid age must match event age range
Kid parent settings must allow event suggestions
Event must not be deleted
Event must not be rejected or flagged

Ranking:

event_score =
  skill_match * 0.45
+ age_match * 0.20
+ location_language_match * 0.10
+ organization_trust_score * 0.10
+ freshness * 0.10
+ follow_score * 0.05
14. Skill Score Update Rules

Update KidSkill.confidenceScore based on behavior.

Positive signals:

Kid selects skill during onboarding: +0.30
Kid posts with skill: +0.10
Kid saves skill-related post: +0.05
Kid joins skill-related event: +0.15
Mentor verifies skill: +0.25
Kid completes mentor task: +0.20
Parent confirms skill: +0.10

Negative or neutral signals:

Kid hides skill-related content: -0.05
Kid repeatedly ignores skill content: -0.02
Post skill tag rejected by moderation: -0.10

Clamp score between 0 and 1.

15. Privacy Rules
15.1 Kid Profiles

Default visibility:

PRIVATE

Allowed visibility:

PRIVATE
PARENTS_ONLY
FOLLOWERS
PUBLIC_SAFE

Do not publicly show:

Exact date of birth
Exact address
School address
Phone number
Email
Parent contact
Private chat data
Sensitive documents
15.2 Public Kid Profile

Public-safe profile can show:

Display name
Avatar
Age group
Country if allowed
Skills
Approved public posts
Achievements if approved
16. Chat Safety Rules

Chat creation must use centralized safety checks.

Allowed MVP chat types:

Kid ↔ Parent
Parent ↔ Mentor
Kid ↔ Mentor after approved assignment
Parent ↔ Organization
Admin ↔ User

Disabled in MVP:

Kid ↔ Organization direct chat
Kid ↔ Kid private chat
Open group chat

Messages must be scanned for:

Phone numbers
Emails
Addresses
External social handles
Payment requests
Meeting requests
Adult content
Bullying
Abuse
Suspicious links

Flagged messages:

Do not delete automatically
Mark as FLAGGED
Notify admin/moderation queue
Optionally hide from recipient depending on severity
17. Moderation Workflow
17.1 Posts
Kid creates post
System scans text/media metadata
Post status becomes PENDING
Admin or automated rule approves
Post becomes visible in feed

For MVP, use admin approval for kid posts or first few kid posts.

17.2 Comments
Comment created
Text is scanned
Safe comment can become APPROVED
Suspicious comment becomes FLAGGED or PENDING
Admin reviews flagged comments
17.3 Events
Organization creates event
Event is PENDING
Admin reviews organization, content, external URL
Admin approves
Event appears in event feed
17.4 Reports
User submits report
Report status OPEN
Admin reviews target
Admin resolves or dismisses
Audit log is created
Reporter may be notified
18. File Upload Rules

Maximum file sizes for MVP:

Avatar image: 5 MB
Post image: 10 MB
Post video: 100 MB
Event banner: 10 MB
Verification document: 20 MB

Allowed types:

Images: jpg, jpeg, png, webp
Videos: mp4
Documents: pdf only for verification

Upload process:

1. User requests upload URL
2. Backend checks role and file type
3. Backend returns signed upload URL
4. Client uploads file
5. Client confirms upload
6. Backend stores metadata
19. Rate Limits

Apply rate limits to prevent abuse.

Suggested MVP limits:

Login: 5 attempts per 15 minutes
Register: 5 attempts per hour per IP
Create post: 20 per day per kid
Comment: 100 per day per user
Like: 500 per day per user
Follow: 100 per day per user
Send message: 300 per day per user
Report: 50 per day per user
Upload: 50 per day per user

Admins can override some limits.

20. Error Codes

Use consistent error codes.

AUTH_INVALID_CREDENTIALS
AUTH_TOKEN_EXPIRED
AUTH_FORBIDDEN
AUTH_UNAUTHORIZED

USER_NOT_FOUND
USER_SUSPENDED
USER_BANNED

KID_PARENT_APPROVAL_REQUIRED
KID_PRIVACY_RESTRICTED

MENTOR_NOT_VERIFIED
ORGANIZATION_NOT_VERIFIED

POST_NOT_FOUND
POST_NOT_APPROVED
POST_FORBIDDEN

EVENT_NOT_FOUND
EVENT_NOT_APPROVED
EVENT_AGE_RESTRICTED
EVENT_PARENT_APPROVAL_REQUIRED

CHAT_NOT_ALLOWED
MESSAGE_FLAGGED

REPORT_NOT_FOUND

VALIDATION_ERROR
RATE_LIMIT_EXCEEDED
INTERNAL_SERVER_ERROR
21. Validation Rules

Use DTOs for every input.

Use:

class-validator
class-transformer

Validate:

Required fields
String length
Enum values
UUID format
Email format
URL format
Date ranges
File type
File size
Age range
Pagination values

Never trust client input.

22. Logging

Log:

Server errors
Auth failures
Suspicious activity
Moderation actions
Admin actions
File upload failures
Payment later if added
Queue failures later

Never log:

Passwords
Refresh tokens
Full child private data
Sensitive documents
Private message content unless specifically needed for moderation logs
23. Testing Plan

Use Jest and Supertest.

23.1 Unit Tests

Test:

Auth service
Permission checks
Feed scoring
Skill score updates
Safety text scanner
Event eligibility
Chat permission rules
23.2 Integration Tests

Test:

Register user
Create parent and kid
Approve child
Create mentor
Approve mentor
Assign mentor
Create post
Approve post
Generate feed
Create event
Approve event
Register for event
Create chat room
Send message
Report content
Admin resolves report
23.3 E2E Tests

Test full flows:

Parent + kid onboarding
Kid post creation and moderation
Skill-based feed
Organization event recommendation
Mentor assignment and safe chat
Report and admin moderation
24. Seed Data

Create seed data for development.

Seed:

Super admin
Admin
Parent
Kid
Mentor
Organization
Skills
Sample posts
Sample events
Sample reports

Default skills:

Art
Painting
Drawing
Music
Singing
Dance
Coding
Robotics
Writing
Football
Cricket
Swimming
Math
Science
Public Speaking
Photography
25. Development Order

Build in this exact order.

Phase 1: Foundation
1. Create NestJS project
2. Setup PostgreSQL
3. Setup Prisma
4. Setup config module
5. Setup common response format
6. Setup global validation pipe
7. Setup error filter
8. Setup logging
9. Setup Swagger
Phase 2: Auth and Users
1. User model
2. Auth module
3. Register
4. Login
5. Refresh token
6. Role guards
7. Current user endpoint
8. Admin seed account
Phase 3: Profiles and Safety Base
1. Parent profile
2. Kid profile
3. Parent-child linking
4. Parent approval
5. Mentor profile
6. Organization profile
7. Verification document upload metadata
8. Basic admin approval
Phase 4: Skills
1. Skill model
2. Skill tree
3. Kid skills
4. Mentor skills
5. Skill confidence scoring
Phase 5: Posts
1. Post model
2. Post media
3. Post skills
4. Create post
5. Edit post
6. Delete post
7. View post
8. Admin approve/reject post
Phase 6: Social Features
1. Likes
2. Saves
3. Comments
4. Follows
5. Reposts
6. Reports
Phase 7: Feed
1. Candidate selection
2. Skill matching
3. Follow scoring
4. Freshness scoring
5. Engagement scoring
6. Safe feed response
7. Feed impressions
8. Hide content
Phase 8: Events and Opportunities
1. Organization event creation
2. Event skills
3. Admin event approval
4. Skill-based event feed
5. Event registration
6. Parent approval
7. Opportunities
Phase 9: Mentor Assignment
1. Admin assigns mentor
2. Parent approves mentor
3. Kid sees assigned mentor
4. Mentor sees assigned kids
Phase 10: Chat
1. Chat room model
2. Chat member model
3. Message model
4. Chat permission service
5. REST message endpoints
6. Socket.IO gateway
7. Message safety scan
8. Report message
Phase 11: Notifications
1. In-app notifications
2. Mark read
3. Push token storage
4. Firebase Cloud Messaging integration
Phase 12: Admin and Analytics
1. Dashboard
2. User management
3. Moderation queue
4. Reports queue
5. Audit logs
6. Analytics summary
26. Recommended NestJS Folder Structure
src/
  main.ts
  app.module.ts

  config/
    app.config.ts
    database.config.ts
    jwt.config.ts
    storage.config.ts

  common/
    decorators/
      current-user.decorator.ts
      roles.decorator.ts
    filters/
      http-exception.filter.ts
    guards/
      jwt-auth.guard.ts
      roles.guard.ts
    interceptors/
      response.interceptor.ts
    pipes/
    dto/
      pagination.dto.ts
    types/
      api-response.type.ts
    utils/
      pagination.util.ts
      slug.util.ts

  prisma/
    prisma.module.ts
    prisma.service.ts

  auth/
    auth.module.ts
    auth.controller.ts
    auth.service.ts
    dto/
    strategies/

  users/
    users.module.ts
    users.controller.ts
    users.service.ts
    dto/

  kids/
  parents/
  mentors/
  organizations/
  skills/
  posts/
  media/
  comments/
  reactions/
  follows/
  feed/
  events/
  opportunities/
  mentor-assignments/
  chat/
  notifications/
  reports/
  moderation/
  admin/
  analytics/
  search/
  storage/
  safety/
  audit-logs/
27. Controller Rules

Controllers should:

Receive requests
Validate DTOs
Call services
Return formatted responses
Avoid business logic

Controllers should not:

Query Prisma directly
Implement permission logic directly
Calculate feed logic directly
Handle storage provider logic directly
28. Service Rules

Services should:

Contain business logic
Use Prisma service
Use safety service
Use audit service
Use notification service where needed
Throw typed exceptions
Use transactions for multi-step operations

Use Prisma transactions for:

Create post with media and skills
Like post and increment count
Unlike post and decrement count
Register event
Approve mentor assignment
Create chat room with members
Resolve report and update target
29. Security Checklist

Required:

Helmet
CORS config
Rate limiting
Input validation
Password hashing with bcrypt or argon2
JWT secret from env
Refresh token rotation
Role guards
File type validation
File size validation
SQL injection protection through Prisma
No raw SQL unless necessary
Audit logs for admin actions
Soft delete for sensitive data

Do not:

Expose password hashes
Expose refresh tokens
Expose private child data
Expose signed URLs forever
Expose admin routes without guards
Allow unverified organizations to publish events
Allow unverified mentors to coach kids
Allow direct organization-to-kid chat by default
30. MVP API Checklist

The MVP backend is complete when these work:

Auth:
- Register
- Login
- Refresh
- Me

Users:
- Create/update profile
- Role-based access

Parent/Kid:
- Parent creates account
- Kid creates profile
- Parent links and approves kid
- Parent controls kid settings

Skills:
- Skills list
- Kid selects skills
- Skill scores exist

Mentor:
- Mentor creates profile
- Admin approves mentor

Organization:
- Organization creates profile
- Admin approves organization

Posts:
- Create post
- Upload media metadata
- Add skills to post
- Admin approves post
- Feed shows approved post

Social:
- Like
- Comment
- Follow
- Save
- Report

Feed:
- Skill-based feed
- Follow-based feed
- Event recommendations

Events:
- Organization creates event
- Admin approves event
- Kid sees event
- Kid registers
- Parent approves registration

Chat:
- Parent-child chat
- Parent-mentor chat
- Kid-mentor chat after approval
- Message safety scan

Admin:
- Dashboard
- User management
- Mentor approval
- Organization approval
- Post approval
- Event approval
- Reports
- Audit logs
31. Future Scaling Plan

Do not implement these at first unless needed.

Later split into services:

Auth Service
User/Profile Service
Post Service
Feed Recommendation Service
Chat Service
Notification Service
Moderation Service
Search Service
Media Processing Service
Analytics Service
Admin Service

Later add:

Redis for caching
BullMQ for background jobs
Meilisearch/OpenSearch for search
CDN for media
Video transcoding
AI-assisted moderation
Recommendation embeddings
Analytics warehouse
32. Agent Instructions

When coding this backend, follow these rules:

Use NestJS modules.
Use TypeScript strictly.
Use Prisma for database access.
Do not put business logic in controllers.
Always validate DTOs.
Always check permissions.
Always consider child safety before allowing communication or visibility.
Always use transactions for multi-step writes.
Always create audit logs for admin actions.
Never store files directly in PostgreSQL.
Never expose private child information.
Never allow unverified mentors or organizations to access protected features.
Never allow direct organization-to-kid chat in MVP.
Keep all API responses consistent.
Add tests for permission-sensitive features.
Use pagination for list endpoints.
Use soft delete for important records.
Add indexes for feed, search, and admin queries.
Keep feed algorithm explainable.
Build MVP first before microservices.
33. Final Backend Goal

The backend must support a safe, scalable, skill-based social platform for children.

The first version should prioritize:

Safety
Parent control
Moderation
Skill-based discovery
Verified mentors
Verified organizations
Admin control
Clean architecture
Scalable PostgreSQL schema

Do not build addictive social media mechanics first.

Build a trusted children’s skill-growth ecosystem.

okay now one thing create a complete structure and planning for the admin portal, security for admin is important make a good planning and give me proper structure i will paste this in agents.md for the admin portal. make no mistake, include everything we discussed.

I’ll make this as a separate AGENTS.md section for the admin portal, focused on Next.js structure, admin security, RBAC, moderation, child-safety workflows, and exact build order.

Thought for 21s

Here is a copy-ready AGENTS.md section for the Admin Portal.

# AGENTS.md

# Project: Kids Skill Growth Platform Admin Portal

## 1. Admin Portal Summary

This admin portal is the internal control center for the Kids Skill Growth Social Platform.

The platform is a child-focused skill-growth social network where kids can post projects, showcase skills, receive mentorship, follow mentors and organizations, join events, and discover skill-based opportunities.

The admin portal must manage:

- Users
- Kids
- Parents
- Mentors
- Organizations
- Posts
- Comments
- Events
- Opportunities
- Chat safety
- Reports
- Moderation
- Skills
- Mentor assignments
- Notifications
- Analytics
- Audit logs
- Admin roles and permissions
- Platform safety settings

Because this platform involves children, the admin portal must be designed with strong security, privacy, auditability, and child-safety controls.

The admin portal must never directly connect to the database. It must only communicate with the backend API.

---

## 2. Recommended Admin Portal Stack

Use this stack for MVP:

```txt id="m2ut5p"
Framework: Next.js
Language: TypeScript
Routing: Next.js App Router
Styling: Tailwind CSS
UI Components: shadcn/ui or custom components
Forms: React Hook Form
Validation: Zod
Tables: TanStack Table
Data Fetching: TanStack Query
Charts: Recharts
Authentication: Backend-issued secure session / JWT via httpOnly cookies
Authorization: RBAC permissions from backend
API Client: Fetch or Axios wrapper
Testing: Jest + React Testing Library + Playwright
Deployment: Vercel / Render / self-hosted later

Recommended:

Next.js + TypeScript + Tailwind + shadcn/ui + TanStack Query + Zod
3. Core Admin Portal Rules
3.1 Security First

The admin portal manages children’s data and sensitive moderation workflows.

Therefore:

Do not store access tokens in localStorage.
Do not store refresh tokens in localStorage.
Use httpOnly secure cookies where possible.
Use HTTPS only in production.
Protect every admin route.
Check permissions on both frontend and backend.
Never trust frontend authorization alone.
Never expose private child data unless permission allows.
Never connect frontend directly to PostgreSQL.
Never expose backend secrets in NEXT_PUBLIC variables.
Every sensitive admin action must require a reason.
Every sensitive admin action must create an audit log.
3.2 Child Safety First

The admin portal must help protect children from:

Unsafe communication
Unverified mentors
Unverified organizations
Unsafe events
Unsafe external links
Bullying
Abuse
Grooming behavior
Sharing phone numbers
Sharing emails
Sharing addresses
Sharing external social media handles
Inappropriate media
Suspicious chat messages
3.3 Admin Actions Must Be Auditable

Every important action must be logged.

Examples:

Admin login
Admin logout
Failed login
MFA verification
Approve mentor
Reject mentor
Approve organization
Reject organization
Approve post
Reject post
Hide comment
Suspend user
Ban user
Resolve report
View flagged chat
Assign mentor
Approve event
Reject event
Change child safety setting
Create admin
Change admin role
Export data
4. Admin Roles

Use strict role-based access control.

enum AdminRole {
  SUPER_ADMIN
  ADMIN
  MODERATOR
  SAFETY_REVIEWER
  SUPPORT_AGENT
  CONTENT_REVIEWER
  EVENT_REVIEWER
  ANALYST
}
5. Admin Role Responsibilities
5.1 Super Admin

Can:

Manage all admins
Change admin roles
View audit logs
Manage platform settings
Approve or revoke admin access
Access all modules
Export reports if allowed
Configure safety rules
5.2 Admin

Can:

Manage users
Approve mentors
Approve organizations
Approve events
Review reports
Moderate content
Assign mentors
View analytics

Cannot:

Create super admins
Change super admin permissions
Delete audit logs
Bypass safety logs
5.3 Moderator

Can:

Review posts
Review comments
Review reported content
Approve or reject content
Hide unsafe content
Escalate serious reports

Cannot:

Approve mentors
Approve organizations
Manage admin users
Change platform settings
5.4 Safety Reviewer

Can:

Review flagged chats
Review child-safety reports
Escalate dangerous cases
Suspend unsafe users temporarily
View limited safety-related user context

Cannot:

Browse private chats freely
Export child data
Manage admins
Change unrelated settings
5.5 Support Agent

Can:

View user support information
Help parents with account issues
View linked parent-child status
View basic reports
Escalate safety cases

Cannot:

View full private messages unless escalated
Approve mentors
Approve organizations
Approve events
Access sensitive documents
5.6 Content Reviewer

Can:

Review pending posts
Review pending comments
Review media metadata
Approve or reject content
5.7 Event Reviewer

Can:

Review organization events
Review external event links
Approve or reject events
Review opportunity posts
5.8 Analyst

Can:

View analytics
View growth reports
View skill trends
View event performance
View safety metrics

Cannot:

View private child details
Moderate content
Change user status
Export personal data unless explicitly permitted
6. Permission System

Use permission keys, not only role names.

Example permissions:

type Permission =
  | "dashboard.view"
  | "users.view"
  | "users.update_status"
  | "users.suspend"
  | "users.ban"
  | "kids.view"
  | "kids.view_private"
  | "parents.view"
  | "mentors.view"
  | "mentors.approve"
  | "mentors.reject"
  | "organizations.view"
  | "organizations.approve"
  | "organizations.reject"
  | "posts.view"
  | "posts.approve"
  | "posts.reject"
  | "posts.hide"
  | "comments.view"
  | "comments.approve"
  | "comments.reject"
  | "events.view"
  | "events.approve"
  | "events.reject"
  | "opportunities.view"
  | "opportunities.approve"
  | "opportunities.reject"
  | "chat_safety.view"
  | "chat_safety.review"
  | "reports.view"
  | "reports.resolve"
  | "mentor_assignments.create"
  | "skills.manage"
  | "notifications.send"
  | "analytics.view"
  | "audit_logs.view"
  | "admins.manage"
  | "settings.manage";

The backend must return the logged-in admin’s permissions.

The frontend should use permissions to:

Show or hide menu items
Show or hide action buttons
Protect routes
Disable restricted actions
Display access denied pages

But the backend must still enforce all permissions.

7. Admin Portal Authentication
7.1 Login Requirements

Admin login must support:

Email and password
MFA / 2FA
Secure session
Refresh session
Logout
Session expiry
Device/session tracking
Failed login protection
7.2 Recommended Login Flow
1. Admin enters email and password.
2. Backend validates credentials.
3. If credentials are valid, backend requires MFA.
4. Admin enters MFA code.
5. Backend creates secure session.
6. Session is stored using httpOnly secure cookie.
7. Frontend loads current admin profile and permissions.
8. Admin is redirected to dashboard.
7.3 Session Security

Use:

httpOnly cookies
Secure cookies in production
SameSite=Lax or Strict
Short access token lifetime
Refresh token rotation
Idle timeout
Absolute session timeout
Logout all sessions
Device/session management

Recommended timeouts:

Access token: 15 minutes
Refresh token/session: 8 to 12 hours for admin
Idle timeout: 30 minutes
MFA remember device: optional, max 7 days

For admin accounts, do not use 30-day refresh sessions unless there is a strong reason.

7.4 MFA

MFA should be required for all admins.

MVP MFA options:

TOTP authenticator app
Email OTP as temporary fallback
Recovery codes

Later:

Passkeys
Hardware security keys
IP allowlist
Device trust scoring
7.5 Failed Login Protection

The admin portal must handle:

Failed login attempts
Temporary account lock
IP-based rate limits
MFA failure limits
Suspicious login alerts
Admin notification for repeated failures

Suggested limits:

5 failed login attempts -> temporary lock
5 failed MFA attempts -> temporary lock
Lock duration -> 15 minutes
Repeat suspicious attempts -> require super admin review
8. Frontend Security Requirements
8.1 Do Not Store Sensitive Tokens in Browser Storage

Do not use:

localStorage for access tokens
localStorage for refresh tokens
sessionStorage for refresh tokens
IndexedDB for tokens

Use:

httpOnly cookies
Backend session validation
CSRF protection when using cookies
8.2 CSRF Protection

If using cookie-based auth:

Use SameSite cookies.
Use CSRF tokens for unsafe requests.
Apply CSRF checks to POST, PATCH, PUT, DELETE.
8.3 XSS Protection

Admin portal must:

Escape user-generated content.
Never dangerouslySetInnerHTML unless sanitized.
Sanitize rich text if used.
Use strict Content Security Policy.
Avoid loading unknown third-party scripts.
Never render user-uploaded SVG as inline HTML.
8.4 Security Headers

Configure production headers:

Content-Security-Policy
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy
Strict-Transport-Security
8.5 Prevent Clickjacking

Admin portal must not be iframe-able.

Use:

X-Frame-Options: DENY
frame-ancestors 'none' in CSP
8.6 No Indexing

Admin portal must not be indexed by search engines.

Add:

robots.txt disallow all
noindex meta tag
X-Robots-Tag: noindex, nofollow
8.7 Secure API Calls

All API requests must:

Use HTTPS in production
Send credentials only to trusted backend API
Handle 401 by refreshing session or redirecting to login
Handle 403 with access denied page
Never expose backend secrets
Never call private admin APIs from public pages
8.8 Data Export Protection

If export features exist:

Only super admin or permitted admin can export.
Require reason before export.
Create audit log.
Limit columns.
Mask child-sensitive data by default.
Watermark export with admin ID and timestamp.
Expire export file quickly.
9. Environment Variables

Use environment variables carefully.

NEXT_PUBLIC_APP_NAME="Skill Growth Admin"
NEXT_PUBLIC_APP_ENV="development"
NEXT_PUBLIC_API_BASE_URL="http://localhost:4000"

NEXT_PUBLIC_ENABLE_ANALYTICS="false"

SENTRY_DSN=""

Rules:

Only expose variables with NEXT_PUBLIC_ if safe for browser.
Do not expose secrets in frontend.
Do not expose database URL.
Do not expose JWT secrets.
Do not expose storage secrets.
Do not expose private API keys.
10. Admin Portal Folder Structure

Recommended Next.js App Router structure:

admin-portal/
  app/
    layout.tsx
    globals.css
    not-found.tsx
    error.tsx

    (auth)/
      login/
        page.tsx
      mfa/
        page.tsx
      forgot-password/
        page.tsx
      reset-password/
        page.tsx

    (protected)/
      layout.tsx
      dashboard/
        page.tsx

      users/
        page.tsx
        [id]/
          page.tsx

      kids/
        page.tsx
        [id]/
          page.tsx

      parents/
        page.tsx
        [id]/
          page.tsx

      mentors/
        page.tsx
        pending/
          page.tsx
        [id]/
          page.tsx

      organizations/
        page.tsx
        pending/
          page.tsx
        [id]/
          page.tsx

      posts/
        page.tsx
        pending/
          page.tsx
        flagged/
          page.tsx
        [id]/
          page.tsx

      comments/
        page.tsx
        pending/
          page.tsx
        flagged/
          page.tsx

      events/
        page.tsx
        pending/
          page.tsx
        [id]/
          page.tsx

      opportunities/
        page.tsx
        pending/
          page.tsx
        [id]/
          page.tsx

      reports/
        page.tsx
        [id]/
          page.tsx

      chat-safety/
        page.tsx
        flagged/
          page.tsx
        rooms/
          [id]/
            page.tsx

      mentor-assignments/
        page.tsx
        create/
          page.tsx
        [id]/
          page.tsx

      skills/
        page.tsx

      notifications/
        page.tsx
        create/
          page.tsx

      analytics/
        page.tsx
        users/
          page.tsx
        skills/
          page.tsx
        events/
          page.tsx
        safety/
          page.tsx

      audit-logs/
        page.tsx

      admins/
        page.tsx
        create/
          page.tsx
        [id]/
          page.tsx

      settings/
        page.tsx
        safety/
          page.tsx
        platform/
          page.tsx

      access-denied/
        page.tsx

  components/
    ui/
    layout/
      AdminSidebar.tsx
      AdminHeader.tsx
      AdminBreadcrumbs.tsx
      AdminMobileNav.tsx
    tables/
      DataTable.tsx
      TablePagination.tsx
      TableFilters.tsx
    forms/
      FormField.tsx
      SubmitButton.tsx
      SearchInput.tsx
    modals/
      ConfirmActionModal.tsx
      ReasonRequiredModal.tsx
      MediaPreviewModal.tsx
      UserStatusModal.tsx
    badges/
      RoleBadge.tsx
      StatusBadge.tsx
      VerificationBadge.tsx
      ModerationBadge.tsx
      RiskBadge.tsx
    safety/
      SafetyWarningCard.tsx
      ChildPrivacyNotice.tsx
      SensitiveDataReveal.tsx
      FlaggedTextHighlighter.tsx
    charts/
      MetricCard.tsx
      LineChartCard.tsx
      BarChartCard.tsx

  features/
    auth/
    dashboard/
    users/
    kids/
    parents/
    mentors/
    organizations/
    posts/
    comments/
    events/
    opportunities/
    reports/
    chat-safety/
    mentor-assignments/
    skills/
    notifications/
    analytics/
    audit-logs/
    admins/
    settings/

  lib/
    api/
      api-client.ts
      endpoints.ts
      api-errors.ts
    auth/
      auth-client.ts
      session.ts
      permissions.ts
    validation/
      schemas.ts
    utils/
      date.ts
      format.ts
      constants.ts
      permissions.ts
      query-keys.ts

  hooks/
    use-current-admin.ts
    use-permission.ts
    use-confirm-action.ts
    use-pagination.ts
    use-debounce.ts

  types/
    api.ts
    auth.ts
    user.ts
    admin.ts
    post.ts
    event.ts
    report.ts
    moderation.ts
    chat.ts
    analytics.ts

  middleware.ts
  next.config.js
  package.json
  tsconfig.json
11. Layout Structure
11.1 Auth Layout

Used for:

Login
MFA
Forgot password
Reset password

Auth pages must not show admin sidebar.

11.2 Protected Layout

Used for all admin pages.

Protected layout must:

Check admin session.
Load current admin.
Load permissions.
Redirect unauthenticated user to login.
Show access denied for missing permission.
Show sidebar and header.
Auto logout on session expiry.
11.3 Sidebar Navigation

Sidebar sections:

Dashboard

User Management
- Users
- Kids
- Parents
- Mentors
- Organizations

Content Moderation
- Posts
- Comments
- Reports
- Chat Safety

Events & Opportunities
- Events
- Opportunities

Skill Growth
- Skills
- Mentor Assignments

System
- Notifications
- Analytics
- Audit Logs
- Admins
- Settings

Menu items must appear only if admin has permission.

12. Required Admin Pages
12.1 Login Page

Path:

/login

Features:

Email field
Password field
Remember device option only if backend supports it
Forgot password link
Error handling
Rate-limit message
Redirect to MFA if needed

Security:

Do not reveal whether email exists.
Use generic error: Invalid credentials.
Disable submit while loading.
Do not log password.
12.2 MFA Page

Path:

/mfa

Features:

TOTP code input
Recovery code option
Resend email OTP only if fallback is enabled
Session challenge expiry

Security:

Limit attempts.
Do not allow direct access without login challenge.
Redirect to login if challenge expired.
12.3 Dashboard Page

Path:

/dashboard

Show:

Total users
Total kids
Total parents
Total mentors
Total organizations
Pending mentor approvals
Pending organization approvals
Pending posts
Pending events
Open reports
Flagged messages
New users today
Active events
Most active skills
Safety alerts

Dashboard should highlight urgent safety issues first:

Flagged child-safety reports
Flagged chat messages
Unreviewed reports
Unverified mentors trying to interact
Suspicious organization activity
12.4 Users Page

Path:

/users

Features:

Search users
Filter by role
Filter by status
Filter by country
Filter by created date
View user details
Suspend user
Ban user
Restore user
Soft delete user

Table columns:

Name
Email/phone masked
Role
Status
Country
Created date
Last login
Actions

Actions:

View
Suspend
Ban
Restore
Soft delete

Sensitive actions require:

Confirmation
Reason
Audit log
Permission check
12.5 User Detail Page

Path:

/users/[id]

Show:

Basic profile
Role
Status
Linked profiles
Posts summary
Reports summary
Moderation history
Login/session history if permitted
Audit history related to user

For kids, show child-safe layout:

Parent links
Privacy settings
Skill list
Mentor assignments
Event registrations
Reports involving kid
Content created by kid

Private child data must be masked unless permission allows.

12.6 Kids Management Page

Path:

/kids

Features:

List kids
Search by display name
Filter by parent approval
Filter by safety status
Filter by age group
Filter by skill
View linked parents
View assigned mentors
View safety reports

Kid table columns:

Display name
Age group
Parent approval
Visibility
Skills
Status
Created date
Safety flags
Actions

Admin actions:

View kid profile
Review safety
Update status
Suspend account
View linked parent
View mentor assignments

Rules:

Do not show exact date of birth in table.
Do not show email/phone in table.
Do not show exact location in table.
Mask private child data by default.
12.7 Parents Page

Path:

/parents

Features:

List parents
Search parent
View linked children
View approval status
View reports submitted by parent
Support parent account issues

Actions:

View parent
View linked kids
Help re-send child approval request
Suspend if abusive
12.8 Mentors Page

Path:

/mentors

Features:

List mentors
Filter by verification status
Filter by skill
Filter by country
View mentor profile
View documents
Approve mentor
Reject mentor
Request more information
Suspend mentor

Mentor table columns:

Name
Email masked
Skills
Verification status
Rating
Assigned kids count
Created date
Actions

Approval checks:

Review profile
Review expertise
Review documents
Review past reports
Review safety flags
Check submitted certificates

Actions require reason:

Approve
Reject
Request more info
Suspend

Rules:

Unverified mentors cannot coach kids.
Unverified mentors cannot start kid chat.
Unverified mentors should not appear as trusted mentors.
12.9 Organizations Page

Path:

/organizations

Features:

List organizations
Filter by verification status
View organization profile
View verification documents
View events
View opportunities
Approve organization
Reject organization
Request more info
Suspend organization

Organization table columns:

Organization name
Contact person
Email masked
Website
Verification status
Events count
Opportunities count
Created date
Actions

Approval checks:

Review organization details
Review website
Review documents
Review contact person
Review previous reports
Review external links

Rules:

Unverified organizations cannot publish events.
Unverified organizations cannot publish opportunities.
Organizations cannot directly message kids in MVP.
Organization-to-parent communication is allowed if safe.
12.10 Posts Moderation Page

Path:

/posts
/posts/pending
/posts/flagged

Features:

View pending posts
View flagged posts
View approved posts
Search posts
Filter by author role
Filter by skill
Filter by moderation status
Filter by report count
Approve post
Reject post
Hide post
Restore post

Post detail should show:

Author
Author role
Caption
Media preview
Skills
Visibility
Moderation status
Safety score
Report count
Comments summary
Created date

Moderation actions:

Approve
Reject
Hide
Restore
Escalate

Every rejection requires:

Reason
Optional note
Audit log
Notification to user where appropriate

Child-safety checks:

No phone number
No email
No exact address
No school address
No unsafe links
No adult content
No bullying
No suspicious external contact request
12.11 Comments Moderation Page

Path:

/comments
/comments/pending
/comments/flagged

Features:

View pending comments
View flagged comments
Search comment text
Filter by status
Filter by post
Filter by author
Approve comment
Reject comment
Hide comment
Escalate comment

Show flagged terms highlighted.

Rules:

Comments with contact info must be flagged.
Comments with bullying must be flagged.
Comments asking kids to move to another app must be flagged.
Comments asking for private meeting must be escalated.
12.12 Events Page

Path:

/events
/events/pending
/events/[id]

Features:

List events
Filter by status
Filter by organization
Filter by skill
Filter by age range
Filter by online/offline
View event details
Approve event
Reject event
Hide event
Review external URL

Event detail should show:

Title
Description
Organization
Skills
Age range
Location
Online/offline
External URL
Start time
End time
Registration count
Reports
Approval status

Approval checks:

Organization must be verified.
Age range must be clear.
Skill tags must be correct.
External URL must be safe.
Event description must not ask for unsafe contact.
Event location must not create child-safety risk.

Rules:

Only approved events appear in kid feed.
Only matching skill kids should strongly see the event.
Parent approval may be required for registration.
12.13 Opportunities Page

Path:

/opportunities
/opportunities/pending
/opportunities/[id]

Features:

List opportunities
Filter by organization
Filter by skill
Filter by age range
Approve opportunity
Reject opportunity
Hide opportunity
Review external link

Rules:

Only verified organizations can create opportunities.
Opportunities must be approved before visible.
Opportunities should route communication through parent/admin flow.
Organizations should not directly contact kids.
12.14 Reports Page

Path:

/reports
/reports/[id]

Features:

View reports
Filter by status
Filter by target type
Filter by severity
Filter by created date
Assign report to reviewer
Resolve report
Dismiss report
Escalate report

Report targets:

User
Kid
Mentor
Organization
Post
Comment
Message
Event
Opportunity

Report detail should show:

Reporter
Target
Reason
Description
Evidence
Related content
Previous reports
Safety history
Assigned reviewer
Resolution note
Audit history

Report statuses:

OPEN
IN_REVIEW
ESCALATED
RESOLVED
DISMISSED

Resolution actions:

No action
Warn user
Hide content
Suspend user
Ban user
Remove event
Restrict chat
Escalate to super admin

Every report resolution requires:

Resolution status
Reason
Reviewer ID
Timestamp
Audit log
12.15 Chat Safety Page

Path:

/chat-safety
/chat-safety/flagged
/chat-safety/rooms/[id]

This is one of the most sensitive modules.

Features:

View flagged messages
View flagged chat rooms
Filter by severity
Filter by sender role
Filter by chat type
Review message context
Restrict chat room
Suspend sender
Escalate case
Resolve flag

MVP allowed chat types:

Kid ↔ Parent
Parent ↔ Mentor
Kid ↔ Mentor after approved mentor assignment
Parent ↔ Organization
Admin ↔ User

Disabled in MVP:

Kid ↔ Organization direct chat
Kid ↔ Kid private chat
Open group chat

Flag message if it contains:

Phone number
Email address
Exact address
School address
External social handle
Payment request
Meeting request
Adult content
Bullying
Abuse
Suspicious link
Request to move to WhatsApp, Instagram, Telegram, etc.

Chat review rules:

Do not allow admins to browse all private chats freely.
Only show chats that are flagged, reported, or part of a safety case.
Require permission: chat_safety.view.
Require reason before opening sensitive chat context.
Create audit log when chat context is viewed.
Mask unrelated private messages where possible.
12.16 Mentor Assignments Page

Path:

/mentor-assignments
/mentor-assignments/create
/mentor-assignments/[id]

Features:

View assignments
Filter by mentor
Filter by kid
Filter by skill
Filter by status
Create assignment
End assignment
Request parent approval
View approval status

Assignment rules:

Mentor must be verified.
Kid must be parent-approved.
Parent should approve assignment.
Assignment should be skill-related.
Kid-mentor chat can open only after assignment approval.

Assignment form fields:

Kid
Mentor
Skill
Reason for assignment
Parent approval required
Notes
12.17 Skills Management Page

Path:

/skills

Features:

List skills
Create skill
Edit skill
Disable skill
Merge duplicate skills
Manage parent-child skill tree
Search skills

Default skills:

Art
Painting
Drawing
Music
Singing
Dance
Coding
Robotics
Writing
Football
Cricket
Swimming
Math
Science
Public Speaking
Photography

Rules:

Do not delete skills that are already used.
Use disable or merge instead.
Skill slug must be unique.
Skills affect feed recommendations.
12.18 Notifications Page

Path:

/notifications
/notifications/create

Features:

View sent notifications
Create admin notice
Send notification to role
Send notification to selected users
Send event announcement
Send safety notice

Rules:

Bulk notifications require permission.
Child-targeted notifications must be safe.
No promotional spam to kids.
Super admin approval may be required for mass notifications.
12.19 Analytics Page

Path:

/analytics
/analytics/users
/analytics/skills
/analytics/events
/analytics/safety

Show:

User growth
Active users
Kid signups
Parent approvals
Mentor approvals
Organization approvals
Popular skills
Top events
Event registrations
Post engagement
Reports count
Flagged messages count
Moderation backlog
Average moderation time
Safety incident trends

Rules:

Do not expose unnecessary child personal data.
Use aggregated analytics where possible.
Analyst role should not access private child records.
12.20 Audit Logs Page

Path:

/audit-logs

Features:

View audit logs
Filter by admin
Filter by action
Filter by target type
Filter by date
Search metadata
Export only if permitted

Audit log table columns:

Timestamp
Actor
Action
Target type
Target ID
IP address
User agent
Reason
Metadata

Rules:

Audit logs cannot be edited.
Audit logs cannot be deleted from admin portal.
Only super admin or permitted admins can view full audit logs.
Sensitive metadata should be masked.
12.21 Admin Management Page

Path:

/admins
/admins/create
/admins/[id]

Features:

List admins
Create admin
Change admin role
Activate/deactivate admin
Reset MFA
Force logout sessions
View admin activity

Rules:

Only super admin can create admins.
Only super admin can change admin roles.
Admin cannot change own role.
Admin cannot deactivate own account.
Admin cannot remove last super admin.
Every admin change must create audit log.
MFA is required for admin accounts.
12.22 Settings Page

Path:

/settings
/settings/safety
/settings/platform

Settings sections:

Platform settings
Safety settings
Moderation settings
Upload limits
Event approval settings
Chat rules
Notification settings
Admin security settings

Safety settings examples:

Require post moderation for kids
Require event approval
Require organization verification
Require mentor verification
Disable kid-to-kid chat
Disable kid-to-organization chat
Require parent approval for events
Require parent approval for mentor assignment

Rules:

Only super admin can change safety settings.
Every setting change requires reason.
Every setting change creates audit log.
Show warning before changing child-safety settings.
13. API Integration Plan

The admin portal must call backend API endpoints only.

Recommended API client:

lib/api/api-client.ts

API client responsibilities:

Set base URL
Send credentials/cookies
Handle 401
Handle 403
Handle API errors
Parse consistent API response
Support pagination
Support query params

Example response format:

{
  "success": true,
  "message": "Request successful",
  "data": {},
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}

Error response:

{
  "success": false,
  "message": "Forbidden",
  "errorCode": "AUTH_FORBIDDEN",
  "details": {}
}
14. Required Backend Admin Endpoints

The admin portal expects these backend endpoints.

Auth
POST /admin/auth/login
POST /admin/auth/mfa/verify
POST /admin/auth/logout
POST /admin/auth/refresh
GET  /admin/auth/me
POST /admin/auth/forgot-password
POST /admin/auth/reset-password
Dashboard
GET /admin/dashboard
Users
GET   /admin/users
GET   /admin/users/:id
PATCH /admin/users/:id/status
DELETE /admin/users/:id
Kids
GET /admin/kids
GET /admin/kids/:id
PATCH /admin/kids/:id/status
PATCH /admin/kids/:id/safety-settings
Parents
GET /admin/parents
GET /admin/parents/:id
GET /admin/parents/:id/children
Mentors
GET   /admin/mentors
GET   /admin/mentors/pending
GET   /admin/mentors/:id
PATCH /admin/mentors/:id/approve
PATCH /admin/mentors/:id/reject
PATCH /admin/mentors/:id/request-more-info
Organizations
GET   /admin/organizations
GET   /admin/organizations/pending
GET   /admin/organizations/:id
PATCH /admin/organizations/:id/approve
PATCH /admin/organizations/:id/reject
PATCH /admin/organizations/:id/request-more-info
Posts
GET   /admin/posts
GET   /admin/posts/pending
GET   /admin/posts/flagged
GET   /admin/posts/:id
PATCH /admin/posts/:id/approve
PATCH /admin/posts/:id/reject
PATCH /admin/posts/:id/hide
PATCH /admin/posts/:id/restore
Comments
GET   /admin/comments
GET   /admin/comments/pending
GET   /admin/comments/flagged
PATCH /admin/comments/:id/approve
PATCH /admin/comments/:id/reject
PATCH /admin/comments/:id/hide
Events
GET   /admin/events
GET   /admin/events/pending
GET   /admin/events/:id
PATCH /admin/events/:id/approve
PATCH /admin/events/:id/reject
PATCH /admin/events/:id/hide
Opportunities
GET   /admin/opportunities
GET   /admin/opportunities/pending
GET   /admin/opportunities/:id
PATCH /admin/opportunities/:id/approve
PATCH /admin/opportunities/:id/reject
PATCH /admin/opportunities/:id/hide
Reports
GET   /admin/reports
GET   /admin/reports/:id
PATCH /admin/reports/:id/assign
PATCH /admin/reports/:id/resolve
PATCH /admin/reports/:id/dismiss
PATCH /admin/reports/:id/escalate
Chat Safety
GET   /admin/chat-safety/flagged
GET   /admin/chat-safety/rooms/:id
PATCH /admin/chat-safety/messages/:id/resolve
PATCH /admin/chat-safety/rooms/:id/restrict
Mentor Assignments
GET   /admin/mentor-assignments
POST  /admin/mentor-assignments
PATCH /admin/mentor-assignments/:id/status
Skills
GET    /admin/skills
POST   /admin/skills
PATCH  /admin/skills/:id
DELETE /admin/skills/:id
POST   /admin/skills/:id/merge
Notifications
GET  /admin/notifications
POST /admin/notifications
Analytics
GET /admin/analytics/overview
GET /admin/analytics/users
GET /admin/analytics/skills
GET /admin/analytics/events
GET /admin/analytics/safety
Audit Logs
GET /admin/audit-logs
Admins
GET   /admin/admins
POST  /admin/admins
GET   /admin/admins/:id
PATCH /admin/admins/:id/role
PATCH /admin/admins/:id/status
POST  /admin/admins/:id/reset-mfa
POST  /admin/admins/:id/force-logout
Settings
GET   /admin/settings
PATCH /admin/settings
GET   /admin/settings/safety
PATCH /admin/settings/safety
15. Data Table Standards

All major list pages should use a reusable DataTable component.

Required features:

Pagination
Search
Filters
Sorting
Loading state
Empty state
Error state
Column visibility
Row actions
Bulk actions only where safe

Avoid dangerous bulk actions for:

Approving mentors
Approving organizations
Resolving safety reports
Viewing chat context
Changing child privacy settings
Deleting users

Bulk action may be allowed for:

Approve safe low-risk comments
Mark notifications as read
Export non-sensitive analytics
16. Forms and Validation

Use:

React Hook Form
Zod

Every form must validate:

Required fields
Email format
URL format
Text length
Enum values
Date ranges
File type
File size
Reason fields for admin actions

Admin action forms must include:

Action
Reason
Optional internal note
Confirm checkbox for dangerous actions

Dangerous actions include:

Suspend user
Ban user
Reject mentor
Reject organization
Hide post
Resolve serious report
Restrict chat
Change safety settings
Create admin
Change admin role
Export data
17. Sensitive Data Handling

Sensitive child data must be masked by default.

Mask:

Email
Phone
Exact date of birth
Exact address
School name
Parent contact details
Private chat text
Sensitive documents

Use a reveal component:

SensitiveDataReveal

Reveal flow:

1. Admin clicks reveal.
2. System checks permission.
3. Admin enters reason.
4. Backend logs audit event.
5. Data is revealed for current session/page only.

Do not permanently show sensitive data after refresh.

18. Child Safety Review UX

For safety-related cases, the UI must make the risk clear.

Use badges:

LOW
MEDIUM
HIGH
CRITICAL

Critical cases:

Adult content involving child
Grooming suspicion
Request to meet child privately
Repeated request for phone/email/address
Threats or self-harm content
Severe bullying
Suspicious organization behavior
Suspicious mentor behavior

Critical cases must show:

Red risk badge
Escalate button
Restrict user/chat button
Audit note requirement
19. Moderation Decision Standards

Each moderation decision must be consistent.

Approve

Allowed when:

Content is safe.
Content matches platform purpose.
Content has no private contact info.
Content has no bullying or abuse.
Content has no suspicious links.
Reject

Use when:

Content violates rules.
Content contains unsafe personal information.
Content is inappropriate for kids.
Content is spam.
Content has unsafe external links.
Hide

Use when:

Content was approved before but later reported.
Content needs temporary removal.
Safety risk is being reviewed.
Escalate

Use when:

Child safety risk is serious.
Mentor behavior is suspicious.
Organization behavior is suspicious.
Report needs senior review.
Legal/policy review may be needed.
20. Status Badge Standards

Use consistent statuses.

User statuses:

PENDING
ACTIVE
SUSPENDED
BANNED
DELETED

Verification statuses:

PENDING
APPROVED
REJECTED
NEEDS_MORE_INFO

Moderation statuses:

PENDING
APPROVED
REJECTED
FLAGGED
HIDDEN

Report statuses:

OPEN
IN_REVIEW
ESCALATED
RESOLVED
DISMISSED
21. Notification Rules

Admin portal should notify admins about:

New high-risk report
New flagged chat
Mentor verification pending
Organization verification pending
Event approval pending
Critical safety case
Large moderation backlog
Suspicious login activity

Use:

Header notification icon
Dashboard safety alerts
Optional email notification later
22. Search and Filters

Global admin search should support:

Users
Kids
Parents
Mentors
Organizations
Posts
Events
Reports
Skills

Search results must respect permissions.

Do not show restricted data in search previews.

23. Error Handling

Show friendly errors.

Common errors:

AUTH_UNAUTHORIZED
AUTH_FORBIDDEN
SESSION_EXPIRED
MFA_REQUIRED
VALIDATION_ERROR
RATE_LIMIT_EXCEEDED
USER_NOT_FOUND
POST_NOT_FOUND
EVENT_NOT_FOUND
REPORT_NOT_FOUND
ACTION_REQUIRES_REASON
SENSITIVE_DATA_PERMISSION_REQUIRED
INTERNAL_SERVER_ERROR

Frontend behavior:

401 -> redirect to login or refresh session
403 -> show access denied
404 -> show not found page
422 -> show form validation errors
429 -> show rate limit message
500 -> show generic error
24. Loading, Empty, and Error States

Every page must have:

Loading state
Empty state
Error state
Permission denied state
Retry option where appropriate

Examples:

No pending mentors.
No flagged messages.
No reports found.
You do not have permission to view audit logs.
25. Accessibility Requirements

Admin portal must support:

Keyboard navigation
Visible focus states
Readable contrast
Labels for form fields
Accessible dialogs
Accessible tables
Screen-reader friendly status labels
No color-only status communication
26. Performance Requirements

Admin pages should:

Use pagination.
Avoid loading all records at once.
Debounce search.
Cache safe queries with TanStack Query.
Refetch moderation queues after actions.
Lazy-load heavy media previews.
Use thumbnails for media.
Avoid rendering full video unless opened.
27. Frontend State Management

Use:

TanStack Query for server state.
React state for local UI state.
Zustand only if needed for lightweight global UI state.

Do not duplicate server data in global state unnecessarily.

Query keys should be centralized:

lib/utils/query-keys.ts
28. Media Preview Rules

For admin review, media previews must:

Use thumbnails by default.
Open full media only on admin action.
Require caution label for flagged content.
Avoid autoplay for videos.
Do not download files automatically.
Show file type and size.
Show uploader details.

For verification documents:

Only permitted admins can view.
Require reason for sensitive document access if needed.
Create audit log on view.
29. External URL Review

Events and opportunities may include external links.

Admin portal must show:

Full URL
Domain
Organization owner
Risk warning
Open in new tab
Copy URL
Approve/reject decision

Rules:

Open external links with rel="noopener noreferrer".
Do not auto-fetch unknown links from frontend.
Do not embed unknown pages in iframe.
Flag suspicious domains.
30. Admin Action Confirmation Pattern

All sensitive actions must use this pattern:

1. Admin clicks action.
2. Confirmation modal opens.
3. Modal explains consequence.
4. Admin enters reason.
5. Admin confirms.
6. Frontend sends request.
7. Backend performs permission check.
8. Backend creates audit log.
9. Frontend shows success.
10. UI refreshes relevant data.

Example dangerous modal title:

Suspend this user?

Example warning:

This action may restrict the user's access to the platform. Please provide a reason. This action will be recorded in audit logs.
31. Route Protection

Use Next.js middleware and server checks where possible.

Middleware responsibilities:

Redirect unauthenticated users away from protected routes.
Redirect authenticated users away from login page.
Optionally block admin portal in unknown environments.

Route-level permission checks:

Each protected page must declare required permission.
If missing permission, show /access-denied.

Example route permission map:

const routePermissions = {
  "/dashboard": "dashboard.view",
  "/users": "users.view",
  "/kids": "kids.view",
  "/mentors": "mentors.view",
  "/organizations": "organizations.view",
  "/posts": "posts.view",
  "/comments": "comments.view",
  "/events": "events.view",
  "/opportunities": "opportunities.view",
  "/reports": "reports.view",
  "/chat-safety": "chat_safety.view",
  "/mentor-assignments": "mentor_assignments.create",
  "/skills": "skills.manage",
  "/notifications": "notifications.send",
  "/analytics": "analytics.view",
  "/audit-logs": "audit_logs.view",
  "/admins": "admins.manage",
  "/settings": "settings.manage"
};
32. Component Naming Standards

Use clear names.

Examples:

UserStatusBadge
VerificationStatusBadge
ModerationStatusBadge
ReportStatusBadge
RiskLevelBadge
ApproveMentorModal
RejectMentorModal
ApproveOrganizationModal
RejectOrganizationModal
PostModerationCard
FlaggedMessageCard
SensitiveDataReveal
AdminActionButton
PermissionGate
33. PermissionGate Component

Create a reusable component:

<PermissionGate permission="mentors.approve">
  <ApproveMentorButton />
</PermissionGate>

Rules:

PermissionGate hides UI only.
Backend still enforces permissions.
Do not rely on PermissionGate for security.
34. Admin API Hooks

Each feature should have hooks.

Examples:

useCurrentAdmin()
useAdminPermissions()
useUsers()
useUserDetails(id)
useMentors()
usePendingMentors()
useApproveMentor()
useRejectMentor()
useOrganizations()
useApproveOrganization()
usePosts()
usePendingPosts()
useApprovePost()
useRejectPost()
useReports()
useResolveReport()
useFlaggedMessages()
useAuditLogs()
35. Testing Plan
35.1 Unit Tests

Test:

Permission helper
Route permission map
API client error handling
Zod schemas
Sensitive data masking
Status badge rendering
Risk badge rendering
35.2 Component Tests

Test:

Login form
MFA form
Data table
Confirm action modal
Reason required modal
PermissionGate
SensitiveDataReveal
Post moderation card
Flagged message card
35.3 Integration Tests

Test:

Admin login
MFA flow
Dashboard loading
Mentor approval
Organization approval
Post approval
Event approval
Report resolution
Chat safety review
Admin access denied flow
35.4 E2E Tests

Use Playwright.

Test flows:

Super admin login with MFA
Moderator cannot access admin management
Admin approves mentor
Admin rejects unsafe post
Safety reviewer reviews flagged chat
Event reviewer approves organization event
Support agent cannot view audit logs
Session expires and redirects to login
36. Development Order

Build in this exact order.

Phase 1: Project Foundation
1. Create Next.js project.
2. Setup TypeScript.
3. Setup Tailwind CSS.
4. Setup shadcn/ui or UI components.
5. Setup environment variables.
6. Setup API client.
7. Setup global layouts.
8. Setup error page.
9. Setup not found page.
Phase 2: Authentication
1. Login page.
2. MFA page.
3. Session check.
4. Logout.
5. Protected layout.
6. Middleware route protection.
7. Current admin hook.
8. Permission system.
Phase 3: Admin Layout
1. Sidebar.
2. Header.
3. Breadcrumbs.
4. Notification icon.
5. User menu.
6. Access denied page.
Phase 4: Dashboard
1. Dashboard metrics.
2. Safety alerts.
3. Pending approvals cards.
4. Moderation backlog cards.
5. Basic charts.
Phase 5: User Management
1. Users list.
2. User details.
3. Kids list.
4. Kid details.
5. Parents list.
6. Parent details.
7. User status actions.
8. Sensitive data masking.
Phase 6: Verification Workflows
1. Mentors list.
2. Pending mentors.
3. Mentor detail.
4. Approve/reject mentor.
5. Organizations list.
6. Pending organizations.
7. Organization detail.
8. Approve/reject organization.
Phase 7: Moderation Workflows
1. Posts moderation list.
2. Post detail.
3. Approve/reject/hide post.
4. Comments moderation list.
5. Comment approve/reject/hide.
6. Flagged content views.
Phase 8: Reports and Chat Safety
1. Reports list.
2. Report detail.
3. Resolve/dismiss/escalate report.
4. Flagged messages list.
5. Chat room safety review.
6. Restrict chat room.
Phase 9: Events and Opportunities
1. Events list.
2. Pending events.
3. Event detail.
4. Approve/reject event.
5. Opportunities list.
6. Approve/reject opportunity.
Phase 10: Skills and Mentor Assignments
1. Skills list.
2. Create/edit skill.
3. Skill tree.
4. Mentor assignments list.
5. Create mentor assignment.
6. End assignment.
Phase 11: Notifications and Analytics
1. Notifications list.
2. Create notification.
3. Analytics overview.
4. Users analytics.
5. Skills analytics.
6. Safety analytics.
Phase 12: System Security
1. Admin management.
2. Audit logs.
3. Settings.
4. Safety settings.
5. Session management.
6. MFA reset flow.
Phase 13: Testing and Hardening
1. Unit tests.
2. Component tests.
3. E2E tests.
4. Permission testing.
5. Security review.
6. Accessibility review.
7. Performance review.
37. MVP Completion Checklist

The admin portal MVP is complete when these work:

Admin login
MFA verification
Secure logout
Protected routes
Role/permission-based sidebar
Dashboard
User list
Kid list
Parent list
Mentor verification
Organization verification
Post moderation
Comment moderation
Event approval
Opportunity approval
Reports management
Chat safety review
Mentor assignment
Skills management
Audit logs
Admin management for super admin
Safety settings for super admin
Sensitive data masking
Reason-required admin actions
Consistent loading/error/empty states
38. Strict Security Checklist

Before production:

HTTPS enabled
Admin MFA required
No tokens in localStorage
Secure httpOnly cookies
CSRF protection enabled
CSP configured
Security headers configured
No secrets in NEXT_PUBLIC variables
No direct database access
Backend permission checks tested
Frontend route protection tested
Audit logs working
Sensitive data masked
Dangerous actions require reason
Rate limits enabled on backend
Session timeout enabled
Admin logout working
Force logout working
No public indexing
No unsafe third-party scripts
No open redirects
External links use noopener noreferrer
Error messages do not leak sensitive info
39. Agent Instructions

When building this admin portal, follow these rules:

Use Next.js App Router.
Use TypeScript strictly.
Use the backend API only.
Never connect to PostgreSQL directly from the admin portal.
Never expose secrets in frontend.
Never store tokens in localStorage.
Use secure cookie-based sessions if backend supports it.
Protect every admin route.
Implement RBAC permissions in frontend.
Never rely only on frontend permissions.
Show menu items based on permissions.
Require reason for sensitive actions.
Create UI support for audit logging.
Mask child-sensitive data by default.
Require permission and reason before revealing sensitive data.
Make child safety reports highly visible.
Do not allow unrestricted private chat browsing.
Use confirmation modals for dangerous actions.
Validate every form with Zod.
Use pagination for all large lists.
Use reusable DataTable components.
Use clear status badges.
Use safe media previews.
Avoid autoplay for videos.
Open external URLs safely.
Use loading, empty, and error states.
Write tests for permission-sensitive pages.
Build MVP workflows before advanced analytics.
Keep UI simple, fast, and safe.
Prioritize safety over convenience.
40. Final Admin Portal Goal

The admin portal must be a secure, permission-controlled operating system for the platform.

The main goals are:

Protect children
Control platform safety
Verify mentors
Verify organizations
Moderate content
Review reports
Handle flagged chats
Approve events and opportunities
Manage users
Manage skills
Audit every sensitive action
Give admins only the access they need

This admin portal must not behave like a normal dashboard only.

It must behave like a child-safety operations center.