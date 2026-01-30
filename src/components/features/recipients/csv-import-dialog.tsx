"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { parseCSV, generateCSVTemplate } from "@/lib/csv-parser";
import { csvRecipientSchema } from "@/lib/validations";
import { bulkCreateRecipients, type BulkCreateResult } from "@/actions/recipients";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Loader2,
  ArrowLeft,
} from "lucide-react";

type Step = "upload" | "preview" | "results";

interface ValidatedRow {
  row: number;
  data: Record<string, string>;
  valid: boolean;
  error?: string;
  duplicate?: boolean;
}

interface CsvImportDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CsvImportDialog({ open: controlledOpen, onOpenChange: controlledOnOpenChange }: CsvImportDialogProps = {}) {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;

  const [step, setStep] = useState<Step>("upload");
  const [rows, setRows] = useState<ValidatedRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<BulkCreateResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const reset = useCallback(() => {
    setStep("upload");
    setRows([]);
    setParseError(null);
    setImporting(false);
    setResults(null);
    setDragOver(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      reset();
    }
  };

  const processFile = (file: File) => {
    setParseError(null);

    if (!file.name.endsWith(".csv")) {
      setParseError("Please upload a .csv file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setParseError("File must be under 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);

      if (parsed.error) {
        setParseError(parsed.error);
        return;
      }

      if (parsed.rows.length === 0) {
        setParseError("No data rows found in CSV");
        return;
      }

      // Validate each row and detect in-file duplicates
      const seenEmails = new Set<string>();
      const validated: ValidatedRow[] = parsed.rows.map((row, index) => {
        const result = csvRecipientSchema.safeParse(row);

        if (!result.success) {
          const firstError = result.error.errors[0];
          return {
            row: index + 2, // +2 for header row and 1-indexed
            data: row,
            valid: false,
            error: `${firstError.path.join(".")}: ${firstError.message}`,
          };
        }

        const email = row.email?.toLowerCase();
        if (seenEmails.has(email)) {
          return {
            row: index + 2,
            data: row,
            valid: false,
            duplicate: true,
            error: "Duplicate email in file",
          };
        }
        seenEmails.add(email);

        return {
          row: index + 2,
          data: row,
          valid: true,
        };
      });

      setRows(validated);
      setStep("preview");
    };

    reader.onerror = () => {
      setParseError("Failed to read file");
    };

    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleImport = async () => {
    const validRows = rows.filter((r) => r.valid);
    if (validRows.length === 0) return;

    setImporting(true);
    try {
      const result = await bulkCreateRecipients(
        validRows.map((r) => r.data as any)
      );
      setResults(result);
      setStep("results");
    } catch {
      toast({
        variant: "destructive",
        title: "Import failed",
        description: "Something went wrong during import. Please try again.",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleDone = () => {
    setOpen(false);
    reset();
    router.refresh();
  };

  const downloadTemplate = () => {
    const csv = generateCSVTemplate();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recipients-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = rows.filter((r) => r.valid).length;
  const errorCount = rows.filter((r) => !r.valid && !r.duplicate).length;
  const duplicateCount = rows.filter((r) => r.duplicate).length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className={step === "preview" ? "max-w-3xl" : "max-w-lg"}>
        {step === "upload" && (
          <>
            <DialogHeader>
              <DialogTitle>Import Recipients from CSV</DialogTitle>
              <DialogDescription>
                Upload a CSV file with recipient data. Required column: email.
              </DialogDescription>
            </DialogHeader>

            <div
              className={`mt-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <FileSpreadsheet className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">
                Drop your CSV file here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Max 5MB, up to 1,000 rows
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {parseError && (
              <div className="flex items-center gap-2 text-sm text-destructive mt-2">
                <XCircle className="h-4 w-4 shrink-0" />
                {parseError}
              </div>
            )}

            <DialogFooter className="mt-4">
              <Button variant="ghost" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "preview" && (
          <>
            <DialogHeader>
              <DialogTitle>Preview Import</DialogTitle>
              <DialogDescription>
                Review the parsed data before importing.
              </DialogDescription>
            </DialogHeader>

            {/* Summary bar */}
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>{validCount} valid</span>
              </div>
              {errorCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span>{errorCount} errors</span>
                </div>
              )}
              {duplicateCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span>{duplicateCount} duplicates</span>
                </div>
              )}
            </div>

            {/* Preview table */}
            <ScrollArea className="max-h-[400px] rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Row</th>
                    <th className="px-3 py-2 text-left font-medium">Email</th>
                    <th className="px-3 py-2 text-left font-medium">Name</th>
                    <th className="px-3 py-2 text-left font-medium">Company</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.row}
                      className={
                        !row.valid
                          ? "bg-destructive/5"
                          : "hover:bg-muted/30"
                      }
                    >
                      <td className="px-3 py-2 text-muted-foreground">
                        {row.row}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {row.data.email || "-"}
                      </td>
                      <td className="px-3 py-2">
                        {[row.data.firstName, row.data.lastName]
                          .filter(Boolean)
                          .join(" ") || "-"}
                      </td>
                      <td className="px-3 py-2">
                        {row.data.company || "-"}
                      </td>
                      <td className="px-3 py-2">
                        {row.valid ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-destructive">
                            <XCircle className="h-3.5 w-3.5 shrink-0" />
                            {row.error}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>

            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => { reset(); setStep("upload"); }}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={validCount === 0 || importing}
              >
                {importing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Import {validCount} Recipient{validCount !== 1 ? "s" : ""}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "results" && results && (
          <>
            <DialogHeader>
              <DialogTitle>Import Complete</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-3 gap-4 py-4">
              <div className="flex flex-col items-center p-4 rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
                <span className="text-2xl font-bold">{results.imported}</span>
                <span className="text-xs text-muted-foreground">Imported</span>
              </div>
              <div className="flex flex-col items-center p-4 rounded-lg bg-amber-500/10">
                <AlertTriangle className="h-8 w-8 text-amber-500 mb-2" />
                <span className="text-2xl font-bold">{results.skipped}</span>
                <span className="text-xs text-muted-foreground">Skipped</span>
              </div>
              <div className="flex flex-col items-center p-4 rounded-lg bg-destructive/10">
                <XCircle className="h-8 w-8 text-destructive mb-2" />
                <span className="text-2xl font-bold">{results.failed}</span>
                <span className="text-xs text-muted-foreground">Failed</span>
              </div>
            </div>

            {results.skipped > 0 && (
              <p className="text-sm text-muted-foreground">
                Skipped recipients already exist in your organization.
              </p>
            )}

            {results.errors.length > 0 && (
              <div className="text-sm space-y-1">
                <p className="font-medium text-destructive">Errors:</p>
                {results.errors.map((err, i) => (
                  <p key={i} className="text-muted-foreground">
                    {err.email ? `${err.email}: ` : ""}{err.error}
                  </p>
                ))}
              </div>
            )}

            <DialogFooter>
              <Button onClick={handleDone}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
