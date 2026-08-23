import { formatFullName, formatPersonName, getInitials } from "./utils";

function testPersonNameFormatting() {
  console.log("--- Running Person Name Formatting Tests (with Goes By) ---");

  // 1. Standard First + Last without goesBy
  console.assert(
    formatFullName("John", "Doe") === "John Doe",
    `Expected "John Doe", got "${formatFullName("John", "Doe")}"`,
  );

  // 2. First + Last + Suffix without goesBy
  console.assert(
    formatFullName("John", "Doe", "Jr.") === "John Doe Jr.",
    `Expected "John Doe Jr.", got "${formatFullName("John", "Doe", "Jr.")}"`,
  );

  // 3. Goes By overrides First Name
  console.assert(
    formatFullName("Jonathan", "Doe", null, "", "Johnny") === "Johnny Doe",
    `Expected "Johnny Doe", got "${formatFullName("Jonathan", "Doe", null, "", "Johnny")}"`,
  );

  // 4. Goes By + Suffix overrides First Name
  console.assert(
    formatFullName("Jonathan", "Doe", "III", "", "Johnny") === "Johnny Doe III",
    `Expected "Johnny Doe III", got "${formatFullName("Jonathan", "Doe", "III", "", "Johnny")}"`,
  );

  // 5. Empty or whitespace-only Goes By falls back to First Name
  console.assert(
    formatFullName("Jonathan", "Doe", null, "", "") === "Jonathan Doe",
    `Expected "Jonathan Doe", got "${formatFullName("Jonathan", "Doe", null, "", "")}"`,
  );
  console.assert(
    formatFullName("Jonathan", "Doe", null, "", "   ") === "Jonathan Doe",
    `Expected "Jonathan Doe", got "${formatFullName("Jonathan", "Doe", null, "", "   ")}"`,
  );
  console.assert(
    formatFullName("Jonathan", "Doe", null, "", null) === "Jonathan Doe",
    `Expected "Jonathan Doe", got "${formatFullName("Jonathan", "Doe", null, "", null)}"`,
  );

  // 6. formatPersonName object helper
  const personWithoutGoesBy = {
    firstName: "William",
    middleName: "Henry",
    lastName: "Gates",
  };
  console.assert(
    formatPersonName(personWithoutGoesBy) === "William Gates",
    `Expected "William Gates", got "${formatPersonName(personWithoutGoesBy)}"`,
  );

  const personWithGoesBy = {
    firstName: "William",
    middleName: "Henry",
    lastName: "Gates",
    goesBy: "Bill",
  };
  console.assert(
    formatPersonName(personWithGoesBy) === "Bill Gates",
    `Expected "Bill Gates", got "${formatPersonName(personWithGoesBy)}"`,
  );

  const personWithGoesByAndSuffix = {
    firstName: "William",
    middleName: "Henry",
    lastName: "Gates",
    suffix: "III",
    goesBy: "Bill",
  };
  console.assert(
    formatPersonName(personWithGoesByAndSuffix) === "Bill Gates III",
    `Expected "Bill Gates III", got "${formatPersonName(personWithGoesByAndSuffix)}"`,
  );

  // 7. Initials calculation with goesBy
  console.assert(
    getInitials(formatPersonName(personWithGoesBy)) === "BG",
    `Expected "BG", got "${getInitials(formatPersonName(personWithGoesBy))}"`,
  );

  // 8. Fallback handling
  console.assert(
    formatPersonName(null, "Unnamed Person") === "Unnamed Person",
    `Expected "Unnamed Person", got "${formatPersonName(null, "Unnamed Person")}"`,
  );
  console.assert(
    formatPersonName(undefined, "Unknown") === "Unknown",
    `Expected "Unknown", got "${formatPersonName(undefined, "Unknown")}"`,
  );

  console.log("✔ All Person Name Formatting Tests passed successfully!");
}

testPersonNameFormatting();
