import { InsuranceAgencyForm } from "../_components/insurance-agency-form";

export const dynamic = "force-dynamic";

export default function NewInsuranceAgencyPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 md:px-6">
      <InsuranceAgencyForm />
    </div>
  );
}
