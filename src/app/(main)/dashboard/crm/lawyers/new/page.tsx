import { LawyerForm } from "../_components/lawyer-form";

export default function NewLawyerPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Add Lawyer</h1>
        <p className="mt-2 text-muted-foreground">Create a new legal professional record.</p>
      </div>

      <LawyerForm />
    </div>
  );
}
