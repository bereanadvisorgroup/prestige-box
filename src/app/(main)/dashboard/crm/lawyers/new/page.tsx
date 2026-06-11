import { LawyerForm } from "../_components/lawyer-form";

export default function NewLawyerPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Add Law Firm</h1>
      </div>
      <LawyerForm />
    </div>
  );
}
