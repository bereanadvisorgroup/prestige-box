import "server-only";

import { getCurrentActor } from "./actor";
import { SERVICE_SUBTYPE } from "./fields";
import { recordEvents } from "./record";

function diffIds(before: string[] | null | undefined, after: string[] | null | undefined) {
  const beforeSet = new Set(before ?? []);
  const afterSet = new Set(after ?? []);
  const added = [...afterSet].filter((id) => !beforeSet.has(id));
  const removed = [...beforeSet].filter((id) => !afterSet.has(id));
  return { added, removed };
}

interface ServiceLinkArgs {
  /** The service/vendor table name, e.g. "life_insurance_companies". */
  table: string;
  /** A human label for the firm, used in the event summary. */
  firmName: string;
  before: { clientIds?: string[] | null; companyIds?: string[] | null } | null;
  after: { clientIds?: string[] | null; companyIds?: string[] | null };
  /** When true, every link is treated as added (creation) or removed (deletion). */
  mode?: "diff" | "added" | "removed";
}

/**
 * Records "linked"/"unlinked" history events on each client and company whose
 * association with a service/vendor firm changed. Produces entries like
 * "Life Insurance linked" on the affected client's or company's history.
 */
export async function recordServiceLinkChanges(args: ServiceLinkArgs): Promise<void> {
  const { table, firmName, before, after, mode = "diff" } = args;
  const subType = SERVICE_SUBTYPE[table];
  if (!subType) return;

  let addedClients: string[];
  let removedClients: string[];
  let addedCompanies: string[];
  let removedCompanies: string[];

  if (mode === "added") {
    addedClients = after.clientIds ?? [];
    addedCompanies = after.companyIds ?? [];
    removedClients = [];
    removedCompanies = [];
  } else if (mode === "removed") {
    removedClients = before?.clientIds ?? [];
    removedCompanies = before?.companyIds ?? [];
    addedClients = [];
    addedCompanies = [];
  } else {
    const clientDiff = diffIds(before?.clientIds, after.clientIds);
    const companyDiff = diffIds(before?.companyIds, after.companyIds);
    addedClients = clientDiff.added;
    removedClients = clientDiff.removed;
    addedCompanies = companyDiff.added;
    removedCompanies = companyDiff.removed;
  }

  const events = [
    ...addedClients.map((id) => ({
      entityType: "client" as const,
      entityId: id,
      subType,
      action: "added" as const,
      summary: `${subType} linked${firmName ? `: ${firmName}` : ""}`,
      newValue: firmName,
    })),
    ...removedClients.map((id) => ({
      entityType: "client" as const,
      entityId: id,
      subType,
      action: "removed" as const,
      summary: `${subType} unlinked${firmName ? `: ${firmName}` : ""}`,
      oldValue: firmName,
    })),
    ...addedCompanies.map((id) => ({
      entityType: "company" as const,
      entityId: id,
      subType,
      action: "added" as const,
      summary: `${subType} linked${firmName ? `: ${firmName}` : ""}`,
      newValue: firmName,
    })),
    ...removedCompanies.map((id) => ({
      entityType: "company" as const,
      entityId: id,
      subType,
      action: "removed" as const,
      summary: `${subType} unlinked${firmName ? `: ${firmName}` : ""}`,
      oldValue: firmName,
    })),
  ];

  if (events.length > 0) await recordEvents(events);
}

export { getCurrentActor };
