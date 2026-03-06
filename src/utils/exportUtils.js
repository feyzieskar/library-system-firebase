import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToCSV = (data, filename, t) => {
    if (!data || data.length === 0) return;

    // Get headers
    const headers = Object.keys(data[0]);

    // Create CSV content (handling commas and quotes in values)
    const csvContent = [
        headers.join(','),
        ...data.map(row =>
            headers.map(header => {
                let cell = row[header] === null || row[header] === undefined ? '' : String(row[header]);
                if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
                    cell = `"${cell.replace(/"/g, '""')}"`;
                }
                return cell;
            }).join(',')
        )
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

export const exportToPDF = (data, columns, filename, title, t) => {
    if (!data || data.length === 0) return;

    const doc = new jsPDF('landscape');

    // Convert Roboto-Regular (we use standard fonts for jsPDF unless we embed a custom one)
    // autoTable uses Helvetica by default, which is fine for English but fails on Turkish chars (ş ğ vb.)
    // A quick workaround in standard jsPDF without loading full TTF is to use predefined fonts, or just let autoTable handle it.
    // Actually jsPDF autoTable doesn't support Turkish chars without a custom font. 
    // We'll proceed with English fallback mapping or accept the default for now.

    doc.setFontSize(16);
    doc.text(title, 14, 20);

    const rows = data.map(item => columns.map(col => item[col.dataKey]));
    const head = [columns.map(col => col.header)];

    autoTable(doc, {
        head: head,
        body: rows,
        startY: 30,
        styles: { fontSize: 10, font: 'helvetica' },
        headStyles: { fillColor: [59, 130, 246] }, // matches var(--primary-500)
    });

    doc.save(`${filename}.pdf`);
};
