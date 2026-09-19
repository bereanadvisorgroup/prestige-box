import { getStateName, normalizeStateToAbbreviation, US_STATE_CODES, US_STATES } from "./us-states";

function runTests() {
  console.log("--- Running US States Normalization & Dropdown Tests ---");

  // 1. Total states check
  console.assert(US_STATES.length >= 51, `Expected at least 51 entries (50 states + DC), found ${US_STATES.length}`);
  console.assert(US_STATE_CODES.includes("NC"), "US_STATE_CODES must include NC");
  console.assert(US_STATE_CODES.includes("CA"), "US_STATE_CODES must include CA");
  console.assert(US_STATE_CODES.includes("DC"), "US_STATE_CODES must include DC");

  // 2. Alphabetical ordering by 2-letter code
  for (let i = 0; i < US_STATES.length - 1; i++) {
    const current = US_STATES[i].code;
    const next = US_STATES[i + 1].code;
    console.assert(current.localeCompare(next) <= 0, `States should be ordered alphabetically: ${current} vs ${next}`);
  }

  // 3. Full name translations for all 50 states + DC
  const stateTests: [string, string][] = [
    ["Alabama", "AL"],
    ["Alaska", "AK"],
    ["Arizona", "AZ"],
    ["Arkansas", "AR"],
    ["California", "CA"],
    ["Colorado", "CO"],
    ["Connecticut", "CT"],
    ["Delaware", "DE"],
    ["District of Columbia", "DC"],
    ["Florida", "FL"],
    ["Georgia", "GA"],
    ["Hawaii", "HI"],
    ["Idaho", "ID"],
    ["Illinois", "IL"],
    ["Indiana", "IN"],
    ["Iowa", "IA"],
    ["Kansas", "KS"],
    ["Kentucky", "KY"],
    ["Louisiana", "LA"],
    ["Maine", "ME"],
    ["Maryland", "MD"],
    ["Massachusetts", "MA"],
    ["Michigan", "MI"],
    ["Minnesota", "MN"],
    ["Mississippi", "MS"],
    ["Missouri", "MO"],
    ["Montana", "MT"],
    ["Nebraska", "NE"],
    ["Nevada", "NV"],
    ["New Hampshire", "NH"],
    ["New Jersey", "NJ"],
    ["New Mexico", "NM"],
    ["New York", "NY"],
    ["North Carolina", "NC"],
    ["North Dakota", "ND"],
    ["Ohio", "OH"],
    ["Oklahoma", "OK"],
    ["Oregon", "OR"],
    ["Pennsylvania", "PA"],
    ["Rhode Island", "RI"],
    ["South Carolina", "SC"],
    ["South Dakota", "SD"],
    ["Tennessee", "TN"],
    ["Texas", "TX"],
    ["Utah", "UT"],
    ["Vermont", "VT"],
    ["Virginia", "VA"],
    ["Washington", "WA"],
    ["West Virginia", "WV"],
    ["Wisconsin", "WI"],
    ["Wyoming", "WY"],
  ];

  for (const [fullName, expectedCode] of stateTests) {
    const res = normalizeStateToAbbreviation(fullName);
    console.assert(res === expectedCode, `Full name "${fullName}" should map to "${expectedCode}", got "${res}"`);
  }

  // 4. Case-insensitivity tests
  console.assert(normalizeStateToAbbreviation("north carolina") === "NC", "lowercase full name failed");
  console.assert(normalizeStateToAbbreviation("CALIFORNIA") === "CA", "uppercase full name failed");
  console.assert(normalizeStateToAbbreviation("nEw YoRk") === "NY", "mixed-case full name failed");
  console.assert(normalizeStateToAbbreviation("texas") === "TX", "lowercase texas failed");

  // 5. Existing abbreviations (lowercase, mixed, uppercase)
  console.assert(normalizeStateToAbbreviation("nc") === "NC", "lowercase abbreviation 'nc' failed");
  console.assert(normalizeStateToAbbreviation("NC") === "NC", "uppercase abbreviation 'NC' failed");
  console.assert(normalizeStateToAbbreviation("ca") === "CA", "lowercase abbreviation 'ca' failed");
  console.assert(normalizeStateToAbbreviation("Fl") === "FL", "mixed abbreviation 'Fl' failed");

  // 6. Punctuation & spacing
  console.assert(normalizeStateToAbbreviation("  North Carolina  ") === "NC", "trimmed full name failed");
  console.assert(normalizeStateToAbbreviation("N.C.") === "NC", "dotted abbreviation 'N.C.' failed");
  console.assert(normalizeStateToAbbreviation("n.c.") === "NC", "lowercase dotted abbreviation 'n.c.' failed");
  console.assert(normalizeStateToAbbreviation("C.A.") === "CA", "dotted abbreviation 'C.A.' failed");
  console.assert(normalizeStateToAbbreviation("Washington, D.C.") === "DC", "Washington, D.C. failed");
  console.assert(normalizeStateToAbbreviation("Washington D.C.") === "DC", "Washington D.C. failed");
  console.assert(normalizeStateToAbbreviation("Washington DC") === "DC", "Washington DC failed");
  console.assert(normalizeStateToAbbreviation("D.C.") === "DC", "D.C. failed");

  // 7. Null, undefined, empty handling
  console.assert(normalizeStateToAbbreviation(null) === null, "null input should return null");
  console.assert(normalizeStateToAbbreviation(undefined) === null, "undefined input should return null");
  console.assert(normalizeStateToAbbreviation("") === null, "empty string should return null");
  console.assert(normalizeStateToAbbreviation("   ") === null, "whitespace string should return null");

  // 8. Reverse lookup
  console.assert(getStateName("NC") === "North Carolina", "getStateName NC failed");
  console.assert(getStateName("ca") === "California", "getStateName ca failed");
  console.assert(getStateName("NY") === "New York", "getStateName NY failed");
  console.assert(getStateName("ZZ") === null, "getStateName unknown code should return null");

  // 9. Unknown / foreign fallback preservation
  console.assert(normalizeStateToAbbreviation("Ontario") === "Ontario", "Unrecognized region preserved");
  console.assert(normalizeStateToAbbreviation("  London  ") === "London", "Unrecognized region trimmed");

  console.log("✅ All US States Normalization & Dropdown Tests Passed Successfully! 🎉");
}

runTests();
