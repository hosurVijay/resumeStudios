import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ScoringEngine } from "./ScoringEngine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.resolve(__dirname, "../../config/scoringRules.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

export const scoringEngine = new ScoringEngine(config);
export { ScoringEngine };
export { RuleFactory } from "./RuleFactory.js";
export { Rule, TermRule, YearsRule, SectionsRule, PatternRule } from "./Rule.js";
