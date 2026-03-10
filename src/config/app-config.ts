import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Prestige Box",
  version: packageJson.version,
  copyright: `© ${currentYear}, Prestige Box.`,
  meta: {
    title: "Prestige Box",
    description: "Prestige Box is a modern CRM for Financial Advisor Firms.",
  },
};
