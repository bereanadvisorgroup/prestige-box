const fs = require("fs");
const path = require("path");

const files = [
  "src/actions/money-managers.ts",
  "src/actions/record-keepers.ts",
  "src/actions/life-insurance-companies.ts",
  "src/actions/disability-insurance-companies.ts",
  "src/actions/long-term-care-insurance.ts",
];

files.forEach((file) => {
  const absolutePath = path.join(process.cwd(), file);
  const content = fs.readFileSync(absolutePath, "utf8");

  const entityName = path
    .basename(file, ".ts")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");

  let singularEntityName = entityName;
  if (singularEntityName.endsWith("Companies")) {
    singularEntityName = singularEntityName.replace("Companies", "Company");
  } else if (singularEntityName.endsWith("Managers")) {
    singularEntityName = singularEntityName.replace("Managers", "Manager");
  } else if (singularEntityName.endsWith("Keepers")) {
    singularEntityName = singularEntityName.replace("Keepers", "Keeper");
  }

  // Look for getX
  const funcName = `get${singularEntityName}`;

  if (!content.includes(`linkCompanyTo${singularEntityName}`)) {
    const addition = `
export async function linkCompanyTo${singularEntityName}(firmId: string, companyId: string) {
  try {
    const firmRes = await ${funcName}(firmId);
    if (!firmRes.success || !firmRes.${singularEntityName.charAt(0).toLowerCase() + singularEntityName.slice(1)}) return { success: false, error: "${singularEntityName} not found" };

    const currentIds = firmRes.${singularEntityName.charAt(0).toLowerCase() + singularEntityName.slice(1)}.companyIds || [];
    if (currentIds.includes(companyId)) return { success: true }; // already linked

    return update${singularEntityName}(firmId, { companyIds: [...currentIds, companyId] });
  } catch (error) {
    console.error(\`[linkCompanyTo${singularEntityName}] Error:\`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function unlinkCompanyFrom${singularEntityName}(firmId: string, companyId: string) {
  try {
    const firmRes = await ${funcName}(firmId);
    if (!firmRes.success || !firmRes.${singularEntityName.charAt(0).toLowerCase() + singularEntityName.slice(1)}) return { success: false, error: "${singularEntityName} not found" };

    const currentIds = firmRes.${singularEntityName.charAt(0).toLowerCase() + singularEntityName.slice(1)}.companyIds || [];
    if (!currentIds.includes(companyId)) return { success: true }; // already unlinked

    return update${singularEntityName}(firmId, { companyIds: currentIds.filter((id: string) => id !== companyId) });
  } catch (error) {
    console.error(\`[unlinkCompanyFrom${singularEntityName}] Error:\`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}
`;
    fs.appendFileSync(absolutePath, addition);
    console.log(`Updated ${file}`);
  }
});
