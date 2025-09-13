import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BatchInfo {
  id: string;
  name: string;
  type: 'Fresh' | 'QCed';
  uploadDate: string;
  uploadedBy: string;
  jobCount: number;
}

interface CSVImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (file: File, batchInfo: BatchInfo) => void;
  nextBatchId: string;
}

export function CSVImportModal({ open, onOpenChange, onImport, nextBatchId }: CSVImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [batchType, setBatchType] = useState<'Fresh' | 'QCed'>('Fresh');
  const [batchName, setBatchName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setErrors(['Please select a CSV file']);
      return;
    }

    setFile(selectedFile);
    setErrors([]);
    setValidationStatus('validating');

    // Simulate CSV validation
    try {
      const content = await selectedFile.text();
      const lines = content.split('\n');
      const headers = lines[0]?.toLowerCase().split(',').map(h => h.trim());
      
      const requiredFreshColumns = ['job_id', 'ref_id', 'client_file_name'];
      const requiredQCColumns = ['job_id', 'client_file', 'data_status', 'making_date', 'qc_name', 'qc_date', 'qc_status', 'action'];
      
      const validationErrors: string[] = [];
      
      if (batchType === 'Fresh') {
        const missingColumns = requiredFreshColumns.filter(col => 
          !headers.some(h => h.includes(col.replace('_', '')) || h.includes(col))
        );
        if (missingColumns.length > 0) {
          validationErrors.push(`Missing required columns for Fresh Data: ${missingColumns.join(', ')}`);
        }
      } else {
        const missingColumns = requiredQCColumns.filter(col => 
          !headers.some(h => h.includes(col.replace('_', '')) || h.includes(col))
        );
        if (missingColumns.length > 0) {
          validationErrors.push(`Missing required columns for QC'ed Data: ${missingColumns.join(', ')}`);
        }
      }

      // Check for duplicate job IDs
      const jobIds = new Set();
      const duplicates: string[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const jobId = line.split(',')[0]?.trim();
        if (jobId) {
          if (jobIds.has(jobId)) {
            duplicates.push(`Row ${i + 1}: ${jobId}`);
          }
          jobIds.add(jobId);
        }
      }
      
      if (duplicates.length > 0) {
        validationErrors.push(`Duplicate Job IDs found: ${duplicates.slice(0, 5).join(', ')}${duplicates.length > 5 ? ` and ${duplicates.length - 5} more...` : ''}`);
      }

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setValidationStatus('invalid');
      } else {
        setValidationStatus('valid');
      }
    } catch (error) {
      setErrors(['Failed to parse CSV file']);
      setValidationStatus('invalid');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleImport = () => {
    if (!file) return;

    const finalBatchName = batchName.trim() || `Batch-${nextBatchId}`;
    const batchInfo: BatchInfo = {
      id: nextBatchId,
      name: finalBatchName,
      type: batchType,
      uploadDate: new Date().toISOString(),
      uploadedBy: 'Current User', // In real app, get from auth
      jobCount: 0 // Will be calculated after parsing
    };

    onImport(file, batchInfo);
    
    // Reset form
    setFile(null);
    setBatchName('');
    setBatchType('Fresh');
    setErrors([]);
    setValidationStatus('idle');
  };

  const resetForm = () => {
    setFile(null);
    setBatchName('');
    setBatchType('Fresh');
    setErrors([]);
    setValidationStatus('idle');
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Import CSV Data</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Data Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Data Type</Label>
            <RadioGroup value={batchType} onValueChange={(value) => setBatchType(value as 'Fresh' | 'QCed')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Fresh" id="fresh" />
                <Label htmlFor="fresh" className="text-sm">Fresh Data (New annotations)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="QCed" id="qced" />
                <Label htmlFor="qced" className="text-sm">QC'ed Data (Quality checked)</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Batch Name */}
          <div className="space-y-2">
            <Label htmlFor="batchName" className="text-sm font-medium">
              Batch Name (Optional)
            </Label>
            <Input
              id="batchName"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              placeholder={`Auto-generated: Batch-${nextBatchId}`}
              className="w-full"
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">CSV File</Label>
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                dragActive ? "border-primary bg-primary/5" : "border-border",
                file && validationStatus === 'valid' ? "border-success bg-success/5" : "",
                file && validationStatus === 'invalid' ? "border-destructive bg-destructive/5" : ""
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <div className="flex flex-col items-center space-y-3">
                  {validationStatus === 'valid' ? (
                    <CheckCircle className="h-12 w-12 text-success" />
                  ) : (
                    <Upload className="h-12 w-12 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {file ? file.name : "Drag & drop CSV file here, or click to browse"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {batchType === 'Fresh' 
                        ? "Required columns: job_id, ref_id, client_file_name"
                        : "Required columns: job_id, client_file, data_status, making_date, qc_name, qc_date, qc_status, action"
                      }
                    </p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Validation Status */}
          {validationStatus === 'validating' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Validating CSV structure...</AlertDescription>
            </Alert>
          )}

          {validationStatus === 'valid' && (
            <Alert className="border-success bg-success/10">
              <CheckCircle className="h-4 w-4 text-success" />
              <AlertDescription className="text-success">CSV validation successful! Ready to import.</AlertDescription>
            </Alert>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {errors.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport}
            disabled={!file || validationStatus !== 'valid'}
            className="gap-2"
          >
            <Upload size={16} />
            Import Batch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}