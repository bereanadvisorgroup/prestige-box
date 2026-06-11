import { MoneyManagerForm } from "../_components/money-manager-form";

export default function NewMoneyManagerPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Add Money Manager</h1>
      </div>
      <MoneyManagerForm />
    </div>
  );
}
