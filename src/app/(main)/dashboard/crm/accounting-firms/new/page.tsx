import { AccountingFirmForm } from "../_components/accounting-firm-form";

export default function NewAccountingFirmPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Add Accounting Firm</h1>
        <p className="mt-2 text-muted-foreground">Create a new accounting firm record.</p>
      </div>

      <AccountingFirmForm />
    </div>
  );
}
