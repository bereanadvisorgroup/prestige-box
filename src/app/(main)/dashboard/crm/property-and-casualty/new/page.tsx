import { PropertyAndCasualtyForm } from "../_components/property-and-casualty-form";

export default function NewPropertyAndCasualtyPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Add Property And Casualty Firm</h1>
      </div>
      <PropertyAndCasualtyForm />
    </div>
  );
}
