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

  /**
   * Detects if the target employer is a top-tier tech company with stringent recruitment bars.
   */
  isTier1Company(targetCompany = "") {
    return /\b(?:google|alphabet|meta|facebook|amazon|aws|microsoft|apple|netflix|openai|anthropic|stripe|uber|nvidia|bytedance|airbnb)\b/i.test(
      String(targetCompany || "")
    );
  }

  /**
   * Identifies the core technical domain from the target role string.
   */
  detectRoleDomain(targetRole = "") {
    const role = String(targetRole || "").toLowerCase();
    if (/\b(?:devops|sre|site\s+reliability|cloud\s+engineer|infrastructure|platform\s+engineer)\b/i.test(role)) {
      return "devops";
    }
    if (/\b(?:ai|ml|aiml|machine\s+learning|deep\s+learning|data\s+scientist|data\s+science|nlp|computer\s+vision|artificial\s+intelligence)\b/i.test(role)) {
      return "aiml";
    }
    if (/\b(?:backend|node|node\.js|java|python\s+backend|api\s+developer|go|golang|django|spring)\b/i.test(role)) {
      return "backend";
    }
    if (/\b(?:frontend|react|angular|vue|web\s+developer|ui\s+engineer|javascript\s+developer)\b/i.test(role)) {
      return "frontend";
    }
    return "general";
  }

  /**
   * Extracts requirements by analyzing the Job Description.
   * STRICT JD-FIRST POLICY: Only skills, tools, and competencies explicitly mentioned
   * or required in the provided Job Description are extracted and evaluated as gaps.
   */
  extractRequirements(jdText = "", targetRole = "", targetCompany = "") {
    const rawJd = String(jdText || "").trim();
    if (!rawJd) return [];

    const sentences = rawJd
      .split(/\n|(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const roleDomain = this.detectRoleDomain(targetRole);
    const addedRuleIds = new Set();
    const output = [];

    // Domain prefix map to recognize core alignment
    const domainPrefixMap = {
      devops: "devops-",
      aiml: "aiml-",
      backend: "backend-",
      frontend: "frontend-",
    };
    const currentDomainPrefix = domainPrefixMap[roleDomain] || "";

    // Scan all catalog rules against the provided Job Description
    for (const rule of this.catalogRules) {
      if (rule.always || addedRuleIds.has(rule.id)) continue;

      let relevant = [];
      if (rule.type === "years") {
        relevant = sentences.filter((s) => rule.extractYears(s) !== null);
      } else if (rule.terms && rule.terms.length) {
        // Must match at least one term in the Job Description text
        relevant = sentences.filter((s) => rule.terms.some((t) => rule.contains(s, t)));
      }

      // STRICT: If NOT mentioned anywhere in the Job Description, DO NOT extract it!
      if (!relevant.length) continue;

      const sourceText = relevant.join("\n").slice(0, 2000);

      // Check if the specific sentence containing the term explicitly marks it as optional/preferred
      const isPreferred = /\b(plus|nice\s+to\s+have|preferred|optional|bonus|added\s+advantage|good\s+to\s+have)\b/i.test(
        sourceText
      );
      const isExplicitMandatory = /\b(required|must|mandatory|minimum|essential|proven|strong|solid|hands-on|proficien|deep\s+understanding|expected|qualifications?|responsibilit)\b/i.test(
        rawJd
      );

      // Core domain skills mentioned in the JD default to mandatory unless explicitly marked as optional/plus
      const isDomainAligned = currentDomainPrefix && rule.id.startsWith(currentDomainPrefix);
      const isMandatory = !isPreferred && (isExplicitMandatory || isDomainAligned);

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
      addedRuleIds.add(rule.id);
    }

    return output;
  }

  hydrateRequirement(req) {
    if (req && typeof req.evaluate === "function") return req;
    const catalogMatch = this.catalogRules.find((c) => c.id === req.id);
    if (catalogMatch) {
      return RuleFactory.createRule({
        ...catalogMatch,
        ...req,
        terms: req.terms && req.terms.length ? req.terms : catalogMatch.terms,
        weight: req.weight || catalogMatch.weight,
        priority: req.priority || catalogMatch.priority,
      });
    }
    return RuleFactory.createRule(req);
  }

  /**
   * Rigorous, Honest ATS Scoring Engine:
   * - Evaluates depth of evidence (hands-on execution vs surface keyword list).
   * - Strictly gates/caps score if mandatory domain pillars are missing or weak.
   * - Calibrates against top-tier tech employers (Google, Meta, Amazon, etc.).
   */
  calculateScore(resumeText, confirmedRequirements = [], targetRole = "", targetCompany = "", verifiedEvidence = []) {
    const alwaysRules = this.catalogRules.filter((r) => r.always);
    const hydratedRequirements = (confirmedRequirements || []).map((r) =>
      this.hydrateRequirement(r)
    );
    const activeRules = [...hydratedRequirements, ...alwaysRules];

    // Build verified evidence lookup from candidate Q&A interview responses
    const verifiedMap = new Map();
    (verifiedEvidence || []).forEach((item) => {
      const reqText = (item.requirement_text || item.requirementText || "").toLowerCase().trim();
      const response = (item.candidate_response || item.candidateResponse || "").toLowerCase().trim();
      if (response === "yes" || response === "limited") {
        let ctx = item.context_data || item.contextData || {};
        if (typeof ctx === "string") {
          try {
            ctx = JSON.parse(ctx);
          } catch {}
        }
        verifiedMap.set(reqText, { response, context: ctx, item });
      }
    });

    const breakdown = [];

    for (const rule of activeRules) {
      let { status, evidence } = rule.evaluate(resumeText);

      // Check if candidate explicitly verified this requirement with authentic evidence
      const ruleLabelLower = (rule.label || "").toLowerCase().trim();
      const ruleIdLower = (rule.id || "").toLowerCase().trim();

      let matchedEvidence = null;
      for (const [key, val] of verifiedMap.entries()) {
        if (
          key === ruleLabelLower ||
          key === ruleIdLower ||
          (rule.terms && rule.terms.some((t) => key.includes(t.toLowerCase()) || t.toLowerCase().includes(key))) ||
          ruleLabelLower.includes(key) ||
          key.includes(ruleLabelLower)
        ) {
          matchedEvidence = val;
          break;
        }
      }

      if (matchedEvidence) {
        if (matchedEvidence.response === "yes") {
          status = "matched";
          const whereStr = matchedEvidence.context.where ? ` in ${matchedEvidence.context.where}` : "";
          const taskStr = matchedEvidence.context.whatDone || matchedEvidence.context.task || "hands-on execution";
          const outcomeStr = matchedEvidence.context.measurableOutcomes ? `, achieving ${matchedEvidence.context.measurableOutcomes}` : "";
          evidence = `Verified by Candidate${whereStr}: ${taskStr}${outcomeStr}.`;
        } else if (matchedEvidence.response === "limited" && status === "missing") {
          status = "partial";
          evidence = `Verified Limited Exposure by Candidate: ${matchedEvidence.context.whatDone || "practical exposure"}.`;
        }
      }

      const isMandatory = rule.priority === "mandatory";
      const weight = rule.weight * (isMandatory ? this.config.mandatoryMultiplier : 1);

      let fraction = 0;
      if (status === "matched") fraction = 1.0;
      else if (status === "partial") fraction = this.config.partialCredit; // 0.20 credit for list-only mentions
      else if (status === "uncertain") fraction = 0.10;

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
    let calculatedScore = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0;

    // Strict Gatekeeping: Detect unmet mandatory requirements
    const missingMandatory = breakdown.filter(
      (r) => r.priority === "mandatory" && (r.status === "missing" || r.status === "uncertain")
    );
    const partialMandatory = breakdown.filter(
      (r) => r.priority === "mandatory" && r.status === "partial"
    );

    // Apply strict gatekeeping caps for missing or superficial mandatory pillars
    if (missingMandatory.length >= 4) {
      calculatedScore = Math.min(calculatedScore, 22);
    } else if (missingMandatory.length === 3) {
      calculatedScore = Math.min(calculatedScore, 32);
    } else if (missingMandatory.length === 2) {
      calculatedScore = Math.min(calculatedScore, 44);
    } else if (missingMandatory.length === 1) {
      calculatedScore = Math.min(calculatedScore, 58);
    } else if (partialMandatory.length >= 3) {
      calculatedScore = Math.min(calculatedScore, 52);
    } else if (partialMandatory.length === 2) {
      calculatedScore = Math.min(calculatedScore, 64);
    } else if (partialMandatory.length === 1) {
      calculatedScore = Math.min(calculatedScore, 75);
    }

    // Top-tier employer calibration: If applying to Google, Meta, etc., and lacking commercial production experience
    const isTier1 = this.isTier1Company(targetCompany);
    const missingProdExp = breakdown.find(
      (r) => (r.id === "exp-production" || r.id === "tier1-scale-impact") && r.status === "missing"
    );
    if (isTier1 && missingProdExp) {
      calculatedScore = Math.min(calculatedScore, 42);
    }

    // Determine band
    let band = "early";
    if (calculatedScore >= this.config.thresholds.strong) band = "strong";
    else if (calculatedScore >= this.config.thresholds.developing) band = "developing";

    // Build clear, informative mandatory gaps (both missing and superficial partials)
    const mandatoryGaps = breakdown
      .filter((r) => r.priority === "mandatory" && r.status !== "matched")
      .map((r) => ({
        requirement: r.label,
        status: r.status,
        reason:
          r.status === "missing"
            ? `Required by Job Description: No hands-on project or work history evidence of ${r.label} detected on your resume.`
            : `Mentioned in Job Description: ${r.label} is only listed under skills/tools without substantiated project bullets, execution details, or measurable metrics.`,
        suggestion: r.suggestion,
      }));

    return {
      score: calculatedScore,
      band,
      rulesVersion: this.config.version,
      rulesHash: this.getConfigHash(),
      mandatoryGaps,
      breakdown,
      disclaimer: "Strict ATS alignment assessment calibrated against commercial recruitment filter thresholds.",
    };
  }
}
