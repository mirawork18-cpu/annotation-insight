import type { Job } from "@/components/JobTable";
import type { BatchInfo } from "@/components/CSVImportModal";

export function generateBatchId(existingBatches: BatchInfo[]): string {
  const maxId = existingBatches.reduce((max, batch) => {
    const idMatch = batch.id.match(/Batch-(\d+)/);
    if (idMatch) {
      const num = parseInt(idMatch[1], 10);
      return Math.max(max, num);
    }
    return max;
  }, 0);
  
  return `Batch-${maxId + 1}`;
}

export function parseCSVToBatch(csvContent: string, batchInfo: BatchInfo, type: 'Fresh' | 'QCed'): Job[] {
  const lines = csvContent.trim().split('\n');
  const jobs: Job[] = [];
  
  if (lines.length < 2) return jobs;
  
  const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const columns = line.split(',').map(col => col.trim().replace(/^["']|["']$/g, ''));
    
    if (type === 'Fresh') {
      // For Fresh Data: job_id, ref_id, client_file_name are required
      const jobIdIndex = headers.findIndex(h => h.includes('job') && h.includes('id'));
      const refIdIndex = headers.findIndex(h => h.includes('ref') && h.includes('id'));
      const clientFileIndex = headers.findIndex(h => h.includes('client') && h.includes('file'));
      
      if (jobIdIndex >= 0 && columns[jobIdIndex]) {
        const job: Job = {
          jid: columns[jobIdIndex] || `job_${Date.now()}_${i}`,
          refId: columns[refIdIndex] || '',
          clientFileName: columns[clientFileIndex] || '',
          dataStatus: '',
          makingDate: '',
          qcName: '',
          qcDate: '',
          qcStatus: 'Not Started',
          batchId: batchInfo.id,
          rejectReason: '',
          reworkDate: '',
          comment: ''
        };
        jobs.push(job);
      }
    } else {
      // For QC'ed Data: job_id, client_file, data_status, making_date, qc_name, qc_date, qc_status, action
      const jobIdIndex = headers.findIndex(h => h.includes('jid') || (h.includes('job') && h.includes('id')));
      const refIdIndex = headers.findIndex(h => h.includes('ref') && h.includes('id'));
      const clientFileIndex = headers.findIndex(h => h.includes('client') && h.includes('file'));
      const dataStatusIndex = headers.findIndex(h => h.includes('data') && h.includes('status'));
      const makingDateIndex = headers.findIndex(h => h.includes('making') && h.includes('date'));
      const qcNameIndex = headers.findIndex(h => h.includes('qc') && h.includes('name'));
      const qcDateIndex = headers.findIndex(h => h.includes('qc') && h.includes('date'));
      const qcStatusIndex = headers.findIndex(h => h.includes('qc') && h.includes('status'));
      const rejectReasonIndex = headers.findIndex(h => h.includes('reject') || h.includes('reason'));
      const reworkDateIndex = headers.findIndex(h => h.includes('rework') && h.includes('date'));
      const commentIndex = headers.findIndex(h => h.includes('comment'));
      
      if (jobIdIndex >= 0 && columns[jobIdIndex]) {
        const job: Job = {
          jid: columns[jobIdIndex] || `job_${Date.now()}_${i}`,
          refId: columns[refIdIndex] || '',
          clientFileName: columns[clientFileIndex] || '',
          dataStatus: columns[dataStatusIndex] || 'Done',
          makingDate: columns[makingDateIndex] || '',
          qcName: columns[qcNameIndex] || '',
          qcDate: columns[qcDateIndex] || '',
          qcStatus: columns[qcStatusIndex] || 'Not Started',
          batchId: batchInfo.id,
          rejectReason: columns[rejectReasonIndex] || '',
          reworkDate: columns[reworkDateIndex] || '',
          comment: columns[commentIndex] || ''
        };
        jobs.push(job);
      }
    }
  }
  
  return jobs;
}

export function validateCSVSchema(csvContent: string, type: 'Fresh' | 'QCed'): { valid: boolean; errors: string[] } {
  const lines = csvContent.trim().split('\n');
  const errors: string[] = [];
  
  if (lines.length < 2) {
    errors.push('CSV file must contain at least a header row and one data row');
    return { valid: false, errors };
  }
  
  const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
  
  if (type === 'Fresh') {
    const requiredColumns = ['job_id', 'ref_id', 'client_file_name'];
    const missingColumns = requiredColumns.filter(col => 
      !headers.some(h => h.includes(col.replace('_', '')) || h.includes(col))
    );
    
    if (missingColumns.length > 0) {
      errors.push(`Missing required columns for Fresh Data: ${missingColumns.join(', ')}`);
    }
  } else {
    const requiredColumns = ['job_id', 'client_file', 'data_status', 'making_date', 'qc_name', 'qc_date', 'qc_status'];
    const missingColumns = requiredColumns.filter(col => 
      !headers.some(h => h.includes(col.replace('_', '')) || h.includes(col))
    );
    
    if (missingColumns.length > 0) {
      errors.push(`Missing required columns for QC'ed Data: ${missingColumns.join(', ')}`);
    }
  }
  
  // Check for duplicate job IDs
  const jobIds = new Set<string>();
  const duplicates: string[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const columns = line.split(',');
    const jobId = columns[0]?.trim().replace(/^["']|["']$/g, '');
    
    if (jobId) {
      if (jobIds.has(jobId)) {
        duplicates.push(`Row ${i + 1}: ${jobId}`);
      } else {
        jobIds.add(jobId);
      }
    }
  }
  
  if (duplicates.length > 0) {
    errors.push(`Duplicate Job IDs found: ${duplicates.slice(0, 5).join(', ')}${duplicates.length > 5 ? ` and ${duplicates.length - 5} more...` : ''}`);
  }
  
  return { valid: errors.length === 0, errors };
}

export function batchJobsToCSV(jobs: Job[], batchId?: string): string {
  const filteredJobs = batchId ? jobs.filter(job => job.batchId === batchId) : jobs;
  
  const headers = [
    'JID',
    'Ref ID', 
    'Client File Name',
    'Data Status',
    'Making Date',
    'QC Name',
    'QC Date', 
    'QC Status',
    'Reject Reason',
    'Rework Date',
    'Comment',
    'Batch ID',
    'Assigned To',
    'Assigned Date',
    'Assigned By'
  ];
  
  const rows = filteredJobs.map(job => [
    job.jid,
    job.refId,
    job.clientFileName,
    job.dataStatus,
    job.makingDate,
    job.qcName,
    job.qcDate,
    job.qcStatus,
    job.rejectReason || '',
    job.reworkDate || '',
    job.comment || '',
    job.batchId || '',
    job.assignedTo || '',
    job.assignedDate || '',
    job.assignedBy || ''
  ]);
  
  return [headers, ...rows].map(row => 
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n');
}