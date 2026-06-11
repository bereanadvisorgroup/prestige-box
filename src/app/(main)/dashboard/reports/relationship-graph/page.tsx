import { AlertCircle } from "lucide-react";

import { getRelationshipGraphData } from "@/actions/relationship-graph";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { GraphView } from "./_components/graph-view";

export const metadata = {
  title: "Relationship Graph | Prestige Box",
};

export default async function RelationshipGraphPage() {
  const { success, nodes, links, error } = await getRelationshipGraphData();

  if (!success) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-8 md:px-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Relationship Graph</h1>
          <p className="mt-2 text-muted-foreground">Visualize the connections between entities across the system.</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || "Failed to load graph data from the server. Check server logs for details."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-4 py-8 md:px-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Relationship Graph</h1>
        <p className="mt-2 text-muted-foreground">
          Explore connections between people, households, clients, vendors, and professional services.
        </p>
      </div>

      <GraphView nodes={nodes || []} links={links || []} />
    </div>
  );
}
