import { AccountTypeForm } from "../_components/account-type-form";

export default function NewFinancialAccountTypePage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Add Financial Account Type</h1>
      </div>
      <AccountTypeForm />
    </div>
  );
}
