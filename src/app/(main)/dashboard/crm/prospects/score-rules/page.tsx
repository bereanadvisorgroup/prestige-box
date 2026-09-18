import { AlertCircle } from "lucide-react";

import { getProspectScoringRules } from "@/actions/prospect-scoring-rules";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { ScoringRulesSection } from "../_components/scoring-rules-section";

export default async function ProspectsScoreRulesPage() {
  const scoringRulesRes = await getProspectScoringRules();

  if (!scoringRulesRes.success) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Score Rules</h1>
          <p className="mt-2 text-muted-foreground">Manage lead scoring rules and point thresholds.</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {scoringRulesRes.error || "Failed to fetch scoring rules from the database."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const scoringRules = scoringRulesRes.rules || [];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
      <ScoringRulesSection rules={scoringRules} />
    </div>
  );
}
