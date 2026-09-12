import { formatFullName, formatLegalFullName, formatPersonLegalName, formatPersonName, getInitials } from "./utils";

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

  // 9. Legal name formatting: Prefix FirstName MiddleName LastName Suffix "Goes By"
  console.assert(
    formatLegalFullName("Dr.", "Christopher", "Alexander", "Roob", "Jr.", "Christ") ===
      'Dr. Christopher Alexander Roob Jr. "Christ"',
    `Expected 'Dr. Christopher Alexander Roob Jr. "Christ"', got '${formatLegalFullName("Dr.", "Christopher", "Alexander", "Roob", "Jr.", "Christ")}'`,
  );

  console.assert(
    formatLegalFullName(null, "Christ", null, "Roob", null, null) === "Christ Roob",
    `Expected 'Christ Roob', got '${formatLegalFullName(null, "Christ", null, "Roob", null, null)}'`,
  );

  const fullPerson = {
    prefix: "Dr.",
    firstName: "Christopher",
    middleName: "Alexander",
    lastName: "Roob",
    suffix: "Jr.",
    goesBy: "Christ",
  };
  console.assert(
    formatPersonLegalName(fullPerson) === 'Dr. Christopher Alexander Roob Jr. "Christ"',
    `Expected 'Dr. Christopher Alexander Roob Jr. "Christ"', got '${formatPersonLegalName(fullPerson)}'`,
  );

  const simplePerson = {
    firstName: "Christ",
    lastName: "Roob",
  };
  console.assert(
    formatPersonLegalName(simplePerson) === "Christ Roob",
    `Expected 'Christ Roob', got '${formatPersonLegalName(simplePerson)}'`,
  );

  console.assert(
    formatPersonLegalName(null, "") === "",
    `Expected empty string for null person, got '${formatPersonLegalName(null, "")}'`,
  );

  console.log("✔ All Person Name Formatting Tests passed successfully!");
}

testPersonNameFormatting();
