// Base Abstract Rule Class
export class Rule {
  constructor(def) {
    this.id = def.id;
    this.label = def.label;
    this.type = def.type;
    this.weight = Number(def.weight) || 5;
    this.suggestion = def.suggestion || "";
    this.priority = def.priority || "preferred";
    this.always = Boolean(def.always);
    this.source = def.source || "";
  }

  evaluate(text) {
    throw new Error(`evaluate() must be implemented in subclass ${this.constructor.name}`);
  }

  contains(text, term) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?<!\\w)${escaped}(?!\\w)`, "i");
    return regex.test(text);
  }

  getSentences(text) {
    return text
      .split(/\n|(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  extractYears(text) {
    const matches = [...text.matchAll(/\b(\d{1,2})(?:\+)?\s*(?:years?|yrs?)\b/gi)];
    if (!matches.length) return null;
    return Math.max(...matches.map((m) => parseInt(m[1], 10)));
  }
}

// 1. TermRule: Keyword match with negation and qualification detection
export class TermRule extends Rule {
  constructor(def) {
    super(def);
    this.terms = def.terms || [];
  }

  evaluate(text) {
    const sentences = this.getSentences(text);
    const hits = sentences.filter((s) => this.terms.some((term) => this.contains(s, term)));

    if (!hits.length) {
      return { status: "missing", evidence: "" };
    }

    // Negation check (e.g., "no experience with Docker", "without Python")
    const negationRegex = /\b(no|not|never|without|lack|lacks|lacking)\b/i;
    const positive = hits.filter((s) => !negationRegex.test(s));

    if (!positive.length) {
      return { status: "uncertain", evidence: hits.join(" / ").slice(0, 1000) };
    }

    // Qualification check (e.g., "limited exposure", "basic knowledge", "beginner")
    const qualifiedRegex = /\b(limited|exposure|beginner|learning|basic|introductory)\b/i;
    const full = positive.filter((s) => !qualifiedRegex.test(s));

    if (full.length > 0) {
      return { status: "matched", evidence: full.join(" / ").slice(0, 1000) };
    } else {
      return { status: "partial", evidence: positive.join(" / ").slice(0, 1000) };
    }
  }
}

// 2. YearsRule: Numeric years extraction and minimum checking
export class YearsRule extends Rule {
  constructor(def) {
    super(def);
    this.minimum = Number(def.minimum) || 0;
  }

  evaluate(text) {
    const value = this.extractYears(text);
    if (value === null) {
      return {
        status: "uncertain",
        evidence: "No explicit years statement found; dates are not inferred.",
      };
    }

    if (value >= this.minimum) {
      return {
        status: "matched",
        evidence: `${value} years explicitly stated (meets minimum of ${this.minimum}).`,
      };
    } else {
      return {
        status: "partial",
        evidence: `${value} years explicitly stated; relevance needs human review.`,
      };
    }
  }
}

// 3. SectionsRule: Structural resume completeness
export class SectionsRule extends Rule {
  constructor(def) {
    super(def);
    this.terms = def.terms || [];
  }

  evaluate(text) {
    const found = this.terms.filter((term) => this.contains(text, term));
    if (found.length === this.terms.length) {
      return { status: "matched", evidence: found.join(", ") };
    }
    if (found.length > 0) {
      return { status: "partial", evidence: found.join(", ") };
    }
    return { status: "missing", evidence: "" };
  }
}

// 4. PatternRule: Custom regex matching
export class PatternRule extends Rule {
  constructor(def) {
    super(def);
    this.pattern = def.pattern || "";
  }

  evaluate(text) {
    try {
      const regex = new RegExp(this.pattern, "i");
      const match = text.match(regex);
      return match ? { status: "matched", evidence: match[0] } : { status: "missing", evidence: "" };
    } catch {
      return { status: "missing", evidence: "" };
    }
  }
}
