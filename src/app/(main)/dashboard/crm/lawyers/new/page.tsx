import { LawyerForm } from "../_components/lawyer-form";

export default function NewLawyerPage() {
  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto py-8 px-4 md:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Lawyer</h1>
        <p className="text-muted-foreground mt-2">Create a new legal professional record.</p>
      </div>

      <LawyerForm />
    </div>
  );
}
