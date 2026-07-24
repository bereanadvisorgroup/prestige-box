# UI Components & Design System

This document outlines the design philosophy, UI components, and strict guidelines for frontend development in the Prestige Box application.

## Design Philosophy

Prestige Box adheres to an **Avant-Garde, Intentional Minimalism** philosophy.

- **Anti-Generic**: Standard bootstrapped layouts are rejected. The application strives for bespoke layouts, distinctive typography, and perfect spacing.
- **Dynamic UX**: The interface must feel alive. Hover effects, subtle micro-animations (e.g., via `tw-animate-css` or Framer Motion), and polished transitions are required.
- **Harmonious Palettes**: Curated color palettes with a robust, sleek Dark Mode are implemented via Tailwind CSS variables.

## Component Ecosystem

The application's component architecture strictly relies on established primitives rather than building complex interactive elements from scratch.

### 1. Base UI & Radix UI

The foundational primitives for accessible, unstyled interactive components (e.g., Modals, Dropdowns, Tabs, Accordions).

- **Combobox & Selection Picker**: Features interactive, searchable comboboxes built on the Base UI (`@base-ui/react`) `Combobox` primitives, custom styled for single/multi-selection tags (e.g., choosing associated grantors, trustees, or law firms in estate planning forms).

### 2. Shadcn UI

Prestige Box utilizes Shadcn UI components tailored to fit the Avant-Garde aesthetic.

- **Rule**: If a component exists in the Shadcn registry, it *must* be used. Custom implementations of standard primitives are prohibited.
- **Styling**: Components are styled using Tailwind CSS and the `cn()` utility (`clsx` + `tailwind-merge`) to handle conditional class merging safely.

### 3. Lucide React

All iconography is sourced exclusively from the `lucide-react` library.

### 4. Recharts & D3.js (Data Visualizations)

- **Recharts**: The responsive charting library used for timeline trends (e.g., client net worth graphs, corporate valuation curves). Charts use theme-based CSS variables to coordinate with light/dark modes.
- **D3.js**: Used for the interactive **Referrals Network Graph**. Implements a custom D3 force-directed simulation with drag-and-drop nodes, smooth zoom/pan controls, custom node coloring based on entity type, and direct navigation links to CRM profiles.

### 5. D3.js (Force-Directed Graphs)

Used for rendering complex network systems such as the interactive **Referral Tree** in `/dashboard/reports/referrals`:

- **Force Simulation**: Employs charge, link distance, center, and collision force parameters to simulate nodes dynamically.
- **Node Configuration**: Node colors map to standard CSS theme variables (e.g. `var(--chart-1)`, `var(--chart-2)`) based on entity type (Client, Company, Person). Radius is computed proportionally to the node's out-degree (the number of direct referrals initiated).
- **Interactions**: Nodes support drag gestures to modify the force simulation layout, zoom/pan capabilities, and double-click routing to navigate directly to the entity's dashboard profile.

### 6. Rich Text Editor & Threaded Notes Components (Tiptap & Notes Suite)

For notes and task descriptions, the project integrates Tiptap alongside specialized notes components:

- **Rich Composing**: Supports core extensions (`StarterKit`, `Placeholder`, `Link`, and `Mention`).
- **Interactive Mentions**: Provides an interactive suggestion popover using Radix/Base UI primitives for autocomplete user tagging (`@username`).
- **Multi-Entity Association Picker**: Combobox primitive (`src/components/notes/association-picker.tsx`) allowing users to select and associate notes across Clients, Companies, and individual People.
- **Person Notes Summary Card (`<PersonNotesCard />`)**: Component (`src/app/(main)/dashboard/crm/people/[id]/_components/person-notes-card.tsx`) rendered on Person profile pages, displaying recent notes associated with the individual with direct creation triggers and navigation to the full Notes tab.

### 7. Drag & Drop Primitives (@dnd-kit)

Used for task management, pipeline staging columns, and team member management:

- **Sortable & Draggable Elements**: Implements `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/modifiers` for Kanban columns and team member assignment lists (`<DragDropTeamMembers />`).
- **Micro-Interactions**: Provides immediate drag feedback and auto-saves the updated status or membership assignment to the server with smooth transition animations.

### 8. Workflow Graph Canvas (@xyflow/react)

Used for the admin visual template builder to construct, view, and modify workflow configurations.

- **Node-Based Editor**: Renders workflow steps as node cards on an infinite grid, supporting zoom, pan, and custom layout arrangements.
- **Outcomes & Edges**: Renders connection lines between nodes representing outcomes that lead to the next step, allowing branching paths to be designed visually.

### 9. Family Tree Visualizer (`<FamilyTree />`)

Used in Household management views (`src/app/(main)/dashboard/crm/households/_components/family-tree.tsx`):

- **Hierarchical Layout**: Renders interactive familial tree nodes displaying head of household, spouse, children, dependents, and extended relationships.
- **Node Management**: Facilitates direct editing, member role assignment, and navigation to member profile details.

### 10. Household Net Worth Chart (`<HouseholdNetWorthChart />`)

Used in Household overview screens (`src/app/(main)/dashboard/crm/households/[id]/_components/household-net-worth-chart.tsx`):

- **Recharts Integration**: Plots historical household net worth growth timelines alongside asset class breakdown distributions (Equities, Fixed Income, Real Estate, Cash, Managed Accounts).

### 11. Notebook Launcher Buttons (`<NotebookButton />` & `<CompanyNotebookButton />`)

Used on Client and Company internal workspace pages (`src/app/(main)/dashboard/crm/clients/[id]/_components/notebook-button.tsx` & `src/app/(main)/dashboard/crm/companies/[id]/_components/company-notebook-button.tsx`):

- **OneNote Integration**: Provides direct single-click navigation launcher to external OneNote notebooks (`notebook_url`) stored on client and company profiles.

### 12. Assigned Opportunities Overview Card (`<AssignedOpportunitiesCard />`)

Used on the primary CRM Overview dashboard (`src/components/opportunities/assigned-opportunities-card.tsx`):

- **Personal Pipeline Deals Widget**: Renders summary metrics and active pipeline deals assigned directly to the authenticated advisor (`assignedUserId`), enabling quick status updates and navigation.

### 13. Opportunity Management & AUM Dialogs (`<OpportunityDialog />` & `<AumDialog />`)

Used in CRM Opportunities and Admin Pipeline Settings:

- **AUM Configuration Modal (`<AumDialog />`)**: Admin modal dialog (`src/app/(main)/dashboard/admin/opportunities/_components/aum-dialog.tsx`) to set default AUM percentage ratios per pipeline.
- **Opportunity Dialog (`<OpportunityDialog />`)**: Comprehensive deal modal (`src/app/(main)/dashboard/crm/opportunities/_components/opportunity-dialog.tsx`) supporting revenue calculation toggles (AUM, Annual Fee, One-Time Fee), explicit vs derived calculation modes, advisor assignee selection, and real-time fee calculation.

### 14. Contextual Sidebar Navigation

Implemented in `src/app/(main)/dashboard/_components/sidebar/app-sidebar.tsx`:

- **Dynamic Context Switching**: Selecting a specific Client (`/clients/[id]`), Company (`/companies/[id]`), or Household (`/households/[id]`) seamlessly updates the primary sidebar menu to show entity-specific sub-navigation (Overview, Family/Cap Table, Assets, Liabilities, Insurance, Managed Accounts, Servicing Firms, and Internal Workspace).

## Strict Data Tables Standard

All Data Tables across the application (`/dashboard/crm`, `/dashboard/finance`, etc.) must strictly adhere to the following UI constraints:

1. **First Column Navigation**: The text in the first column of every table must link to the detailed landing/profile page of that entity. This link must be immediately followed by a Lucide `ArrowUpRight` icon.
2. **Direct Actions (Last Column)**: Ellipse menus (e.g., `DropdownMenu` or `MoreHorizontal` icons) are strictly forbidden. The final column must only contain direct action buttons.
3. **Action Buttons**:
   - **Edit**: Must use the Lucide `Pencil` icon and link directly to the edit page.
   - **Delete**: Must use the Lucide `Trash2` icon.
4. **Conditional Deletion**: The Delete button must be conditionally disabled if the record is linked to another entity (e.g., a Person linked to a Company). When disabled, it must be styled clearly as such (`text-muted-foreground/40 cursor-not-allowed`). The server must compute this `isLinked` flag before passing records to the table.

## Forms & Validation

Complex user inputs and forms are managed using a strict, type-safe pipeline:

- **React Hook Form**: Handles form state, rendering performance, and submission.
- **Zod**: Acts as the schema validation layer. Zod resolvers ensure that the form cannot submit invalid data to the Next.js Server Actions.
