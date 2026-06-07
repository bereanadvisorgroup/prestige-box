import { AccountantForm } from "../_components/accountant-form";

export default function NewAccountantPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Add Accountant</h1>
        <p className="mt-2 text-muted-foreground">Create a new accounting professional record.</p>
      </div>

      <AccountantForm />
    </div>
  );
}
