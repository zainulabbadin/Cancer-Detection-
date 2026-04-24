/**
 * PDF Controller (MVC)
 * Handles all PDF report generation logic.
 * Reads data from hidden store elements and builds
 * an A4 PDF via jsPDF — no html2canvas, no print dialog.
 */

class PDFController {

    /**
     * Generate and download the Medical Report PDF.
     * Call this after UIManager has populated the hidden data store.
     */
    static generateReport() {

        // ── Read data from hidden store ──────────────────────
        const imgId      = document.getElementById('pdf-id').innerText;
        const filename   = document.getElementById('pdf-filename').innerText;
        const reportDate = document.getElementById('pdf-date').innerText;
        const diagnosis  = document.getElementById('pdf-result-text').innerText;
        const confidence = document.getElementById('pdf-conf-text').innerText;
        const confPct    = parseFloat(document.getElementById('pdf-conf-fill').getAttribute('data-value')) || 0;

        // ── Init jsPDF ───────────────────────────────────────
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

        const pageW    = 210;
        const margin   = 20;
        const contentW = pageW - margin * 2;
        let y = 0;

        // ── HEADER ───────────────────────────────────────────
        // Dark navy rectangle
        doc.setFillColor(9, 46, 84);
        doc.rect(0, 0, pageW, 52, 'F');

        // Teal bottom accent bar
        doc.setFillColor(0, 133, 161);
        doc.rect(0, 52, pageW, 3, 'F');

        // Main title
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.text('Cancer Detection AI Platform', pageW / 2, 18, { align: 'center' });

        // Subtitle
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text('Medical Histopathology Analysis Report', pageW / 2, 30, { align: 'center' });

        // Confidential tag
        doc.setTextColor(176, 196, 222);
        doc.setFontSize(9);
        doc.text('CONFIDENTIAL - Medical Document', pageW / 2, 43, { align: 'center' });

        y = 68;

        // ── REPORT INFORMATION ───────────────────────────────
        doc.setTextColor(51, 51, 51);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Report Information', margin, y);

        // Divider line
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.4);
        doc.line(margin, y + 3, pageW - margin, y + 3);
        y += 13;

        // Info table rows
        const rows = [
            ['Patient Image ID:', imgId],
            ['Original Filename:', filename],
            ['Report Date & Time:', reportDate],
        ];

        rows.forEach(([label, value]) => {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10.5);
            doc.setTextColor(100, 100, 100);
            doc.text(label, margin, y);

            doc.setFont('helvetica', 'normal');
            doc.setTextColor(40, 40, 40);
            doc.text(String(value), margin + 58, y);
            y += 9;
        });

        y += 8;

        // ── DIAGNOSIS RESULTS ────────────────────────────────
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(51, 51, 51);
        doc.text('Diagnosis Results', margin, y);
        y += 10;

        // Teal Diagnosis Banner
        doc.setFillColor(0, 133, 161);
        doc.roundedRect(margin, y, contentW, 14, 3, 3, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12.5);
        doc.text(`Diagnosis: ${diagnosis}`, pageW / 2, y + 9.5, { align: 'center' });
        y += 22;

        // Confidence Score label + value
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(51, 51, 51);
        doc.text('Confidence Score:', margin, y);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(40, 40, 40);
        doc.text(String(confidence), margin + 58, y);
        y += 8;

        // Progress bar — grey track
        doc.setFillColor(224, 224, 224);
        doc.roundedRect(margin, y, contentW, 6, 2, 2, 'F');

        // Progress bar — teal fill
        const fillW = Math.max(0, (confPct / 100) * contentW);
        if (fillW > 0) {
            doc.setFillColor(0, 133, 161);
            doc.roundedRect(margin, y, fillW, 6, 2, 2, 'F');
        }
        y += 16;

        // Italic analysis note
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        doc.setTextColor(153, 153, 153);
        doc.text('Analysis successful.', pageW / 2, y, { align: 'center' });
        y += 18;

        // ── DISCLAIMER BOX ───────────────────────────────────
        const boxH = 32;
        doc.setFillColor(248, 252, 253);
        doc.setDrawColor(0, 133, 161);
        doc.setLineWidth(0.6);
        doc.roundedRect(margin, y, contentW, boxH, 2, 2, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(9, 46, 84);
        doc.text('Medical Disclaimer', margin + 4, y + 9);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(80, 80, 80);
        doc.text(
            'This report is generated by an AI-based cancer detection system and is intended for informational\npurposes only. It should not be used as a substitute for professional medical advice, diagnosis, or\ntreatment. Always consult a qualified healthcare provider for medical decisions.',
            margin + 4, y + 17,
            { maxWidth: contentW - 8, lineHeightFactor: 1.5 }
        );

        // ── SAVE ─────────────────────────────────────────────
        doc.save(`Medical_Report_${Date.now()}.pdf`);
    }

    /**
     * Bind the Download PDF button to generate the report.
     * Called once on DOMContentLoaded from result.controller.js
     */
    static bindDownloadButton() {
        const btn = document.getElementById('btn-print');
        if (btn) {
            btn.addEventListener('click', () => PDFController.generateReport());
        }
    }
}
