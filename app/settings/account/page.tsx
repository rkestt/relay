import dynamic from "next/dynamic";

const ExportData = dynamic(() => import("@/components/settings/ExportData").then(mod => mod.ExportData), {
  loading: () => (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4 animate-pulse">
      <div className="h-5 w-40 rounded bg-muted" />
      <div className="h-3 w-64 rounded bg-muted/60" />
      <div className="h-10 w-36 rounded-lg bg-muted" />
    </div>
  ),
});

const DeleteAccount = dynamic(() => import("@/components/settings/DeleteAccount").then(mod => mod.DeleteAccount), {
  loading: () => (
    <div className="rounded-xl border border-red-200 bg-card p-6 space-y-4 animate-pulse">
      <div className="h-5 w-32 rounded bg-muted" />
      <div className="h-10 w-44 rounded-lg bg-muted" />
    </div>
  ),
});

export default function AccountSettingsPage() {
  return (
    <div className="container max-w-2xl py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-8">Impostazioni Account</h1>
      <ExportData />
      <DeleteAccount />
    </div>
  );
}
