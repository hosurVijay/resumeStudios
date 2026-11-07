import crypto from "crypto";
import { RuleFactory } from "./RuleFactory.js";

export class ScoringEngine {
  constructor(config) {
    this.validateConfig(config);
    this.config = config;
    this.catalogRules = config.rules.map((r) => RuleFactory.createRule(r));
  }

  validateConfig(config) {
    if (!config || !/^\d+\.\d+\.\d+$/.test(config.version)) {
      throw new Error("Scoring version must use major.minor.patch (e.g. 1.0.0).");
    }
    if (config.mandatoryMultiplier < 1 || config.mandatoryMultiplier > 5) {
      throw new Error("mandatoryMultiplier must be between 1 and 5.");
    }
    if (config.partialCredit < 0 || config.partialCredit > 1) {
      throw new Error("partialCredit must be between 0 and 1.");
    }
    if (!config.thresholds || config.thresholds.strong <= config.thresholds.developing) {
      throw new Error("Threshold strong must be greater than developing.");
    }
    if (!Array.isArray(config.rules) || config.rules.length === 0) {
      throw new Error("Config must supply at least one scoring rule.");
    }
  }

  getConfigHash() {
    return crypto
      .createHash("sha256")
      .update(JSON.stringify(this.config))
      .digest("hex");
  }

  // 1. Extract requirements from JD text
  extractRequirements(jdText) {
    const sentences = jdText
      .split(/\n|(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const output = [];

    for (const rule of this.catalogRules) {
      if (rule.always) continue;

      let relevant = [];
      if (rule.type === "years") {
        relevant = sentences.filter((s) => rule.extractYears(s) !== null);
      } else if (rule.terms && rule.terms.length) {
        relevant = sentences.filter((s) => rule.terms.some((t) => rule.contains(s, t)));
      }

      if (!relevant.length) continue;

      const sourceText = relevant.join("\n").slice(0, 2000);
      const isMandatory = /\b(required|must|mandatory|minimum|essential)\b/i.test(sourceText);

      const requirementDef = {
        id: rule.id,
        type: rule.type,
        label: rule.label,
        weight: rule.weight,
        suggestion: rule.suggestion,
        terms: rule.terms || [],
        priority: isMandatory ? "mandatory" : "preferred",
        source: sourceText,
        minimum: rule.type === "years" ? rule.extractYears(sourceText) || 0 : undefined,
      };

      output.push(RuleFactory.createRule(requirementDef));
    }

    return output;
  }

  // 2. Score candidate resume text against confirmed requirements
  calculateScore(resumeText, confirmedRequirements = []) {
    // Combine job requirements with baseline 'always' rules (e.g., standard resume structure)
    const alwaysRules = this.catalogRules.filter((r) => r.always);
    const activeRules = [...confirmedRequirements, ...alwaysRules];

    const breakdown = [];

    for (const rule of activeRules) {
      const { status, evidence } = rule.evaluate(resumeText);
      const isMandatory = rule.priority === "mandatory";
      const weight = rule.weight * (isMandatory ? this.config.mandatoryMultiplier : 1);

      let fraction = 0;
      if (status === "matched") fraction = 1;
      else if (status === "partial") fraction = this.config.partialCredit;

      const earned = weight * fraction;

      breakdown.push({
        id: rule.id,
        label: rule.label,
        type: rule.type,
        priority: rule.priority,
        suggestion: rule.suggestion,
        status,
        evidence,
        possiblePoints: weight,
        earnedPoints: earned,
      });
    }

    const totalPossible = breakdown.reduce((sum, r) => sum + r.possiblePoints, 0);
    const totalEarned = breakdown.reduce((sum, r) => sum + r.earnedPoints, 0);
    const totalScore = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0;

    // Determine band
    let band = "early";
    if (totalScore >= this.config.thresholds.strong) band = "strong";
    else if (totalScore >= this.config.thresholds.developing) band = "developing";

    // Detect mandatory gaps (mandatory rules that were not fully matched)
    const mandatoryGaps = breakdown
      .filter((r) => r.priority === "mandatory" && r.status !== "matched")
      .map((r) => r.label);

    return {
      score: totalScore,
      band,
      rulesVersion: this.config.version,
      rulesHash: this.getConfigHash(),
      mandatoryGaps,
      breakdown,
      disclaimer: "Application-generated ATS readiness and alignment estimate; not an employer ATS score or hiring guarantee.",
    };
  }
}
