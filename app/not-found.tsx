import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md px-4">
        <div className="text-8xl font-bold text-primary/20">404</div>
        <h1 className="text-3xl font-bold text-foreground">Page Not Found</h1>
        <p className="text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button render={<Link href="/" />} nativeButton={false} variant="default">
            Back to Home
          </Button>
          <Button render={<Link href="/lobby" />} nativeButton={false} variant="outline">
            Create Lobby
          </Button>
        </div>
      </div>
    </div>
  );
}
