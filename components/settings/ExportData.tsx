"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DownloadIcon } from "@/components/icons";
import { apiFetch } from "@/lib/fetch";

export function ExportData() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);

    try {
      const response = await apiFetch("/api/user/export");

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Relay-data-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      alert("Error exporting your data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export your data</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Download a copy of all your personal data in JSON format.
        </p>
        <Button onClick={handleExport} disabled={loading} variant="outline">
          <DownloadIcon className="mr-2 h-4 w-4" />
          {loading ? "Exporting..." : "Export data"}
        </Button>
      </CardContent>
    </Card>
  );
}
