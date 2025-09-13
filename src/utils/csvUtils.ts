import { Job } from "@/components/JobTable";

export function parseCSVToJobs(csvContent: string): Job[] {
  const lines = csvContent.trim().split('\n');
  const jobs: Job[] = [];
  
  // Skip the first 2 lines (summary data) and start from actual job data
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const columns = line.split(',');
    if (columns.length >= 8 && columns[0].startsWith('jid_')) {
      const job: Job = {
        jid: columns[0] || '',
        refId: columns[1] || '',
        clientFileName: columns[2] || '',
        dataStatus: columns[3] || '',
        makingDate: columns[4] || '',
        qcName: columns[5] || '',
        qcDate: columns[6] || '',
        qcStatus: columns[7] || '',
        rejectReason: columns[8] || '',
        reworkDate: columns[9] || '',
        comment: columns[10] || '',
      };
      jobs.push(job);
    }
  }
  
  return jobs;
}

export function jobsToCSV(jobs: Job[]): string {
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
    'Comment'
  ];
  
  const rows = jobs.map(job => [
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
    job.comment || ''
  ]);
  
  return [headers, ...rows].map(row => 
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n');
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}