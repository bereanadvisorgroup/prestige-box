import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIR = "src/actions";
const FILES = [
  "life-insurance-companies",
  "disability-insurance-companies",
  "long-term-care-insurance",
  "law-firms",
  "accounting-firms",
  "actuarial-firms",
  "banks",
  "property-and-casualty",
  "money-managers",
  "record-keepers",
];

const IMPORT_ANCHOR = `import { supabaseServer } from "@/lib/supabase.server";`;
const IMPORT_NEW = `import { recordServiceLinkChanges } from "@/lib/history/service-links";\n${IMPORT_ANCHOR}`;

const CREATE_OLD = `    const { data: inserted, error } = await supabaseServer.from(TABLE).insert(validated).select().single();\n\n    if (error) throw new Error((error as { message: string }).message);`;
const CREATE_NEW = `${CREATE_OLD}\n\n    await recordServiceLinkChanges({\n      table: TABLE,\n      firmName: (inserted as any).name ?? (inserted as any).firmName ?? "",\n      before: null,\n      after: { clientIds: inserted.clientIds, companyIds: inserted.companyIds },\n      mode: "added",\n    });`;

const UPDATE_OLD = `    const updateData = {\n      ...data,\n      updatedAt: new Date().toISOString(),\n    };\n\n    const { error } = await supabaseServer.from(TABLE).update(updateData).eq("id", id);\n\n    if (error) throw new Error((error as { message: string }).message);`;
const UPDATE_NEW = `    const { data: historyBefore } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();\n\n    const updateData = {\n      ...data,\n      updatedAt: new Date().toISOString(),\n    };\n\n    const { error } = await supabaseServer.from(TABLE).update(updateData).eq("id", id);\n\n    if (error) throw new Error((error as { message: string }).message);\n\n    await recordServiceLinkChanges({\n      table: TABLE,\n      firmName:\n        (data as any).name ??\n        (data as any).firmName ??\n        (historyBefore as any)?.name ??\n        (historyBefore as any)?.firmName ??\n        "",\n      before: { clientIds: historyBefore?.clientIds, companyIds: historyBefore?.companyIds },\n      after: {\n        clientIds: data.clientIds !== undefined ? data.clientIds : historyBefore?.clientIds,\n        companyIds: data.companyIds !== undefined ? data.companyIds : historyBefore?.companyIds,\n      },\n    });`;

const DELETE_OLD = `    const { error } = await supabaseServer.from(TABLE).delete().eq("id", id);\n\n    if (error) throw new Error((error as { message: string }).message);`;
const DELETE_NEW = `    const { data: historyRemoved } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();\n\n    const { error } = await supabaseServer.from(TABLE).delete().eq("id", id);\n\n    if (error) throw new Error((error as { message: string }).message);\n\n    if (historyRemoved) {\n      await recordServiceLinkChanges({\n        table: TABLE,\n        firmName: (historyRemoved as any).name ?? (historyRemoved as any).firmName ?? "",\n        before: { clientIds: historyRemoved.clientIds, companyIds: historyRemoved.companyIds },\n        after: {},\n        mode: "removed",\n      });\n    }`;

function replaceOnce(content, oldStr, newStr, label, file) {
  const count = content.split(oldStr).length - 1;
  if (count !== 1) throw new Error(`[${file}] expected exactly 1 "${label}" anchor, found ${count}`);
  return content.replace(oldStr, newStr);
}

for (const name of FILES) {
  const path = join(DIR, `${name}.ts`);
  let content = readFileSync(path, "utf-8");
  content = replaceOnce(content, IMPORT_ANCHOR, IMPORT_NEW, "import", name);
  content = replaceOnce(content, CREATE_OLD, CREATE_NEW, "create", name);
  content = replaceOnce(content, UPDATE_OLD, UPDATE_NEW, "update", name);
  content = replaceOnce(content, DELETE_OLD, DELETE_NEW, "delete", name);
  writeFileSync(path, content);
  console.log(`patched ${name}.ts`);
}
console.log("done");
