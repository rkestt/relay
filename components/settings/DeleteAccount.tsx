"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DeleteAccount() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (confirmText !== "ELIMINA") return;

    setLoading(true);
    const response = await fetch("/api/user/account", { method: "DELETE" });

    if (response.ok) {
      router.push("/");
      router.refresh();
    } else {
      alert("Errore durante l'eliminazione dell'account");
      setLoading(false);
    }
  };

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="text-red-600">Elimina Account</CardTitle>
      </CardHeader>
      <CardContent>
        {!showConfirm ? (
          <Button variant="destructive" onClick={() => setShowConfirm(true)}>
            Elimina il mio account
          </Button>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Questa azione è irreversibile. Tutti i tuoi dati personali
              verranno eliminati.
            </p>
            <p className="text-sm font-medium">
              Digita &quot;ELIMINA&quot; per confermare:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="ELIMINA"
            />
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={confirmText !== "ELIMINA" || loading}
              >
                {loading ? "Eliminazione..." : "Conferma eliminazione"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
              >
                Annulla
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
