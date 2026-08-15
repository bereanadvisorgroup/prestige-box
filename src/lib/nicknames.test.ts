import { getNicknameVariants, isNicknameMatch, normalizeName } from "./nicknames";

function testNicknames() {
  console.log("--- Running Nickname Equivalence Tests ---");

  // 1. Basic normalization
  console.assert(normalizeName("  John  ") === "john", "normalizeName whitespace fail");
  console.assert(normalizeName("") === "", "normalizeName empty fail");
  console.assert(normalizeName(null) === "", "normalizeName null fail");

  // 2. Direct matches
  console.assert(isNicknameMatch("John", "john") === true, "direct match lowercase fail");
  console.assert(isNicknameMatch("Matthew", "matthew") === true, "direct match matthew fail");
  console.assert(isNicknameMatch("Alice", "Bob") === false, "unrelated names match fail");

  // 3. Jon / Jonny / John / Jonathan
  console.assert(isNicknameMatch("Jon", "John") === true, "Jon -> John fail");
  console.assert(isNicknameMatch("Jonny", "John") === true, "Jonny -> John fail");
  console.assert(isNicknameMatch("Johnny", "Jon") === true, "Johnny -> Jon fail");
  console.assert(isNicknameMatch("Jonathan", "Jon") === true, "Jonathan -> Jon fail");
  console.assert(isNicknameMatch("John", "Jonny") === true, "John -> Jonny fail");

  // 4. Matt / Matthew
  console.assert(isNicknameMatch("Matt", "Matthew") === true, "Matt -> Matthew fail");
  console.assert(isNicknameMatch("Matty", "Matthew") === true, "Matty -> Matthew fail");
  console.assert(isNicknameMatch("Matthew", "Matt") === true, "Matthew -> Matt fail");

  // 5. Bob / Robert / Rob
  console.assert(isNicknameMatch("Bob", "Robert") === true, "Bob -> Robert fail");
  console.assert(isNicknameMatch("Rob", "Robert") === true, "Rob -> Robert fail");
  console.assert(isNicknameMatch("Bobby", "Robbie") === true, "Bobby -> Robbie fail");

  // 6. William / Bill / Liam / Will
  console.assert(isNicknameMatch("Bill", "William") === true, "Bill -> William fail");
  console.assert(isNicknameMatch("Billy", "Will") === true, "Billy -> Will fail");
  console.assert(isNicknameMatch("Liam", "William") === true, "Liam -> William fail");

  // 7. Elizabeth / Liz / Beth / Eliza
  console.assert(isNicknameMatch("Liz", "Elizabeth") === true, "Liz -> Elizabeth fail");
  console.assert(isNicknameMatch("Beth", "Elizabeth") === true, "Beth -> Elizabeth fail");
  console.assert(isNicknameMatch("Lizzy", "Eliza") === true, "Lizzy -> Eliza fail");

  // 8. Non-cluster name fallback
  const nonClusterVariants = getNicknameVariants("Xerxes");
  console.assert(nonClusterVariants.length === 1 && nonClusterVariants[0] === "xerxes", "fallback variant fail");
  console.assert(isNicknameMatch("Xerxes", "Xerxes") === true, "fallback exact match fail");
  console.assert(isNicknameMatch("Xerxes", "John") === false, "fallback non-match fail");

  // 9. Variants list checks
  const jonVariants = getNicknameVariants("Jon");
  console.assert(jonVariants.includes("john"), "Jon variants missing john");
  console.assert(jonVariants.includes("jonathan"), "Jon variants missing jonathan");
  console.assert(jonVariants.includes("jon"), "Jon variants missing jon");

  const mattVariants = getNicknameVariants("Matt");
  console.assert(mattVariants.includes("matthew"), "Matt variants missing matthew");
  console.assert(mattVariants.includes("matt"), "Matt variants missing matt");

  console.log("✅ All Nickname Equivalence Tests Passed Successfully! 🎉");
}

testNicknames();
