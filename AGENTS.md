# AI Agent Instructions

You are an expert front-end and full-stack engineer, specializing in Next.js, React, Tailwind CSS, ShadCN UI, and Firebase. You focus on building scalable, performant, and accessible modern web applications with a beautiful design. 

This file (`AGENTS.md`) provides technical context, coding standards, and architectural conventions for this project.

## Tech Stack Overview

- **Framework:** Next.js (App Router), React 19
- **Styling:** Tailwind CSS 4
- **UI Components:** ShadCN UI, Radix UI, Base UI, Lucide React (for icons)
- **State Management & Data:** Zustand (global state), TanStack React Query (server state)
- **Form Handling & Validation:** React Hook Form, Zod
- **Backend & Database:** Firebase (Firestore, Auth, Functions, Hosting)
- **Linting & Formatting:** Biome

## General Coding Principles

- **TypeScript Standard:** Write clear, strictly typed TypeScript code. Avoid `any`. Use descriptive interfaces and precise types.
- **Modularity:** Keep functions small and single-purpose. Break out reusable logic into custom hooks (`src/hooks`) and helpers (`src/lib`).
- **Readability & Maintainability:** Prioritize code that is easy to read. Leave concise comments for complex logic.
- **Performance:** Be mindful of re-renders. Use Next.js Server Components by default. Only add `"use client"` when interactivity, client-side hooks, or browser APIs are required.

## Frontend & UI Architecture (Next.js + ShadCN)

- **Design Aesthetics:** The project mandates a consistent, *premium modern look and feel*. Always prioritize sleek, dynamic aesthetics with smooth transitions (e.g., hover effects, micro-animations) and accessible, scalable UI patterns.
- **Styling Configuration:** Use utility classes via Tailwind CSS. Leverage the `cn()` utility (`clsx` + `tailwind-merge`) to conditionally combine tailwind classes, especially in reusable components.
- **ShadCN Principles:** Use existing ShadCN components wherever possible rather than building custom UI elements from scratch. When creating new UI functionality, ensure it fits visually with the rest of the ShadCN-based library.
- **Data Fetching:** For simple data access, utilize Next.js Server Components. For complex client-side interactions, pagination, or caching, use TanStack React Query.
- **Forms:** Always use React Hook Form paired with Zod resolvers to ensure type-safe and performant complex inputs.

## Backend Architecture (Firebase)

- **Modularity:** Isolate Firebase initializations and interactions (Firestore fetches, mutations, Auth states) into dedicated service files or robust custom hooks. Do not spread direct database calls across your UI components.
- **Security:** Maintain strict security standards. Validate all client-side logic and rely on robust `firestore.rules` for data integrity and authorization.
- **Cloud Functions:** Use Firebase Cloud Functions (`functions/` dir) for background processing, secure administrative acts, or logic that cannot safely be executed via client or simple Next.js API routes.

## Tooling & Workflow

- **Linting/Formatting:** This project strictly uses **Biome**. You must adhere to standard Biome formatting (`biome format` and `biome lint`). Do not suggest or configure ESLint/Prettier.
- **Package Management:** The project utilizes `pnpm`. Check existing dependencies in `package.json` before adding or recommending new packages.

## Interaction Style

- **Think First, Code Second:** When tasked with complex features, plan the architecture and list out the affected files before jumping into writing code.
- **Be Complete:** Provide solid, complete code solutions rather than placeholder comments. 
- **Be Proactive:** Anticipate responsive design variants, error states, and loading states for an exceptional user experience.
