# Task Management System — Implementation Plan

Status: in progress. Owner: admins/advisors servicing clients & companies.

## Locked decisions

| Topic | Decision |
|---|---|
| "Customer" | = the existing **companies** entity |
| Permissions | Any **admin/advisor** can view/edit/delete **any** task |
| Categories | **Other, Birthday, Wedding Anniversary, Policy Renewal** (replaces "Special Date") |
| Auto-task assignee | The client's **owning advisor** — new `clients.advisorId` field |
| Anniversary date | New `marriageDate` on the **Spouse** entry in `clients.familyMembers` |
| Recurrence | **Daily scheduled job (cron)** rolls tasks to next occurrence |
| v1 features | **All four**: Tiptap WYSIWYG, file attachments, Kanban drag-to-change-status, task activity history |

Additional judgment calls:
- "Policy Renewal" is a first-class category (renewals are auto-tasks and need a category).
- "Upcoming" on the dashboard card includes overdue tasks, sorted soonest-first, excluding Complete.

## 1. Data model (Drizzle — `src/db/schema.ts`)

### New `tasks` table
- `id` uuid PK
- `name` text — required
- `createdAt` timestamptz — required, `defaultNow()`, never edited
- `dueDate` timestamptz — required, editable
- `completeDate` timestamptz — nullable, set by system on Complete, cleared when status leaves Complete; never user-edited
- `status` enum `[New, In Process, Waiting Input, Complete]` — default `New`
- `category` enum `[Other, Birthday, Wedding Anniversary, Policy Renewal]` — default `Other`
- `priority` enum `[Low, Medium, High]` — default `Low`
- `description` text — Tiptap HTML (nullable)
- `attachments` jsonb — array of `{id, name, url, type, uploadedAt, uploadedBy}`
- `source` enum `[manual, auto]` — default `manual`
- `sourceType` enum `[birthday, anniversary, renewal]` nullable
- `sourceRefId` text nullable — anchor id (personId / familyMember id / policyId) for idempotent upsert + recurrence
- `createdBy` uuid (FK `users.uid`), `updatedAt`

### Junction tables
- `task_assignees` (`taskId`, `userId`) — userId resolves to an admin/advisor
- `task_associations` (`taskId`, `entityType` `[client, company]`, `entityId`)

### Changes to existing tables
- `clients`: add `advisorId` uuid (FK `users.uid`, nullable) — owning advisor
- `FamilyMemberSchema` (JSONB, no migration): add optional `marriageDate` (Spouse only)
- `changeHistory`: extend `entityType` to include `'task'`

Zod schemas in `src/types/crm.ts`: `TaskSchema`, `TaskStatus`, `TaskCategory`, `TaskPriority`, attachment/association/assignee schemas.

## 2. Server actions (`src/actions/tasks.ts`)
- `getTasks(filter)` — `all | { clientId } | { companyId } | { assigneeId }`, enriched
- `getTaskById`, `createTask`, `updateTask`, `deleteTask`
- `updateTaskStatus(taskId, status)` — encapsulates complete-date rule
- `getUpcomingTasksForUser(userId, limit=5)` — dashboard card

Complete-date rule (server-enforced):
- status → `Complete` (was not): set `completeDate = now`
- status leaves `Complete`: set `completeDate = null`

## 3. Auto-generation engine (`src/actions/task-sync.ts`)
Idempotent upsert keyed by `(sourceType, sourceRefId)`: ensure one open task with `dueDate` = next upcoming occurrence; assignee = client's `advisorId`.

Triggers (called from existing actions):
- `people` — on `pii.birthDate` add/update → birthday task
- `clients` — on Spouse `marriageDate` add/update → anniversary task
- `policies` — on `clientPolicies.renewalDate` add/update → renewal task (type from life/disability/LTC FK)

Daily cron (`/api/cron/sync-tasks`, secret-protected, Vercel Cron): rolls past/completed recurring tasks to next occurrence; backfills missing anchors.

Fallback when client has no `advisorId`: task created but flagged unassigned/needs-attention; surfaced on the global board.

## 4. Routes & UI
Shared `<TasksView scope={...} />` (scope = `all | {clientId} | {companyId}`):
- `/dashboard/crm/tasks` — global
- `/dashboard/crm/clients/[id]/internal/tasks` — client-scoped
- `/dashboard/crm/companies/[id]/internal/tasks` — company-scoped

Components:
- `TaskBoard` (Kanban) — 4 status columns; `@dnd-kit` drag → `updateTaskStatus` (applies complete-date rule)
- `TaskList` — TanStack table mirroring `history-table.tsx`; columns Name, Status, Priority, Category, Due Date, Complete Date, Assignees, Associations; filters + search
- `TaskFormDialog` — react-hook-form + Zod; Tiptap description; multi-select assignees & associations; attachment uploader; Create/Complete dates read-only
- Kanban/List toggle + "Create Task" button

Dashboard card (`src/app/(main)/dashboard/crm/page.tsx`): 5 soonest non-Complete tasks assigned to current user, due-date asc (overdue first); click → `/dashboard/crm/tasks`.

Access: task pages guarded to admin/advisor.

## 5. Dependencies / infra
- Tiptap (`@tiptap/react`, starter-kit)
- Vercel Cron (or Supabase pg_cron) for daily sync
- Drizzle migration: `tasks`, junctions, enums, `clients.advisorId`; backfill + advisor picker in client form

## 6. Build order
1. Schema + Zod types + migration + `clients.advisorId` + advisor picker/backfill
2. `tasks.ts` CRUD actions + complete-date rule + task history logging
3. Shared `TasksView`: List view + `TaskFormDialog` (Tiptap + attachments)
4. Kanban view + drag
5. Wire 3 routes + dashboard card
6. Auto-generation engine + triggers + daily cron
