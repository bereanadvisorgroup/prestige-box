import type { Prospect, ProspectScoringRule } from "@/types/prospects";

export interface ScoreCalculationResult {
  score: number;
  temperature: "Cold" | "Warm" | "Hot";
  breakdown: { ruleName: string; points: number }[];
}

/**
 * Evaluates rule-based scoring for a prospect record.
 */
export function calculateProspectScore(
  prospect: Partial<Prospect>,
  rules: ProspectScoringRule[],
): ScoreCalculationResult {
  let score = 0;
  const breakdown: { ruleName: string; points: number }[] = [];

  const activeRules = rules.filter((r) => r.isActive);

  for (const rule of activeRules) {
    let matched = false;

    switch (rule.conditionType) {
      case "job_title_matches": {
        if (prospect.jobTitle && rule.conditionValue) {
          const targets = rule.conditionValue
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean);
          const currentTitle = prospect.jobTitle.toLowerCase();
          matched = targets.some((target) => currentTitle.includes(target));
        }
        break;
      }

      case "field_is_not_empty": {
        if (rule.conditionValue) {
          const fieldKey = rule.conditionValue.trim();
          let value: unknown;

          if (fieldKey.startsWith("customFields.")) {
            const customKey = fieldKey.replace("customFields.", "");
            value = prospect.customFields?.[customKey];
          } else {
            value = (prospect as Record<string, unknown>)[fieldKey];
          }

          if (value !== undefined && value !== null && String(value).trim() !== "") {
            matched = true;
          }
        }
        break;
      }

      case "stage_is": {
        if (prospect.stage && rule.conditionValue) {
          const targetStages = rule.conditionValue
            .split(",")
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean);
          matched = targetStages.includes(prospect.stage.toLowerCase());
        }
        break;
      }

      case "source_is": {
        if (prospect.source && rule.conditionValue) {
          const targetSources = rule.conditionValue
            .split(",")
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean);
          matched = targetSources.includes(prospect.source.toLowerCase());
        }
        break;
      }

      case "inactivity_days": {
        const thresholdDays = Number.parseInt(rule.conditionValue || "30", 10);
        const lastActivityDate = prospect.updatedAt || prospect.createdAt;
        if (lastActivityDate && !Number.isNaN(thresholdDays)) {
          const diffMs = Date.now() - new Date(lastActivityDate).getTime();
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          if (diffDays >= thresholdDays) {
            matched = true;
          }
        }
        break;
      }

      default:
        break;
    }

    if (matched) {
      score += rule.points;
      breakdown.push({
        ruleName: rule.name,
        points: rule.points,
      });
    }
  }

  // Determine temperature
  let temperature: "Cold" | "Warm" | "Hot" = "Cold";
  if (score >= 70) {
    temperature = "Hot";
  } else if (score >= 30) {
    temperature = "Warm";
  }

  return {
    score: Math.max(0, score),
    temperature,
    breakdown,
  };
}
