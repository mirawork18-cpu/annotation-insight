import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Download, Upload, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Job {
  jid: string;
  refId: string;
  clientFileName: string;
  dataStatus: string;
  makingDate: string;
  qcName: string;
  qcDate: string;
  qcStatus: string;
  rejectReason?: string;
  reworkDate?: string;
  comment?: string;
}

interface JobTableProps {
  jobs: Job[];
  onJobUpdate?: (job: Job) => void;
  onImportCSV?: (file: File) => void;
  onExportCSV?: () => void;
}

const ITEMS_PER_PAGE = 20;

const statusColors = {
  "Accepted": "success",
  "Rejected": "destructive", 
  "Output Not Found": "warning",
  "Done": "secondary",
  "Pending": "muted",
} as const;

export function JobTable({ jobs, onJobUpdate, onImportCSV, onExportCSV }: JobTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [qcNameFilter, setQcNameFilter] = useState<string>("all");

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = searchTerm === "" || 
        job.jid.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.clientFileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.qcName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || job.qcStatus === statusFilter;
      const matchesQCName = qcNameFilter === "all" || job.qcName === qcNameFilter;
      
      return matchesSearch && matchesStatus && matchesQCName;
    });
  }, [jobs, searchTerm, statusFilter, qcNameFilter]);

  const totalPages = Math.ceil(filteredJobs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedJobs = filteredJobs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const uniqueStatuses = [...new Set(jobs.map(job => job.qcStatus))];
  const uniqueQCNames = [...new Set(jobs.map(job => job.qcName))];

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImportCSV) {
      onImportCSV(file);
    }
  };

  const handleStatusUpdate = (jobId: string, newStatus: string) => {
    const job = jobs.find(j => j.jid === jobId);
    if (job && onJobUpdate) {
      onJobUpdate({ ...job, qcStatus: newStatus });
    }
  };

  return (
    <Card className="p-6 bg-gradient-card shadow-medium">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Job Management</h2>
          <div className="flex items-center gap-3">
            <Button 
              onClick={onExportCSV}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Download size={16} />
              Export CSV
            </Button>
            <div className="relative">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileImport}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Button variant="secondary" size="sm" className="gap-2">
                <Upload size={16} />
                Import CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="QC Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {uniqueStatuses.map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={qcNameFilter} onValueChange={setQcNameFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="QC Name" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All QC</SelectItem>
              {uniqueQCNames.map(name => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold">Job ID</th>
                <th className="text-left py-3 px-4 font-semibold">Client File</th>
                <th className="text-left py-3 px-4 font-semibold">Data Status</th>
                <th className="text-left py-3 px-4 font-semibold">Making Date</th>
                <th className="text-left py-3 px-4 font-semibold">QC Name</th>
                <th className="text-left py-3 px-4 font-semibold">QC Date</th>
                <th className="text-left py-3 px-4 font-semibold">QC Status</th>
                <th className="text-left py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedJobs.map((job, index) => (
                <tr key={job.jid} className={cn(
                  "border-b border-border/50 hover:bg-muted/30 transition-colors",
                  index % 2 === 0 ? "bg-background/50" : "bg-muted/10"
                )}>
                  <td className="py-3 px-4 font-mono text-sm">{job.jid}</td>
                  <td className="py-3 px-4 max-w-[200px] truncate">{job.clientFileName}</td>
                  <td className="py-3 px-4">{job.dataStatus}</td>
                  <td className="py-3 px-4">{job.makingDate}</td>
                  <td className="py-3 px-4">{job.qcName}</td>
                  <td className="py-3 px-4">{job.qcDate}</td>
                  <td className="py-3 px-4">
                    <Badge variant={statusColors[job.qcStatus as keyof typeof statusColors] || "secondary"}>
                      {job.qcStatus}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Select
                      value={job.qcStatus}
                      onValueChange={(value) => handleStatusUpdate(job.jid, value)}
                    >
                      <SelectTrigger className="w-[120px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Accepted">Accepted</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                        <SelectItem value="Output Not Found">ONF</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredJobs.length)} of {filteredJobs.length} jobs
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
              Previous
            </Button>
            
            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                );
              })}
              {totalPages > 5 && <span className="px-2">...</span>}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}