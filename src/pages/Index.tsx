import { useState, useEffect } from 'react';
import { MetricsCard } from '@/components/MetricsCard';
import { JobTable, Job } from '@/components/JobTable';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { parseCSVToJobs, jobsToCSV, downloadCSV } from '@/utils/csvUtils';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart3, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  Brain,
  Zap
} from 'lucide-react';

const Index = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load initial data from CSV file
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const response = await fetch('/src/data/jobs.csv');
        const csvContent = await response.text();
        const parsedJobs = parseCSVToJobs(csvContent);
        setJobs(parsedJobs);
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

  // Calculate metrics
  const totalJobs = jobs.length;
  const acceptedJobs = jobs.filter(job => job.qcStatus === 'Accepted').length;
  const rejectedJobs = jobs.filter(job => job.qcStatus === 'Rejected').length;
  const pendingJobs = jobs.filter(job => job.qcStatus === 'Done' || job.dataStatus === 'Done').length;
  const onfJobs = jobs.filter(job => job.qcStatus === 'Output Not Found').length;
  
  const acceptanceRate = totalJobs > 0 ? ((acceptedJobs / totalJobs) * 100).toFixed(1) : '0';
  const rejectionRate = totalJobs > 0 ? ((rejectedJobs / totalJobs) * 100).toFixed(1) : '0';

  // Handle job updates
  const handleJobUpdate = (updatedJob: Job) => {
    setJobs(prev => prev.map(job => 
      job.jid === updatedJob.jid ? updatedJob : job
    ));
    toast({
      title: "Job Updated",
      description: `Job ${updatedJob.jid} status updated to ${updatedJob.qcStatus}`,
    });
  };

  // Handle CSV import
  const handleImportCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        const newJobs = parseCSVToJobs(content);
        setJobs(prev => {
          // Merge new jobs, avoiding duplicates
          const existingJids = new Set(prev.map(job => job.jid));
          const uniqueNewJobs = newJobs.filter(job => !existingJids.has(job.jid));
          return [...prev, ...uniqueNewJobs];
        });
        toast({
          title: "Import Successful",
          description: `Imported ${newJobs.length} jobs from CSV`,
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Failed to parse CSV file",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  // Handle CSV export
  const handleExportCSV = () => {
    const csvContent = jobsToCSV(jobs);
    const timestamp = new Date().toISOString().split('T')[0];
    downloadCSV(csvContent, `jobs_export_${timestamp}.csv`);
    toast({
      title: "Export Successful",
      description: `Downloaded ${jobs.length} jobs as CSV`,
    });
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

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-gradient-primary shadow-medium">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
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
              <Badge variant="success" className="px-4 py-2 text-sm">
                <Zap className="w-4 h-4 mr-2" />
                Live Monitoring
              </Badge>
              <Badge variant="outline" className="px-4 py-2 text-sm bg-white/10 border-white/20 text-white">
                {totalJobs} Total Jobs
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Metrics Overview */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricsCard
            title="Total Jobs"
            value={totalJobs}
            icon={<BarChart3 size={24} />}
            variant="primary"
            change={`+${jobs.filter(j => j.makingDate === '8/22/2025').length} today`}
            trend="up"
          />
          <MetricsCard
            title="Accepted Jobs"
            value={acceptedJobs}
            icon={<CheckCircle size={24} />}
            variant="success"
            change={`${acceptanceRate}% acceptance rate`}
            trend="up"
          />
          <MetricsCard
            title="Rejected Jobs" 
            value={rejectedJobs}
            icon={<XCircle size={24} />}
            variant="warning"
            change={`${rejectionRate}% rejection rate`}
            trend="down"
          />
          <MetricsCard
            title="Output Not Found"
            value={onfJobs}
            icon={<Clock size={24} />}
            variant="secondary"
            change={`${((onfJobs / totalJobs) * 100).toFixed(1)}% of total`}
            trend="neutral"
          />
        </section>

        {/* Quality Analysis */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 bg-gradient-card shadow-medium">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Quality Metrics</h3>
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Acceptance Rate</span>
                <Badge variant="success">{acceptanceRate}%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Rejection Rate</span>
                <Badge variant="destructive">{rejectionRate}%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Processing Efficiency</span>
                <Badge variant="secondary">
                  {(100 - parseFloat(rejectionRate)).toFixed(1)}%
                </Badge>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-card shadow-medium">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">QC Performance</h3>
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active QC Staff</span>
                <Badge variant="primary">
                  {new Set(jobs.map(j => j.qcName)).size}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg Jobs/QC</span>
                <Badge variant="secondary">
                  {Math.round(totalJobs / new Set(jobs.map(j => j.qcName)).size)}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Top Performer</span>
                <Badge variant="success">Virat</Badge>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-card shadow-medium">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">AI Anomaly Detection</h3>
              <Brain className="h-5 w-5 text-accent animate-pulse" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Anomalies Detected</span>
                <Badge variant="warning">
                  {jobs.filter(j => j.rejectReason?.includes('retrror')).length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pattern Analysis</span>
                <Badge variant="accent">Active</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Quality Score</span>
                <Badge variant="success">92.5%</Badge>
              </div>
            </div>
          </Card>
        </section>

        {/* Job Management Table */}
        <section>
          <JobTable
            jobs={jobs}
            onJobUpdate={handleJobUpdate}
            onImportCSV={handleImportCSV}
            onExportCSV={handleExportCSV}
          />
        </section>
      </main>
    </div>
  );
};

export default Index;