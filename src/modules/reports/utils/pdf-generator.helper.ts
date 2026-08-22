/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
import PDFDocument from 'pdfkit';

export function generateProductivityPdf(
  reportType: string,
  rows: any[],
  title: string,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        layout: 'landscape',
      });
      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Title & Header
      doc.fillColor('#0753F6').fontSize(18).text(title, { align: 'center' });
      doc.moveDown(0.5);
      doc
        .fillColor('#4b5563')
        .fontSize(9)
        .text(`Generated on: ${new Date().toLocaleString()}`, {
          align: 'center',
        });
      doc.moveDown(1.5);

      // Define columns based on reportType
      let columns: { header: string; key: string; width: number }[] = [];
      if (reportType === 'daily' || reportType === 'reconciliation') {
        columns = [
          { header: 'Employee', key: 'employee_name', width: 100 },
          { header: 'Code', key: 'employee_code', width: 60 },
          { header: 'Date', key: 'date', width: 65 },
          { header: 'Productive', key: 'productive_time', width: 65 },
          { header: 'Idle', key: 'idle_time', width: 55 },
          { header: 'Desktop Work', key: 'desktop_work_time', width: 75 },
          { header: 'Break', key: 'break_time', width: 55 },
          { header: 'Unaccounted', key: 'unaccounted_time', width: 75 },
          { header: 'Engagement', key: 'total_engagement_time', width: 75 },
          { header: 'Span', key: 'workday_span', width: 55 },
          { header: 'Act %', key: 'activity_percentage', width: 40 },
        ];
      } else if (reportType === 'session-audit') {
        columns = [
          { header: 'Employee', key: 'full_name', width: 110 },
          { header: 'Code', key: 'employee_code', width: 60 },
          { header: 'Source', key: 'device_id', width: 80 },
          { header: 'Login Time', key: 'login_time', width: 110 },
          { header: 'Last Active', key: 'last_active', width: 110 },
          { header: 'Duration', key: 'session_duration', width: 60 },
          { header: 'Productive', key: 'productive_time', width: 60 },
          { header: 'Idle', key: 'idle_time', width: 50 },
          { header: 'Tracked', key: 'tracked_time', width: 60 },
          { header: 'Severity', key: 'severity', width: 60 },
        ];
      } else if (reportType === 'work-status') {
        columns = [
          { header: 'Employee', key: 'full_name', width: 110 },
          { header: 'Code', key: 'employee_code', width: 60 },
          { header: 'Department', key: 'department', width: 90 },
          { header: 'Status', key: 'status', width: 60 },
          { header: 'Current App', key: 'current_app', width: 110 },
          { header: 'Details', key: 'current_window', width: 140 },
          { header: 'Session Start', key: 'session_start', width: 100 },
          { header: 'Time Today', key: 'total_time_today', width: 65 },
        ];
      } else {
        // Fallback for weekly/monthly rank lists
        columns = [
          { header: 'Employee', key: 'full_name', width: 150 },
          { header: 'Code', key: 'employee_code', width: 80 },
          { header: 'Department', key: 'department', width: 120 },
          { header: 'Productive Hours', key: 'productive_hours', width: 110 },
          { header: 'Tracked Hours', key: 'tracked_hours', width: 110 },
          { header: 'Act %', key: 'activity_percentage', width: 80 },
        ];
      }

      // Draw table headers
      const startX = 40;
      let startY = doc.y;
      doc.rect(startX, startY, 715, 20).fill('#0753F6');
      doc.fillColor('#ffffff').fontSize(8);

      let currentX = startX;
      for (const col of columns) {
        doc.text(col.header, currentX + 4, startY + 6, {
          width: col.width - 8,
        });
        currentX += col.width;
      }
      doc.moveDown(1);
      startY += 20;

      // Draw table rows
      doc.fillColor('#2d3748');
      for (const row of rows) {
        if (startY > 500) {
          doc.addPage();
          doc
            .fillColor('#0753F6')
            .fontSize(18)
            .text(title, { align: 'center' });
          doc.moveDown(1);
          startY = doc.y;
          doc.rect(startX, startY, 715, 20).fill('#0753F6');
          doc.fillColor('#ffffff').fontSize(8);
          currentX = startX;
          for (const col of columns) {
            doc.text(col.header, currentX + 4, startY + 6, {
              width: col.width - 8,
            });
            currentX += col.width;
          }
          doc.moveDown(1);
          startY += 20;
          doc.fillColor('#2d3748');
        }

        doc
          .moveTo(startX, startY)
          .lineTo(startX + 715, startY)
          .strokeColor('#e2e8f0')
          .stroke();

        currentX = startX;
        const maxHeight = 16;
        for (const col of columns) {
          const val = String(row[col.key] || '');
          if (col.key === 'severity') {
            doc.fillColor(
              row.severity === 'Critical'
                ? '#ef4444'
                : row.severity === 'Warning'
                  ? '#f59e0b'
                  : '#10b981',
            );
          } else if (col.key === 'status') {
            doc.fillColor(
              row.status === 'Active'
                ? '#10b981'
                : row.status === 'Idle'
                  ? '#f59e0b'
                  : '#6b7280',
            );
          } else {
            doc.fillColor('#2d3748');
          }
          doc.text(val, currentX + 4, startY + 4, { width: col.width - 8 });
          currentX += col.width;
        }

        startY += maxHeight;
      }

      // Add page numbers
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);
        doc
          .fontSize(8)
          .fillColor('#9ca3af')
          .text(
            `Page ${i + 1} of ${range.count}  |  Grehasoft Smart IT Solutions`,
            40,
            560,
            { align: 'center', width: 715 },
          );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export function generateProductivityCsv(
  reportType: string,
  rows: any[],
): string {
  let columns: string[] = [];
  let headers: string[] = [];

  if (reportType === 'daily' || reportType === 'reconciliation') {
    headers = [
      'Employee',
      'Code',
      'Date',
      'Productive Time',
      'Idle Time',
      'Desktop Work Time',
      'Portal Active Time',
      'Break Time',
      'Unaccounted Time',
      'Total Engagement Time',
      'Workday Span',
      'Activity Percentage',
      'Status',
    ];
    columns = [
      'employee_name',
      'employee_code',
      'date',
      'productive_time',
      'idle_time',
      'desktop_work_time',
      'portal_active_time',
      'break_time',
      'unaccounted_time',
      'total_engagement_time',
      'workday_span',
      'activity_percentage',
      'status',
    ];
  } else if (reportType === 'session-audit') {
    headers = [
      'Employee',
      'Code',
      'Source',
      'Login Time',
      'Last Active',
      'Duration',
      'Productive',
      'Idle',
      'Tracked',
      'Severity',
      'Status',
    ];
    columns = [
      'full_name',
      'employee_code',
      'device_id',
      'login_time',
      'last_active',
      'session_duration',
      'productive_time',
      'idle_time',
      'tracked_time',
      'severity',
      'validation_status',
    ];
  } else if (reportType === 'work-status') {
    headers = [
      'Employee',
      'Code',
      'Department',
      'Status',
      'Current App',
      'Details',
      'Session Start',
      'Time Today',
    ];
    columns = [
      'full_name',
      'employee_code',
      'department',
      'status',
      'current_app',
      'current_window',
      'session_start',
      'total_time_today',
    ];
  } else {
    // Fallback/Rank lists
    headers = [
      'Employee',
      'Code',
      'Department',
      'Productive Hours',
      'Tracked Hours',
      'Activity Percentage',
    ];
    columns = [
      'full_name',
      'employee_code',
      'department',
      'productive_hours',
      'tracked_hours',
      'activity_percentage',
    ];
  }

  const csvRows = [headers.join(',')];
  for (const r of rows) {
    const values = columns.map((col) => {
      const val = String(r[col] || '');
      const escaped = val.replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}
