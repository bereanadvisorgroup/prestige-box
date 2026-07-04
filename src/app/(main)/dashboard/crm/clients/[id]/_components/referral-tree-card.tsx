"use client";

import Link from "next/link";

import { ArrowUpRight } from "lucide-react";

import type { Client } from "@/types/crm";

interface ReferralTreeNode {
  id: string;
  name: string;
  isCurrent: boolean;
  isAncestor: boolean;
  children: ReferralTreeNode[];
}

interface ReferralTreeCardProps {
  client: Client & { person?: any };
  clientName: string;
  allClients: any[];
}

function RenderTreeNode({ node, isLast, isRoot }: { node: ReferralTreeNode; isLast: boolean; isRoot: boolean }) {
  return (
    <div className="relative pl-5 pb-2">
      {/* Vertical line connecting to parent */}
      {!isRoot && (
        <div className={`absolute left-0 top-0 w-px bg-neutral-300 dark:bg-zinc-800 ${isLast ? "h-3" : "h-full"}`} />
      )}
      {/* Horizontal connector line */}
      {!isRoot && <div className="absolute left-0 top-3 w-3 h-px bg-neutral-300 dark:bg-zinc-800" />}

      {/* Node label */}
      <div className="flex items-center gap-1.5 py-0.5">
        {node.isCurrent ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-neutral-850 text-white dark:bg-zinc-100 dark:text-zinc-900 border border-neutral-700 dark:border-zinc-350 shadow-xs">
            {node.name} (Current)
          </span>
        ) : (
          <Link
            href={`/dashboard/crm/clients/${node.id}`}
            className="inline-flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400 hover:text-primary hover:underline font-medium transition-colors"
          >
            <span>{node.name}</span>
            <ArrowUpRight className="h-3 w-3 opacity-60" />
          </Link>
        )}
      </div>

      {/* Render children recursively */}
      {node.children && node.children.length > 0 && (
        <div className="mt-1 pl-2">
          {node.children.map((child, idx) => (
            <RenderTreeNode key={child.id} node={child} isLast={idx === node.children.length - 1} isRoot={false} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ReferralTreeCard({ client, clientName, allClients = [] }: ReferralTreeCardProps) {
  // 1. Get referrer chain (oldest first)
  const ancestors: any[] = [];
  let curr = allClients.find((c) => c.id === client.id);
  const visited = new Set<string>(); // Prevent infinite loops just in case of cycles

  while (curr && curr.referredById) {
    if (visited.has(curr.id)) break;
    visited.add(curr.id);

    const parent = allClients.find((c) => c.id === curr.referredById);
    if (parent) {
      ancestors.unshift(parent);
      curr = parent;
    } else {
      break;
    }
  }

  // 2. Recursive function to find descendants
  function getDescendants(clientId: string): ReferralTreeNode[] {
    const children = allClients.filter((c) => c.referredById === clientId);
    return children.map((child) => {
      const name = `${child.person?.firstName || ""} ${child.person?.lastName || ""}`.trim();
      return {
        id: child.id,
        name,
        isCurrent: false,
        isAncestor: false,
        children: getDescendants(child.id),
      };
    });
  }

  // 3. Assemble tree starting from the oldest ancestor down to current client
  const currentClientNode: ReferralTreeNode = {
    id: client.id!,
    name: clientName,
    isCurrent: true,
    isAncestor: false,
    children: getDescendants(client.id!),
  };

  let rootNode: ReferralTreeNode;

  if (ancestors.length > 0) {
    let lastNode = currentClientNode;
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const ancestor = ancestors[i];
      const name = `${ancestor.person?.firstName || ""} ${ancestor.person?.lastName || ""}`.trim();
      const ancestorNode: ReferralTreeNode = {
        id: ancestor.id,
        name,
        isCurrent: false,
        isAncestor: true,
        children: [lastNode],
      };
      lastNode = ancestorNode;
    }
    rootNode = lastNode;
  } else {
    rootNode = currentClientNode;
  }

  const hasRelations = ancestors.length > 0 || rootNode.children.length > 0;

  return (
    <div className="flex flex-col h-full min-h-[220px] rounded-lg border border-neutral-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
      <h3 className="text-2xl font-medium tracking-tight text-neutral-800 dark:text-neutral-200 mb-4">
        Referral Tree:
      </h3>
      <div className="flex-1 overflow-y-auto max-h-[220px] pr-1 scrollbar-thin">
        {hasRelations ? (
          <div className="py-2">
            <RenderTreeNode node={rootNode} isLast={true} isRoot={true} />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic py-2">No referral relations to display.</p>
        )}
      </div>
    </div>
  );
}
