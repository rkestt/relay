import { DeleteAccount } from "@/components/settings/DeleteAccount";
import { ExportData } from "@/components/settings/ExportData";

export default function AccountSettingsPage() {
  return (
    <div className="container max-w-2xl py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-8">Impostazioni Account</h1>
      <ExportData />
      <DeleteAccount />
    </div>
  );
}
