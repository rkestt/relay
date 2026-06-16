"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DownloadIcon } from "@/components/icons";

export function ExportData() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/user/export");

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `r6hub-data-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert("Errore durante l'esportazione dei dati");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Esporta i tuoi dati</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Scarica una copia di tutti i tuoi dati personali in formato JSON.
        </p>
        <Button onClick={handleExport} disabled={loading} variant="outline">
          <DownloadIcon className="mr-2 h-4 w-4" />
          {loading ? "Esportazione..." : "Esporta dati"}
        </Button>
      </CardContent>
    </Card>
  );
}
