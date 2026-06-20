import { getActuarialFirms } from "./src/actions/actuarial-firms";
import { getBanks } from "./src/actions/banks";
import { getLawFirms } from "./src/actions/law-firms";
import { getPropertyAndCasualtyFirms } from "./src/actions/property-and-casualty";

async function run() {
  console.log("Fetching Actuarial...");
  try {
    const act = await getActuarialFirms();
    console.log("Actuarial resolved:", act.success);
  } catch (e) {
    console.log("Actuarial error:", e);
  }

  console.log("Fetching Banks...");
  try {
    const b = await getBanks();
    console.log("Banks resolved:", b.success);
  } catch (e) {
    console.log("Banks error:", e);
  }

  console.log("Fetching Law...");
  try {
    const l = await getLawFirms();
    console.log("Law resolved:", l.success);
  } catch (e) {
    console.log("Law error:", e);
  }

  console.log("Fetching P&C...");
  try {
    const p = await getPropertyAndCasualtyFirms();
    console.log("P&C resolved:", p.success);
  } catch (e) {
    console.log("P&C error:", e);
  }
}

run();
