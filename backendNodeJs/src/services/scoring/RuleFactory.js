import { TermRule, YearsRule, SectionsRule, PatternRule } from "./Rule.js";

export class RuleFactory {
  static createRule(def) {
    switch (def.type) {
      case "term":
      case "scoped_years":
      case "qualification":
        return new TermRule(def);
      case "years":
        return new YearsRule(def);
      case "sections":
        return new SectionsRule(def);
      case "pattern":
        return new PatternRule(def);
      default:
        return new TermRule(def);
    }
  }
}
