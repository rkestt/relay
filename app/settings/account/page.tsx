import dynamic from "next/dynamic";
import Link from "next/link";
import { BackArrowIcon } from "@/components/icons";

const ProfileForm = dynamic(() => import("@/components/settings/ProfileForm").then(mod => mod.ProfileForm), {
  loading: () => (
    <div className="rounded-lg border border-border bg-card p-6 space-y-4 animate-pulse">
      <div className="h-5 w-32 rounded bg-muted" />
      <div className="h-10 w-64 rounded-lg bg-muted" />
      <div className="h-10 w-40 rounded-lg bg-muted" />
    </div>
  ),
});

const ExportData = dynamic(() => import("@/components/settings/ExportData").then(mod => mod.ExportData), {
  loading: () => (
    <div className="rounded-lg border border-border bg-card p-6 space-y-4 animate-pulse">
      <div className="h-5 w-40 rounded bg-muted" />
      <div className="h-3 w-64 rounded bg-muted/60" />
      <div className="h-10 w-36 rounded-lg bg-muted" />
    </div>
  ),
});

const DeleteAccount = dynamic(() => import("@/components/settings/DeleteAccount").then(mod => mod.DeleteAccount), {
  loading: () => (
    <div className="rounded-lg border border-destructive/20 bg-card p-6 space-y-4 animate-pulse">
      <div className="h-5 w-32 rounded bg-muted" />
      <div className="h-10 w-44 rounded-lg bg-muted" />
    </div>
  ),
});

export default function AccountSettingsPage() {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <Link
        href="/"
        className="group inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <BackArrowIcon className="size-4 transition-transform group-hover:-translate-x-0.5" />
        Back to home
      </Link>

      <h1 className="text-h1 font-bold tracking-tight text-foreground">
        Account Settings
      </h1>

      <ProfileForm />
      <ExportData />
      <DeleteAccount />
    </div>
  );
}
