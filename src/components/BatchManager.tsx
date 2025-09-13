import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  User, 
  Database, 
  Eye, 
  Download,
  Search,
  Filter,
  MoreVertical
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BatchInfo } from "./CSVImportModal";

interface BatchManagerProps {
  batches: BatchInfo[];
  selectedBatch?: string;
  onBatchSelect: (batchId: string) => void;
  onBatchView: (batchId: string) => void;
  onBatchExport: (batchId: string) => void;
}

export function BatchManager({ 
  batches, 
  selectedBatch, 
  onBatchSelect, 
  onBatchView,
  onBatchExport 
}: BatchManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<'all' | 'Fresh' | 'QCed'>('all');

  const filteredBatches = batches.filter(batch => {
    const matchesSearch = searchTerm === "" || 
      batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || batch.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const totalJobs = batches.reduce((sum, batch) => sum + batch.jobCount, 0);
  const freshBatches = batches.filter(b => b.type === 'Fresh').length;
  const qcedBatches = batches.filter(b => b.type === 'QCed').length;

  return (
    <Card className="p-6 bg-gradient-card shadow-medium">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Batch Management</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {batches.length} batches • {totalJobs} total jobs
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Database size={12} />
              Fresh: {freshBatches}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Database size={12} />
              QC'ed: {qcedBatches}
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Search batches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-muted-foreground" />
            <div className="flex items-center gap-1">
              {(['all', 'Fresh', 'QCed'] as const).map((type) => (
                <Button
                  key={type}
                  variant={typeFilter === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTypeFilter(type)}
                  className="h-8"
                >
                  {type === 'all' ? 'All' : type}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <Separator />

        {/* Batch List */}
        <div className="space-y-3">
          {filteredBatches.length === 0 ? (
            <div className="text-center py-8">
              <Database className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No batches found</p>
            </div>
          ) : (
            filteredBatches.map((batch) => (
              <div
                key={batch.id}
                className={cn(
                  "p-4 border rounded-lg transition-all cursor-pointer hover:shadow-sm",
                  selectedBatch === batch.id 
                    ? "border-primary bg-primary/5 shadow-sm" 
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => onBatchSelect(batch.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium truncate">{batch.name}</h3>
                      <Badge 
                        variant={batch.type === 'Fresh' ? 'secondary' : 'success'}
                        className="shrink-0"
                      >
                        {batch.type}
                      </Badge>
                      <Badge variant="outline" className="shrink-0 gap-1">
                        <Database size={12} />
                        {batch.jobCount}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(batch.uploadDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <User size={12} />
                        {batch.uploadedBy}
                      </div>
                      <div className="text-xs">
                        ID: {batch.id}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onBatchView(batch.id);
                      }}
                      className="h-8 gap-1"
                    >
                      <Eye size={14} />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onBatchExport(batch.id);
                      }}
                      className="h-8 gap-1"
                    >
                      <Download size={14} />
                      Export
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <MoreVertical size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}