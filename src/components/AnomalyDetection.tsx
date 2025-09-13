import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  Users, 
  Target,
  Brain,
  CheckCircle,
  XCircle
} from "lucide-react";
import type { Job } from "./JobTable";

interface Anomaly {
  id: string;
  type: 'rejection_spike' | 'processing_delay' | 'pattern_error' | 'quality_drop';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedJobs: string[];
  batchId?: string;
  detectedAt: string;
  suggestedAction: string;
  resolved: boolean;
}

interface AnomalyDetectionProps {
  jobs: Job[];
  batchId?: string;
  onResolveAnomaly?: (anomalyId: string) => void;
  onViewAffectedJobs?: (jobIds: string[]) => void;
}

export function AnomalyDetection({ 
  jobs, 
  batchId, 
  onResolveAnomaly, 
  onViewAffectedJobs 
}: AnomalyDetectionProps) {
  
  const anomalies = useMemo(() => {
    const detectedAnomalies: Anomaly[] = [];
    
    // Filter jobs by batch if specified
    const relevantJobs = batchId 
      ? jobs.filter(job => job.batchId === batchId)
      : jobs;

    if (relevantJobs.length === 0) return detectedAnomalies;

    // 1. Rejection Rate Spike Detection
    const rejectRate = relevantJobs.filter(j => j.qcStatus === 'Rejected').length / relevantJobs.length;
    if (rejectRate > 0.25) { // More than 25% rejection rate
      const rejectedJobs = relevantJobs.filter(j => j.qcStatus === 'Rejected');
      detectedAnomalies.push({
        id: 'rejection_spike_1',
        type: 'rejection_spike',
        severity: rejectRate > 0.4 ? 'critical' : 'high',
        title: 'High Rejection Rate Detected',
        description: `${(rejectRate * 100).toFixed(1)}% of jobs rejected (${rejectedJobs.length}/${relevantJobs.length})`,
        affectedJobs: rejectedJobs.map(j => j.jid),
        batchId,
        detectedAt: new Date().toISOString(),
        suggestedAction: 'Review annotation guidelines and provide additional training',
        resolved: false
      });
    }

    // 2. Pattern Error Detection (similar reject reasons)
    const rejectReasons = relevantJobs
      .filter(j => j.qcStatus === 'Rejected' && j.rejectReason)
      .map(j => j.rejectReason!);
    
    const reasonCounts = rejectReasons.reduce((acc, reason) => {
      // Normalize similar errors (containing 'retrror', 'missing', etc.)
      const normalized = reason.toLowerCase().includes('retrror') ? 'structural_error' :
                        reason.toLowerCase().includes('missing') ? 'missing_component' :
                        reason.toLowerCase().includes('wrong') ? 'incorrect_labeling' : reason;
      acc[normalized] = (acc[normalized] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(reasonCounts).forEach(([reason, count]) => {
      if (count >= 3) { // 3 or more similar errors
        const affectedJobs = relevantJobs
          .filter(j => j.rejectReason?.toLowerCase().includes(
            reason === 'structural_error' ? 'retrror' :
            reason === 'missing_component' ? 'missing' :
            reason === 'incorrect_labeling' ? 'wrong' : reason
          ))
          .map(j => j.jid);

        detectedAnomalies.push({
          id: `pattern_${reason}`,
          type: 'pattern_error',
          severity: count > 5 ? 'high' : 'medium',
          title: 'Recurring Error Pattern',
          description: `Pattern "${reason}" detected in ${count} jobs`,
          affectedJobs,
          batchId,
          detectedAt: new Date().toISOString(),
          suggestedAction: `Focus training on ${reason.replace('_', ' ')} issues`,
          resolved: false
        });
      }
    });

    // 3. QC Performance Anomaly
    const qcPerformance = relevantJobs.reduce((acc, job) => {
      if (!job.qcName) return acc;
      if (!acc[job.qcName]) {
        acc[job.qcName] = { total: 0, rejected: 0, accepted: 0 };
      }
      acc[job.qcName].total++;
      if (job.qcStatus === 'Rejected') acc[job.qcName].rejected++;
      if (job.qcStatus === 'Accepted') acc[job.qcName].accepted++;
      return acc;
    }, {} as Record<string, { total: number; rejected: number; accepted: number }>);

    Object.entries(qcPerformance).forEach(([qcName, stats]) => {
      const rejectionRate = stats.rejected / stats.total;
      if (stats.total >= 10 && rejectionRate > 0.5) { // 50%+ rejection rate with minimum 10 jobs
        detectedAnomalies.push({
          id: `qc_performance_${qcName}`,
          type: 'quality_drop',
          severity: rejectionRate > 0.7 ? 'critical' : 'high',
          title: `QC Performance Issue: ${qcName}`,
          description: `${(rejectionRate * 100).toFixed(1)}% rejection rate (${stats.rejected}/${stats.total} jobs)`,
          affectedJobs: relevantJobs.filter(j => j.qcName === qcName && j.qcStatus === 'Rejected').map(j => j.jid),
          batchId,
          detectedAt: new Date().toISOString(),
          suggestedAction: `Review ${qcName}'s recent work and provide guidance`,
          resolved: false
        });
      }
    });

    // 4. Processing Delay Detection (Output Not Found)
    const onfJobs = relevantJobs.filter(j => j.qcStatus === 'Output Not Found');
    if (onfJobs.length > relevantJobs.length * 0.1) { // More than 10% ONF rate
      detectedAnomalies.push({
        id: 'processing_delay_1',
        type: 'processing_delay',
        severity: onfJobs.length > relevantJobs.length * 0.2 ? 'high' : 'medium',
        title: 'High Output Not Found Rate',
        description: `${onfJobs.length} jobs with missing outputs (${((onfJobs.length / relevantJobs.length) * 100).toFixed(1)}%)`,
        affectedJobs: onfJobs.map(j => j.jid),
        batchId,
        detectedAt: new Date().toISOString(),
        suggestedAction: 'Check annotation pipeline and file generation process',
        resolved: false
      });
    }

    return detectedAnomalies.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }, [jobs, batchId]);

  const getSeverityIcon = (severity: Anomaly['severity']) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'medium': return <Clock className="h-4 w-4 text-warning" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSeverityColor = (severity: Anomaly['severity']) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      case 'low': return 'secondary';
    }
  };

  const getTypeIcon = (type: Anomaly['type']) => {
    switch (type) {
      case 'rejection_spike': return <TrendingUp className="h-4 w-4" />;
      case 'processing_delay': return <Clock className="h-4 w-4" />;
      case 'pattern_error': return <Target className="h-4 w-4" />;
      case 'quality_drop': return <Users className="h-4 w-4" />;
    }
  };

  // Calculate quality score
  const qualityScore = useMemo(() => {
    if (jobs.length === 0) return 100;
    
    const relevantJobs = batchId ? jobs.filter(job => job.batchId === batchId) : jobs;
    if (relevantJobs.length === 0) return 100;
    
    const acceptedJobs = relevantJobs.filter(j => j.qcStatus === 'Accepted').length;
    const baseScore = (acceptedJobs / relevantJobs.length) * 100;
    
    // Deduct points for anomalies
    const anomalyDeduction = anomalies.reduce((acc, anomaly) => {
      switch (anomaly.severity) {
        case 'critical': return acc + 15;
        case 'high': return acc + 10;
        case 'medium': return acc + 5;
        case 'low': return acc + 2;
      }
    }, 0);
    
    return Math.max(0, Math.min(100, baseScore - anomalyDeduction));
  }, [jobs, batchId, anomalies]);

  return (
    <Card className="p-6 bg-gradient-card shadow-medium">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-accent/10 p-2 rounded-lg">
              <Brain className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">AI Anomaly Detection</h2>
              <p className="text-sm text-muted-foreground">
                {anomalies.length} anomalies detected • Quality Score: {qualityScore.toFixed(1)}%
              </p>
            </div>
          </div>
          <Badge 
            variant={qualityScore >= 90 ? 'success' : qualityScore >= 70 ? 'warning' : 'destructive'}
            className="gap-2"
          >
            <Brain size={12} />
            {qualityScore.toFixed(1)}% Quality
          </Badge>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {['critical', 'high', 'medium', 'low'].map(severity => {
            const count = anomalies.filter(a => a.severity === severity).length;
            return (
              <div key={severity} className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  {getSeverityIcon(severity as Anomaly['severity'])}
                  <span className="text-sm font-medium capitalize">{severity}</span>
                </div>
                <p className="text-lg font-semibold">{count}</p>
              </div>
            );
          })}
        </div>

        {/* Anomalies List */}
        <div className="space-y-3">
          {anomalies.length === 0 ? (
            <Alert className="border-success bg-success/10">
              <CheckCircle className="h-4 w-4 text-success" />
              <AlertDescription className="text-success">
                No anomalies detected. All systems operating normally.
              </AlertDescription>
            </Alert>
          ) : (
            anomalies.map((anomaly) => (
              <Alert key={anomaly.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2 mt-1">
                    {getTypeIcon(anomaly.type)}
                    {getSeverityIcon(anomaly.severity)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{anomaly.title}</h3>
                      <Badge variant={getSeverityColor(anomaly.severity)}>
                        {anomaly.severity}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {anomaly.affectedJobs.length} jobs
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {anomaly.description}
                    </p>
                    
                    <p className="text-sm font-medium text-accent mb-3">
                      💡 {anomaly.suggestedAction}
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewAffectedJobs?.(anomaly.affectedJobs)}
                        className="h-7 text-xs"
                      >
                        View Jobs ({anomaly.affectedJobs.length})
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onResolveAnomaly?.(anomaly.id)}
                        className="h-7 text-xs"
                      >
                        Mark Resolved
                      </Button>
                    </div>
                  </div>
                </div>
              </Alert>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}