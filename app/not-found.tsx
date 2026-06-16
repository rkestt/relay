import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center space-y-6 max-w-md px-4">
        <div className="text-8xl font-bold text-primary/20">404</div>
        <h1 className="text-3xl font-bold text-white">Pagina Non Trovata</h1>
        <p className="text-slate-400">
          La pagina che stai cercando non esiste o è stata spostata.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button render={<Link href="/" />} variant="default">
            Torna alla Home
          </Button>
          <Button render={<Link href="/lobby" />} variant="outline">
            Crea Lobby
          </Button>
        </div>
      </div>
    </div>
  );
}
