/**
 * Nickname equivalence clusters and helper utilities.
 * Enables bidirectional lookup of common first name variations, nicknames, and diminutives.
 */

// Clusters of equivalent first names (lowercase)
const NICKNAME_CLUSTERS: readonly (readonly string[])[] = [
  // A
  ["aaron", "ron", "ronnie"],
  ["abigail", "abby", "abbi", "gail"],
  ["albert", "al", "bert", "bertie"],
  ["alexander", "alex", "alec", "xander", "alexis", "sasha"],
  ["alexandra", "alexandria", "alex", "lexi", "lexie", "sasha", "sandra", "sandy"],
  ["alicia", "alice", "ali", "ally", "allie"],
  ["allison", "alison", "ally", "allie"],
  ["amanda", "mandy", "manda"],
  ["andrew", "andy", "drew"],
  ["andrea", "andi", "andie"],
  ["angela", "angie", "angel"],
  ["anthony", "tony", "ant"],
  ["arthur", "art", "artie"],
  // B
  ["barbara", "barb", "barbie", "babs"],
  ["benjamin", "ben", "benny", "benji"],
  ["beverly", "bev"],
  ["bradley", "brad"],
  ["brittany", "brit", "britt", "britney"],
  // C
  ["carolyn", "carol", "carrie", "caroline"],
  ["cassandra", "cassie", "cass", "sandra"],
  ["charles", "charlie", "charley", "chuck", "chas", "chaz"],
  ["charlotte", "charlie", "lottie"],
  ["christopher", "chris", "topher", "christian", "kris"],
  ["christine", "christina", "chris", "christie", "tina", "christy"],
  ["constance", "connie"],
  ["cynthia", "cindy"],
  // D
  ["daniel", "dan", "danny"],
  ["danielle", "dani", "danny", "danie"],
  ["david", "dave", "davey", "davy"],
  ["deborah", "debra", "deb", "debby", "debbie"],
  ["dennis", "denny"],
  ["donald", "don", "donnie", "donny"],
  ["dorothy", "dot", "dottie", "dolly"],
  ["douglas", "doug"],
  // E
  ["edward", "ed", "eddie", "eddy", "ted", "teddy", "ned"],
  ["eleanor", "ellie", "ella", "nora", "nell"],
  ["elijah", "eli"],
  ["elizabeth", "liz", "lizzie", "lizzy", "beth", "betty", "betsy", "eliza", "ellie", "lisa", "libby", "bess"],
  ["emma", "em", "emmy"],
  ["eugene", "gene"],
  ["evelyn", "evie", "eve", "lynne"],
  // F
  ["florence", "flo", "florrie"],
  ["frances", "fran", "frannie", "frankie"],
  ["francis", "frank", "frankie", "fran"],
  ["franklin", "frank", "frankie"],
  ["frederick", "fred", "freddie", "freddy", "fritz"],
  // G
  ["gabriel", "gabe"],
  ["gabrielle", "gabi", "gabby", "gabriella"],
  ["gary", "gare"],
  ["gerald", "jerry", "gerry"],
  ["gertrude", "trudy"],
  ["gregory", "greg", "gregg"],
  // H
  ["harold", "harry", "hal", "hank"],
  ["helen", "nell", "nellie", "elena"],
  ["henry", "hank", "harry", "hal"],
  // I
  ["isabella", "bella", "izzy", "izzie"],
  ["isaiah", "ike", "izzy"],
  // J
  ["jackson", "jack", "jax"],
  ["jacob", "jake", "coby"],
  ["jacqueline", "jackie", "jaclyn", "jacki"],
  ["james", "jim", "jimmy", "jamie", "jimbo"],
  ["jeffrey", "geoffrey", "jeff", "geoff"],
  ["jennifer", "jen", "jenny", "jenn"],
  ["jerome", "jerry"],
  ["jessica", "jess", "jessie"],
  ["john", "jon", "johnny", "jonny", "jonathan", "jonathon", "jack", "ian", "sean", "shawn", "shaun"],
  ["joseph", "joe", "joey"],
  ["joshua", "josh"],
  ["judith", "judy", "judi"],
  // K
  ["katherine", "catherine", "kathy", "cathy", "kate", "katie", "cat", "kay", "kathleen", "kat", "cath", "kathryn"],
  ["kenneth", "ken", "kenny"],
  ["kimberly", "kim", "kimmy"],
  // L
  ["lawrence", "larry", "laurence", "lars"],
  ["leonard", "leo", "len", "lenny"],
  ["louis", "lewis", "lou", "louie"],
  ["lucas", "luke"],
  // M
  ["madeline", "maddie", "maddy", "madelyn"],
  ["margaret", "maggie", "meg", "peggy", "marge", "margie", "margo", "greta", "rita", "peg"],
  ["matthew", "matt", "matty", "mat"],
  ["megan", "meg", "meghan"],
  ["melissa", "missy", "mel", "lissa"],
  ["michael", "mike", "mikey", "mick", "micky"],
  ["mitchell", "mitch"],
  // N
  ["natalie", "nat", "natalia"],
  ["nathan", "nathaniel", "nate"],
  ["nicholas", "nick", "nicky", "nico"],
  // O
  ["oliver", "ollie"],
  ["olivia", "liv", "livvy"],
  // P
  ["pamela", "pam"],
  ["patricia", "pat", "patty", "patsy", "trish", "tricia"],
  ["patrick", "pat", "patty", "paddy"],
  ["peter", "pete"],
  ["philip", "phillip", "phil"],
  // R
  ["raymond", "ray"],
  ["rebecca", "becky", "becca", "bekah"],
  ["richard", "rick", "ricky", "dick", "rich", "richie", "dickie"],
  ["robert", "bob", "bobby", "rob", "robbie", "robby", "bert", "bobbie"],
  ["roger", "rog", "rodger"],
  ["ronald", "ron", "ronnie", "ronny"],
  ["rosemary", "rosie", "rose"],
  ["russell", "russ", "rusty"],
  // S
  ["samantha", "sam", "sammy"],
  ["samuel", "sam", "sammy"],
  ["sandra", "sandy"],
  ["sarah", "sara", "sally", "sadie"],
  ["sophia", "sophie"],
  ["stephanie", "steph", "stefanie", "stef"],
  ["steven", "stephen", "steve", "stevie"],
  ["susan", "suzanne", "sue", "susie", "suzy", "suzan"],
  // T
  ["theodore", "ted", "teddy", "theo"],
  ["theresa", "teresa", "terry", "tess", "tessa"],
  ["thomas", "tom", "tommy"],
  ["timothy", "tim", "timmy"],
  // V
  ["valerie", "val"],
  ["victor", "vic"],
  ["victoria", "vicky", "vicki", "tori"],
  ["vincent", "vince", "vinnie"],
  ["virginia", "ginny", "ginger"],
  // W
  ["walter", "walt", "wally"],
  ["william", "will", "willy", "willie", "bill", "billy", "liam"],
  // Z
  ["zachary", "zach", "zack", "zac"],
];

// Inverted index for O(1) variant lookup: maps lowercased name -> Set of all variants in its cluster
const NICKNAME_INDEX: Map<string, Set<string>> = new Map();

for (const cluster of NICKNAME_CLUSTERS) {
  const clusterSet = new Set<string>();
  for (const name of cluster) {
    clusterSet.add(name.toLowerCase().trim());
  }
  for (const name of cluster) {
    const key = name.toLowerCase().trim();
    const existing = NICKNAME_INDEX.get(key);
    if (existing) {
      for (const item of clusterSet) {
        existing.add(item);
      }
    } else {
      NICKNAME_INDEX.set(key, new Set(clusterSet));
    }
  }
}

/**
 * Normalizes a name string for comparison (trimmed, lowercased).
 */
export function normalizeName(name: string | null | undefined): string {
  if (!name) return "";
  return name.trim().toLowerCase();
}

/**
 * Returns all nickname and formal name variants for a given first name.
 * Always includes the lowercased input name itself.
 */
export function getNicknameVariants(name: string | null | undefined): string[] {
  const normalized = normalizeName(name);
  if (!normalized) return [];

  const foundSet = NICKNAME_INDEX.get(normalized);
  if (foundSet) {
    return Array.from(foundSet);
  }

  return [normalized];
}

/**
 * Checks if two first names are either identical (case-insensitive)
 * or belong to the same nickname equivalence cluster.
 */
export function isNicknameMatch(nameA: string | null | undefined, nameB: string | null | undefined): boolean {
  const normA = normalizeName(nameA);
  const normB = normalizeName(nameB);

  if (!normA || !normB) return false;
  if (normA === normB) return true;

  const variantsA = NICKNAME_INDEX.get(normA);
  if (variantsA?.has(normB)) {
    return true;
  }

  const variantsB = NICKNAME_INDEX.get(normB);
  if (variantsB?.has(normA)) {
    return true;
  }

  return false;
}
