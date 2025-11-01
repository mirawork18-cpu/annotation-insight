import { useState, useEffect } from 'react';
import { MetricsCard } from '@/components/MetricsCard';
import { JobTable, Job } from '@/components/JobTable';
import { AISidebar } from '@/components/AISidebar';
import { CSVImportModal, BatchInfo } from '@/components/CSVImportModal';
import { BatchManager } from '@/components/BatchManager';
import { AnomalyDetection } from '@/components/AnomalyDetection';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { parseCSVToJobs, jobsToCSV, downloadCSV } from '@/utils/csvUtils';
import { generateBatchId, parseCSVToBatch, batchJobsToCSV } from '@/utils/batchUtils';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart3, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  Brain,
  Zap,
  Plus
} from 'lucide-react';

const Index = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [batches, setBatches] = useState<BatchInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('overview');
  const [selectedBatch, setSelectedBatch] = useState<string | undefined>();
  const [showImportModal, setShowImportModal] = useState(false);
  const { toast } = useToast();

  const qcResources = ['Virat', 'Mahi', 'Rohit', 'Dhoni', 'Kohli'];

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const response = await fetch('/src/data/jobs.csv');
        const csvContent = await response.text();
        const parsedJobs = parseCSVToJobs(csvContent);
        
        const defaultBatch: BatchInfo = {
          id: 'Batch-1',
          name: 'Initial Data',
          type: 'QCed',
          uploadDate: new Date().toISOString(),
          uploadedBy: 'System',
          jobCount: parsedJobs.length
        };
        
        const jobsWithBatch = parsedJobs.map(job => ({ ...job, batchId: 'Batch-1' }));
        
        setJobs(jobsWithBatch);
        setBatches([defaultBatch]);
      } catch (error) {
        console.error('Failed to load initial data:', error);
        toast({
          title: "Error",
          description: "Failed to load job data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [toast]);

  const totalJobs = jobs.length;
  const acceptedJobs = jobs.filter(job => job.qcStatus === 'Accepted').length;
  const rejectedJobs = jobs.filter(job => job.qcStatus === 'Rejected').length;
  const onfJobs = jobs.filter(job => job.qcStatus === 'Output Not Found').length;
  const acceptanceRate = totalJobs > 0 ? ((acceptedJobs / totalJobs) * 100).toFixed(1) : '0';
  const rejectionRate = totalJobs > 0 ? ((rejectedJobs / totalJobs) * 100).toFixed(1) : '0';

  const handleJobUpdate = (updatedJob: Job) => {
    setJobs(prev => prev.map(job => 
      job.jid === updatedJob.jid ? updatedJob : job
    ));
    toast({
      title: "Job Updated",
      description: `Job ${updatedJob.jid} status updated to ${updatedJob.qcStatus}`,
    });
  };

  const handleBatchImport = (file: File, batchInfo: BatchInfo) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        const newJobs = parseCSVToBatch(content, batchInfo, batchInfo.type);
        const updatedBatchInfo = { ...batchInfo, jobCount: newJobs.length };

        if (batchInfo.type === 'QCed') {
          setJobs(prev => {
            const existingJobMap = new Map(prev.map(job => [job.jid, job]));
            const mergedJobs = [...prev];
            newJobs.forEach(newJob => {
              const existingJobIndex = mergedJobs.findIndex(j => j.jid === newJob.jid);
              if (existingJobIndex >= 0) {
                mergedJobs[existingJobIndex] = { ...mergedJobs[existingJobIndex], ...newJob };
              } else {
                mergedJobs.push(newJob);
              }
            });
            return mergedJobs;
          });
        } else {
          setJobs(prev => {
            const existingJids = new Set(prev.map(job => job.jid));
            const uniqueNewJobs = newJobs.filter(job => !existingJids.has(job.jid));
            return [...prev, ...uniqueNewJobs];
          });
        }

        setBatches(prev => [...prev, updatedBatchInfo]);
        setShowImportModal(false);

        toast({
          title: "Batch Import Successful",
          description: `Created ${updatedBatchInfo.name} with ${newJobs.length} jobs`,
        });
      } catch {
        toast({
          title: "Import Failed",
          description: "Failed to parse CSV file",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const handleExportCSV = () => {
    const csvContent = selectedBatch ? batchJobsToCSV(jobs, selectedBatch) : jobsToCSV(jobs);
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = selectedBatch ? `batch_${selectedBatch}_export_${timestamp}.csv` : `jobs_export_${timestamp}.csv`;
    downloadCSV(csvContent, filename);
  };

  const handleBatchExport = (batchId: string) => {
    const csvContent = batchJobsToCSV(jobs, batchId);
    const timestamp = new Date().toISOString().split('T')[0];
    const batch = batches.find(b => b.id === batchId);
    const filename = `batch_${batch?.name || batchId}_export_${timestamp}.csv`;
    downloadCSV(csvContent, filename);
  };

  const handleJobAssign = (jobIds: string[], assignedTo: string) => {
    setJobs(prev => prev.map(job => 
      jobIds.includes(job.jid) 
        ? { ...job, assignedTo, assignedDate: new Date().toISOString(), assignedBy: 'Current User' }
        : job
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const anomalyCount = jobs.filter(j => j.rejectReason?.includes('retrror')).length;

  const renderMainContent = () => {
    const filteredJobs = selectedBatch ? jobs.filter(j => j.batchId === selectedBatch) : jobs;

    switch (currentView) {
      case 'ai-insights':
        return <AnomalyDetection jobs={filteredJobs} batchId={selectedBatch} />;
      case 'batch-view':
        return (
          <div className="space-y-6">
            <Button variant="outline" onClick={() => setCurrentView('overview')} className="gap-2">
              ← Back to Overview
            </Button>
            <JobTable
              jobs={filteredJobs}
              onJobUpdate={handleJobUpdate}
              onExportCSV={handleExportCSV}
              batchId={selectedBatch}
              showBatchControls={true}
              onJobAssign={handleJobAssign}
              qcResources={qcResources}
            />
          </div>
        );
      default:
        return (
          <div className="space-y-8">
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricsCard title="Total Jobs" value={totalJobs} icon={<BarChart3 size={24} />} variant="primary" />
              <MetricsCard title="Accepted Jobs" value={acceptedJobs} icon={<CheckCircle size={24} />} variant="success" />
              <MetricsCard title="Rejected Jobs" value={rejectedJobs} icon={<XCircle size={24} />} variant="warning" />
              <MetricsCard title="Output Not Found" value={onfJobs} icon={<Clock size={24} />} variant="secondary" />
            </section>

            <section>
              <BatchManager
                batches={batches}
                selectedBatch={selectedBatch}
                onBatchSelect={setSelectedBatch}
                onBatchView={(batchId) => {
                  setSelectedBatch(batchId);
                  setCurrentView('batch-view');
                }}
                onBatchExport={handleBatchExport}
              />
            </section>

            <section>
              <JobTable
                jobs={filteredJobs}
                onJobUpdate={handleJobUpdate}
                onExportCSV={handleExportCSV}
                batchId={selectedBatch}
                showBatchControls={!!selectedBatch}
                onJobAssign={handleJobAssign}
                qcResources={qcResources}
              />
            </section>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex">
      <AISidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        selectedBatch={selectedBatch}
        onBatchChange={setSelectedBatch}
        batches={batches}
        anomalyCount={anomalyCount}
      />

      <div className="flex-1 flex flex-col">
        <header className="bg-gradient-primary shadow-medium">
          <div className="px-6 py-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  AI Smart Monitoring and Anomaly Detection Dashboard
                </h1>
                <p className="text-white/80 mt-1">
                  Real-time data annotation quality control and performance monitoring
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => setShowImportModal(true)} variant="secondary" className="gap-2">
                <Plus size={16} />
                New Batch
              </Button>
              <Badge variant="success" className="px-4 py-2 text-sm">
                <Zap className="w-4 h-4 mr-2" />
                Live Monitoring
              </Badge>
              <Badge variant="outline" className="px-4 py-2 text-sm bg-white/10 border-white/20 text-white">
                {totalJobs} Total Jobs
              </Badge>
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 py-8">{renderMainContent()}</main>
      </div>

      <CSVImportModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        onImport={handleBatchImport}
        nextBatchId={generateBatchId(batches)}
      />
    </div>
  );
};

export default Index;
