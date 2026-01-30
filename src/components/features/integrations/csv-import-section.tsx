"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Upload, CheckCircle2, Download } from "lucide-react";
import { CsvImportDialog } from "@/components/features/recipients/csv-import-dialog";

export function CsvImportSection() {
  const [importOpen, setImportOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2.5">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-base">CSV Import</CardTitle>
              <CardDescription>
                Upload a CSV file to bulk-import recipients into Juniply
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <span className="text-muted-foreground">
                  Auto-detects column headers (email, name, company, etc.)
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <span className="text-muted-foreground">
                  Validates data and skips duplicates
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <span className="text-muted-foreground">
                  Supports up to 1,000 recipients per import
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={() => setImportOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload CSV
              </Button>
              <a
                href="/templates/recipients-template.csv"
                download
                className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
              >
                <Download className="h-3.5 w-3.5" />
                Download template
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      <CsvImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </>
  );
}
