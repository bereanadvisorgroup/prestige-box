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

### 5. Rich Text Editor (Tiptap)
For notes and task descriptions, the project integrates Tiptap:
- **Rich Composing**: Supports core extensions (`StarterKit`, `Placeholder`, `Link`, and `Mention`).
- **Interactive Mentions**: Provides an interactive suggestion popover using Radix/Base UI primitives for autocomplete user tagging (`@username`).

### 6. Drag & Drop Primitives (@dnd-kit)
Used for task management and pipeline staging columns:
- **Sortable & Draggable Elements**: Implements `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/modifiers` for Kanban columns.
- **Micro-Interactions**: Provides immediate drag feedback and auto-saves the updated status to the server with transition animations.

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
