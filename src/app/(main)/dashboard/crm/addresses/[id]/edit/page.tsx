import { notFound } from "next/navigation";
import { getAddress } from "@/actions/addresses";
import { AddressForm } from "../../_components/address-form";

interface EditAddressPageProps {
  params: {
    id: string;
  };
}

export default async function EditAddressPage({ params }: EditAddressPageProps) {
  const { id } = await params;
  const result = await getAddress(id);

  if (!result.success || !result.address) {
    notFound();
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 md:px-6">
      <AddressForm address={result.address} />
    </div>
  );
}
