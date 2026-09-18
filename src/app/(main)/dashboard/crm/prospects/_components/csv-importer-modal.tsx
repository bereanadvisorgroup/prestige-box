"use client";

import * as React from "react";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Sparkles,
  Target,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { batchImportProspects } from "@/actions/prospects";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type {
  Campaign,
  CsvHeaderMapping,
  CsvImportResult,
  DeduplicationStrategy,
  ProspectCustomField,
} from "@/types/prospects";

interface CsvImporterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customFields?: ProspectCustomField[];
  campaigns?: Campaign[];
  initialCampaignId?: string | null;
  onSuccess?: () => void;
}

// Basic CSV parser accounting for quotes and commas
function parseCsv(text: string): { headers: string[]; rows: Record<string, unknown>[] } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  };

  const headers = parseLine(lines[0]);
  const rows: Record<string, unknown>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const rowObj: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      rowObj[header] = values[index] ?? "";
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

// Auto-match heuristic
function autoMatchHeader(header: string, customFields: ProspectCustomField[]): string {
  const h = header.toLowerCase().replace(/[^a-z0-9]/g, "");

  if (["prefix", "salutation", "titleprefix", "honorific", "title_prefix"].includes(h)) return "prefix";
  if (["firstname", "first", "fname"].includes(h)) return "firstName";
  if (["middlename", "middle", "mname", "middleinitial", "mi"].includes(h)) return "middleName";
  if (["lastname", "last", "lname", "surname"].includes(h)) return "lastName";
  if (["suffix", "titlesuffix", "postnominal", "generationsuffix"].includes(h)) return "suffix";
  if (["goesby", "preferredname", "nickname", "knownas", "preferred"].includes(h)) return "goesBy";
  if (["name", "fullname", "contact", "prospect"].includes(h)) return "name";
  if (["email", "emailaddress", "mail"].includes(h)) return "email";
  if (["phone", "phonenumber", "telephone", "mobile", "cell"].includes(h)) return "phone";
  if (["company", "organization", "firm", "business", "companyname"].includes(h)) return "company";
  if (["jobtitle", "title", "position", "role"].includes(h)) return "jobTitle";
  if (["stage", "status", "leadstage"].includes(h)) return "stage";
  if (["source", "leadsource", "channel"].includes(h)) return "source";
  if (["utmsource"].includes(h)) return "utmSource";
  if (["utmmedium"].includes(h)) return "utmMedium";
  if (["utmcampaign", "campaign"].includes(h)) return "utmCampaign";
  if (["utmterm"].includes(h)) return "utmTerm";
  if (["notes", "note", "description", "comments", "memo", "prospectnotes"].includes(h)) return "notes";
  if (["street", "street1", "address", "addressline1", "streetaddress", "addr1", "address1", "streetaddr"].includes(h))
    return "street";
  if (["street2", "address2", "addressline2", "suite", "apt", "unit", "addr2", "ste"].includes(h)) return "street2";
  if (["city", "town", "municipality"].includes(h)) return "city";
  if (["state", "province", "region", "st"].includes(h)) return "state";
  if (["zip", "zipcode", "postalcode", "postal", "postcode", "zip5"].includes(h)) return "zip";

  // Check custom fields
  for (const cf of customFields) {
    const cfClean = cf.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const labelClean = cf.label.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (h === cfClean || h === labelClean) {
      return `customFields.${cf.name}`;
    }
  }

  return "ignore";
}

export function CsvImporterModal({
  open,
  onOpenChange,
  customFields = [],
  campaigns = [],
  initialCampaignId,
  onSuccess,
}: CsvImporterModalProps) {
  const [step, setStep] = React.useState<"upload" | "mapping" | "strategy" | "summary">("upload");
  const [fileName, setFileName] = React.useState<string>("");
  const [csvHeaders, setCsvHeaders] = React.useState<string[]>([]);
  const [csvRows, setCsvRows] = React.useState<Record<string, unknown>[]>([]);
  const [mappings, setMappings] = React.useState<Record<string, string>>({});
  const [strategy, setStrategy] = React.useState<DeduplicationStrategy>("skip");
  const [fallbackCampaignId, setFallbackCampaignId] = React.useState<string>(initialCampaignId || "");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [importResult, setImportResult] = React.useState<CsvImportResult | null>(null);

  // Reset modal state
  React.useEffect(() => {
    if (open) {
      if (initialCampaignId) setFallbackCampaignId(initialCampaignId);
    } else {
      setStep("upload");
      setFileName("");
      setCsvHeaders([]);
      setCsvRows([]);
      setMappings({});
      setStrategy("skip");
      setFallbackCampaignId(initialCampaignId || "");
      setIsProcessing(false);
      setProgress(0);
      setImportResult(null);
    }
  }, [open, initialCampaignId]);

  // Handle file select
  const handleFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a valid .csv file.");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCsv(text);

      if (headers.length === 0 || rows.length === 0) {
        toast.error("The CSV file is empty or formatted incorrectly.");
        return;
      }

      setCsvHeaders(headers);
      setCsvRows(rows);

      // Auto-match headers
      const initialMap: Record<string, string> = {};
      headers.forEach((h) => {
        initialMap[h] = autoMatchHeader(h, customFields);
      });
      setMappings(initialMap);
      setStep("mapping");
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleExecuteImport = async () => {
    setIsProcessing(true);
    setProgress(25);

    try {
      const mappingList: CsvHeaderMapping[] = Object.entries(mappings)
        .filter(([_, target]) => target !== "ignore")
        .map(([csvHeader, targetField]) => ({ csvHeader, targetField }));

      setProgress(60);
      const res = await batchImportProspects(csvRows, mappingList, strategy, fallbackCampaignId || null);

      setProgress(100);
      setImportResult(res);
      setStep("summary");
      toast.success(`Import complete! Processed ${res.processed} rows.`);
      onSuccess?.();
    } catch {
      toast.error("An error occurred during import execution.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Download error log
  const handleDownloadErrorLog = () => {
    if (!importResult?.errors.length) return;

    const headers = ["Row Number", "Error Reason", "Raw Row Content"];
    const csvLines = [
      headers.join(","),
      ...importResult.errors.map((e) =>
        [e.rowNumber, `"${e.error.replace(/"/g, '""')}"`, `"${JSON.stringify(e.data).replace(/"/g, '""')}"`].join(","),
      ),
    ];

    const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `import-errors-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const targetOptions = [
    { value: "ignore", label: "(Ignore Column)" },
    { value: "prefix", label: "Prefix (e.g. Mr., Dr., Ms.)" },
    { value: "firstName", label: "First Name" },
    { value: "middleName", label: "Middle Name" },
    { value: "lastName", label: "Last Name" },
    { value: "suffix", label: "Suffix (e.g. Jr., III, PhD)" },
    { value: "goesBy", label: "Goes By / Preferred Name" },
    { value: "name", label: "Full Name (Auto-split)" },
    { value: "email", label: "Email Address" },
    { value: "phone", label: "Phone Number" },
    { value: "company", label: "Company / Organization" },
    { value: "jobTitle", label: "Job Title / Role" },
    { value: "stage", label: "Pipeline Stage" },
    { value: "source", label: "Lead Source" },
    { value: "utmSource", label: "UTM Source" },
    { value: "utmMedium", label: "UTM Medium" },
    { value: "utmCampaign", label: "UTM Campaign" },
    { value: "utmTerm", label: "UTM Term" },
    { value: "utmContent", label: "UTM Content" },
    { value: "notes", label: "Notes" },
    { value: "street", label: "Street Address" },
    { value: "street2", label: "Street Address 2 (Apt/Suite)" },
    { value: "city", label: "City" },
    { value: "state", label: "State / Province" },
    { value: "zip", label: "ZIP / Postal Code" },
    ...customFields.map((cf) => ({
      value: `customFields.${cf.name}`,
      label: `[Custom] ${cf.label}`,
    })),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileSpreadsheet className="h-4 w-4" />
              </div>
              <DialogTitle>CSV Data Import Engine</DialogTitle>
            </div>
            {/* Step indicator badges */}
            <div className="flex items-center gap-1 text-xs">
              <Badge variant={step === "upload" ? "default" : "secondary"}>1. Upload</Badge>
              <Badge variant={step === "mapping" ? "default" : "secondary"}>2. Map</Badge>
              <Badge variant={step === "strategy" ? "default" : "secondary"}>3. Dedupe</Badge>
              <Badge variant={step === "summary" ? "default" : "secondary"}>4. Results</Badge>
            </div>
          </div>
          <DialogDescription>
            Import prospects in bulk with visual column mapping and automated deduplication.
          </DialogDescription>
        </DialogHeader>

        {/* STEP A: FILE UPLOAD */}
        {step === "upload" && (
          <div className="space-y-4 py-4">
            {/* Associated Campaign Selector */}
            <div className="space-y-1.5 rounded-lg border bg-card p-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="upload-campaign-select" className="font-semibold text-xs">
                  Associated Campaign (Optional)
                </Label>
                {fallbackCampaignId && (
                  <Badge variant="outline" className="gap-1 border-primary/40 text-[10px] text-primary">
                    <Target className="h-3 w-3" />
                    <span>Attributed</span>
                  </Badge>
                )}
              </div>
              <Select
                value={fallbackCampaignId || "none"}
                onValueChange={(v) => setFallbackCampaignId(v === "none" ? "" : v)}
              >
                <SelectTrigger id="upload-campaign-select" className="h-8 text-xs">
                  <SelectValue placeholder="Select campaign to associate with this upload" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No campaign (Direct)</SelectItem>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id!}>
                      {c.name} ({c.channel})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Imported prospects will be associated with this campaign and a Lead Creation attribution recorded.
              </p>
            </div>

            <section
              aria-label="CSV file upload dropzone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-muted-foreground/25 border-dashed bg-muted/20 p-8 text-center transition-colors hover:bg-muted/35"
            >
              <Upload className="mb-2 h-10 w-10 text-muted-foreground/60" />
              <h4 className="font-semibold text-foreground text-sm">Drag and drop your CSV file here</h4>
              <p className="mt-1 mb-4 text-muted-foreground text-xs">
                Support for standard UTF-8 encoded comma-separated files.
              </p>
              <label htmlFor="csv-upload-input">
                <Button variant="outline" size="sm" asChild className="cursor-pointer">
                  <span>Browse File</span>
                </Button>
                <input
                  id="csv-upload-input"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </label>
            </section>

            <div className="space-y-1 rounded-lg border bg-muted/10 p-3 text-muted-foreground text-xs">
              <p className="font-medium text-foreground">Tips for best results:</p>
              <ul className="list-inside list-disc space-y-0.5">
                <li>PrestigeBox fields: Prefix, First Name, Middle Name, Last Name, Suffix, Goes By.</li>
                <li>Contact & Address: Email, Phone, Company, Job Title, Street, City, State, ZIP, Notes.</li>
                <li>Custom fields configured in PrestigeBox will be auto-detected.</li>
                <li>Deduplication matches existing prospects by Email or Phone.</li>
              </ul>
            </div>
          </div>
        )}

        {/* STEP B: VISUAL FIELD MAPPER */}
        {step === "mapping" && (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span>
                File: <strong className="text-foreground">{fileName}</strong> ({csvRows.length} rows detected)
              </span>
              <span className="flex items-center gap-1 text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Heuristic auto-matching applied</span>
              </span>
            </div>

            {/* Mapping Table */}
            <div className="max-h-64 overflow-y-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 text-xs">
                    <TableHead className="w-1/2">CSV Header</TableHead>
                    <TableHead className="w-1/2">PrestigeBox Target Field</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvHeaders.map((header) => (
                    <TableRow key={header}>
                      <TableCell className="font-mono text-foreground text-xs">
                        {header}
                        <span className="block max-w-[200px] truncate font-normal text-[10px] text-muted-foreground">
                          e.g. "{String(csvRows[0]?.[header] || "")}"
                        </span>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={mappings[header] || "ignore"}
                          onValueChange={(val) => setMappings({ ...mappings, [header]: val })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-56">
                            {targetOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Sample preview table (first 3 rows) */}
            <div className="space-y-1.5">
              <span className="font-medium text-[11px] text-muted-foreground">Sample Preview (First 3 rows):</span>
              <div className="overflow-x-auto rounded-md border bg-muted/10 text-[11px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {csvHeaders.slice(0, 5).map((h) => (
                        <TableHead key={h} className="h-7 px-2 text-[10px]">
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvRows.slice(0, 3).map((r, i) => (
                      <TableRow key={`preview-row-${r.email || r.id || Object.values(r)[0] || i}`}>
                        {csvHeaders.slice(0, 5).map((h) => (
                          <TableCell key={h} className="max-w-[120px] truncate px-2 py-1">
                            {String(r[h] || "")}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* STEP C: DEDUPLICATION STRATEGY */}
        {step === "strategy" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="font-semibold text-sm">Deduplication Strategy</Label>
              <p className="text-muted-foreground text-xs">
                How should PrestigeBox handle records that match an existing prospect by Email or Phone?
              </p>

              <RadioGroup
                value={strategy}
                onValueChange={(v) => setStrategy(v as DeduplicationStrategy)}
                className="gap-3 pt-2"
              >
                <div className="flex cursor-pointer items-start space-x-3 rounded-lg border p-3 hover:bg-muted/20">
                  <RadioGroupItem value="skip" id="r-skip" className="mt-0.5" />
                  <div className="space-y-0.5">
                    <Label htmlFor="r-skip" className="cursor-pointer font-medium text-xs">
                      Skip Existing (Recommended)
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Ignore rows where the email or phone number matches an existing prospect in the database.
                    </p>
                  </div>
                </div>

                <div className="flex cursor-pointer items-start space-x-3 rounded-lg border p-3 hover:bg-muted/20">
                  <RadioGroupItem value="update_empty" id="r-update" className="mt-0.5" />
                  <div className="space-y-0.5">
                    <Label htmlFor="r-update" className="cursor-pointer font-medium text-xs">
                      Update Empty Fields Only
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Retain all existing database information, only populating fields that are currently blank.
                    </p>
                  </div>
                </div>

                <div className="flex cursor-pointer items-start space-x-3 rounded-lg border p-3 hover:bg-muted/20">
                  <RadioGroupItem value="overwrite" id="r-overwrite" className="mt-0.5" />
                  <div className="space-y-0.5">
                    <Label htmlFor="r-overwrite" className="cursor-pointer font-medium text-xs">
                      Overwrite Existing
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Overwrite matching prospects with the incoming data from the CSV file.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Optional Fallback Campaign */}
            <div className="space-y-1.5 border-t pt-2">
              <Label className="font-semibold text-xs">Assign Acquisition Campaign (Optional)</Label>
              <Select
                value={fallbackCampaignId || "none"}
                onValueChange={(v) => setFallbackCampaignId(v === "none" ? "" : v)}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select campaign to attribute" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No default campaign</SelectItem>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id!}>
                      {c.name} ({c.channel})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Attributed as primary campaign for any rows that don't specify a campaign in the CSV.
              </p>
            </div>

            {isProcessing && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between font-medium text-xs">
                  <span>Importing prospects...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </div>
        )}

        {/* STEP D: SUMMARY REPORT */}
        {step === "summary" && importResult && (
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-950/60 dark:bg-emerald-950/20">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                <div>
                  <h4 className="font-semibold text-emerald-900 text-sm dark:text-emerald-300">
                    CSV Import Execution Completed
                  </h4>
                  <p className="text-emerald-700 text-xs dark:text-emerald-400">
                    The CSV data engine has processed all rows and recalculated initial lead scores.
                  </p>
                </div>
              </div>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-2 gap-2.5 text-center sm:grid-cols-4">
              <div className="rounded-lg border bg-card p-3">
                <div className="font-bold text-foreground text-xl">{importResult.totalRows}</div>
                <div className="text-[11px] text-muted-foreground">Total Rows</div>
              </div>
              <div className="rounded-lg border bg-emerald-500/5 p-3">
                <div className="font-bold text-emerald-600 text-xl">{importResult.created}</div>
                <div className="text-[11px] text-muted-foreground">New Leads</div>
              </div>
              <div className="rounded-lg border bg-blue-500/5 p-3">
                <div className="font-bold text-blue-600 text-xl">{importResult.updated}</div>
                <div className="text-[11px] text-muted-foreground">Updated</div>
              </div>
              <div className="rounded-lg border bg-amber-500/5 p-3">
                <div className="font-bold text-amber-600 text-xl">{importResult.skipped}</div>
                <div className="text-[11px] text-muted-foreground">Skipped (Dupes)</div>
              </div>
            </div>

            {/* Errors section */}
            {importResult.errors.length > 0 && (
              <div className="space-y-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-destructive text-xs">
                    <AlertCircle className="h-4 w-4" />
                    <span>{importResult.errors.length} rows encountered errors</span>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={handleDownloadErrorLog}>
                    <Download className="h-3 w-3" />
                    <span>Download Error Log (.csv)</span>
                  </Button>
                </div>
                <div className="max-h-32 space-y-1 overflow-y-auto text-[11px] text-muted-foreground">
                  {importResult.errors.slice(0, 5).map((err) => (
                    <div key={`err-${err.rowNumber}-${err.error.slice(0, 15)}`} className="flex gap-2">
                      <span className="font-mono text-destructive">Row {err.rowNumber}:</span>
                      <span className="truncate">{err.error}</span>
                    </div>
                  ))}
                  {importResult.errors.length > 5 && (
                    <p className="pt-1 text-xs italic">
                      ...and {importResult.errors.length - 5} more. Download full error log above.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === "mapping" && (
            <>
              <Button variant="outline" onClick={() => setStep("upload")}>
                <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                <span>Back</span>
              </Button>
              <Button onClick={() => setStep("strategy")}>
                <span>Next: Deduplication</span>
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </>
          )}

          {step === "strategy" && (
            <>
              <Button variant="outline" onClick={() => setStep("mapping")} disabled={isProcessing}>
                <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                <span>Back</span>
              </Button>
              <Button onClick={handleExecuteImport} disabled={isProcessing}>
                {isProcessing ? "Importing Data..." : "Run Import"}
              </Button>
            </>
          )}

          {step === "summary" && <Button onClick={() => onOpenChange(false)}>Finish & View Prospects</Button>}

          {step === "upload" && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
