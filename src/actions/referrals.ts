"use server";

import { supabaseServer } from "@/lib/supabase.server";

export type ReferralNodeType = "Client" | "Company" | "Person" | "Advisor";

export interface ReferralTreeNode {
  id: string;
  name: string;
  type: ReferralNodeType;
  url: string;
}

export interface ReferralTreeLink {
  source: string; // referrer id
  target: string; // referred client id
}

export interface ReferralTypeDatum {
  name: string;
  count: number;
}

export interface ReferralTimePoint {
  month: string; // e.g. "Jul 2025"
  referred: number;
}

interface ClientRow {
  id: string;
  personId: string | null;
  referredById: string | null;
  referredByType: string | null;
  referredByCompanyId: string | null;
  referredByPersonId: string | null;
  referredByReferralTypeId: string | null;
  referredByEventId: string | null;
  referredByAdvisorId: string | null;
  createdAt: string | null;
}

// A client counts as "referred" when a source type is set (excluding the cleared "none" value)
// and at least one of the referral foreign keys is populated.
const isReferred = (c: ClientRow) =>
  !!c.referredByType &&
  c.referredByType !== "none" &&
  !!(
    c.referredById ||
    c.referredByCompanyId ||
    c.referredByPersonId ||
    c.referredByReferralTypeId ||
    c.referredByEventId ||
    c.referredByAdvisorId
  );

export async function getReferralsReportData() {
  try {
    const [
      { data: clients },
      { data: people },
      { data: companies },
      { data: referralTypes },
      { data: events },
      { data: users },
    ] = await Promise.all([
      supabaseServer
        .from("clients")
        .select(
          "id, personId, referredById, referredByType, referredByCompanyId, referredByPersonId, referredByReferralTypeId, referredByEventId, referredByAdvisorId, createdAt",
        ),
      supabaseServer.from("people").select("id, firstName, lastName"),
      supabaseServer.from("companies").select("id, name, dba"),
      supabaseServer.from("referral_types").select("id, name"),
      supabaseServer.from("events").select("id, title"),
      supabaseServer.from("users").select("uid, firstName, lastName, role"),
    ]);

    const clientRows = (clients || []) as ClientRow[];

    const peopleMap = new Map((people || []).map((p) => [p.id, p]));
    const companiesMap = new Map((companies || []).map((c) => [c.id, c]));
    const referralTypesMap = new Map((referralTypes || []).map((r) => [r.id, r]));
    const eventsMap = new Map((events || []).map((e) => [e.id, e]));
    const usersMap = new Map((users || []).map((u) => [u.uid, u]));
    const clientsMap = new Map(clientRows.map((c) => [c.id, c]));

    const personName = (p?: { firstName: string | null; lastName: string | null }) =>
      `${p?.firstName || ""} ${p?.lastName || ""}`.trim() || "Unknown Person";
    const clientName = (c: ClientRow) => {
      const p = c.personId ? peopleMap.get(c.personId) : undefined;
      return p ? personName(p) : "Unknown Client";
    };

    // --- 1. Referral tree (client/company/person referrers -> referred clients) ---
    const nodeMap = new Map<string, ReferralTreeNode>();
    const treeLinks: ReferralTreeLink[] = [];
    const addNode = (node: ReferralTreeNode) => {
      if (!nodeMap.has(node.id)) nodeMap.set(node.id, node);
    };

    for (const c of clientRows) {
      let referrerId: string | null = null;

      if (c.referredByType === "client" && c.referredById && clientsMap.has(c.referredById)) {
        const r = clientsMap.get(c.referredById)!;
        addNode({ id: r.id, name: clientName(r), type: "Client", url: `/dashboard/crm/clients/${r.id}` });
        referrerId = r.id;
      } else if (c.referredByType === "company" && c.referredByCompanyId && companiesMap.has(c.referredByCompanyId)) {
        const co = companiesMap.get(c.referredByCompanyId)!;
        addNode({
          id: co.id,
          name: co.dba ? `${co.name} (${co.dba})` : co.name || "Company",
          type: "Company",
          url: `/dashboard/crm/companies/${co.id}`,
        });
        referrerId = co.id;
      } else if (c.referredByType === "person" && c.referredByPersonId && peopleMap.has(c.referredByPersonId)) {
        const pe = peopleMap.get(c.referredByPersonId)!;
        addNode({ id: pe.id, name: personName(pe), type: "Person", url: `/dashboard/crm/people/${pe.id}` });
        referrerId = pe.id;
      } else if (c.referredByType === "advisor" && c.referredByAdvisorId && usersMap.has(c.referredByAdvisorId)) {
        const u = usersMap.get(c.referredByAdvisorId)!;
        const name = `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Unknown Advisor";
        addNode({ id: u.uid, name, type: "Advisor", url: `/dashboard/admin/users` });
        referrerId = u.uid;
      }

      if (referrerId) {
        addNode({ id: c.id, name: clientName(c), type: "Client", url: `/dashboard/crm/clients/${c.id}` });
        treeLinks.push({ source: referrerId, target: c.id });
      }
    }

    const treeNodes = Array.from(nodeMap.values());

    // --- 2. Referral-type pie (clients sourced from the referral-type select list or events) ---
    const typeCounts = new Map<string, number>();
    for (const c of clientRows) {
      if (c.referredByType === "referral_type" && c.referredByReferralTypeId) {
        const rt = referralTypesMap.get(c.referredByReferralTypeId);
        const name = rt?.name || "Unknown";
        typeCounts.set(name, (typeCounts.get(name) || 0) + 1);
      } else if (c.referredByType === "event" && c.referredByEventId) {
        const ev = eventsMap.get(c.referredByEventId);
        const name = ev ? `Event: ${ev.title}` : "Unknown Event";
        typeCounts.set(name, (typeCounts.get(name) || 0) + 1);
      }
    }
    const referralTypePie: ReferralTypeDatum[] = Array.from(typeCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // --- 3. Referred clients over the past 12 months (bucketed by createdAt) ---
    const now = new Date();
    const months: { key: string; month: string; referred: number }[] = [];
    const monthIndex = new Map<string, number>();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthIndex.set(key, months.length);
      months.push({
        key,
        month: d.toLocaleString("en-US", { month: "short", year: "numeric" }),
        referred: 0,
      });
    }
    for (const c of clientRows) {
      if (!c.createdAt || !isReferred(c)) continue;
      const d = new Date(c.createdAt);
      const idx = monthIndex.get(`${d.getFullYear()}-${d.getMonth()}`);
      if (idx !== undefined) months[idx].referred++;
    }
    const timeSeries: ReferralTimePoint[] = months.map((m) => ({ month: m.month, referred: m.referred }));

    // --- Summary totals ---
    const totalReferred = clientRows.filter(isReferred).length;
    const totalInTree = treeNodes.filter((n) => n.type === "Client").length;
    const referredLastYear = timeSeries.reduce((acc, m) => acc + m.referred, 0);

    return {
      success: true as const,
      treeNodes,
      treeLinks,
      referralTypePie,
      timeSeries,
      totalReferred,
      totalInTree,
      referredLastYear,
    };
  } catch (error) {
    console.error(`[getReferralsReportData] Error:`, error);
    return {
      success: false as const,
      error: (error as { message: string }).message,
      treeNodes: [],
      treeLinks: [],
      referralTypePie: [],
      timeSeries: [],
      totalReferred: 0,
      totalInTree: 0,
      referredLastYear: 0,
    };
  }
}
