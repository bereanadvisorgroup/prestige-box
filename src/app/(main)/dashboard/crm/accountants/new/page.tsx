import { AccountantForm } from "../_components/accountant-form";

export default function NewAccountantPage() {
  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto py-8 px-4 md:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Accountant</h1>
        <p className="text-muted-foreground mt-2">Create a new accounting professional record.</p>
      </div>

      <AccountantForm />
    </div>
  );
}
