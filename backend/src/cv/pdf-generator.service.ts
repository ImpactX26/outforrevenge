import { Injectable, Logger } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { CV } from '../database/entities/cv.entity';

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);

  async generateCvPdfBuffer(cv: CV): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 40, left: 45, right: 45 },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // Header: Name & Contact
      doc.fontSize(22).fillColor('#0f172a').font('Helvetica-Bold').text(cv.personalInfo.fullName || 'Applicant Name');
      doc.fontSize(10).fillColor('#2563eb').font('Helvetica').text('NEXORA — LEBENSLAUF (GERMAN STANDARD CV)');
      doc.moveDown(0.5);

      const contact = [
        cv.personalInfo.email,
        cv.personalInfo.phone,
        cv.personalInfo.location,
      ].filter(Boolean).join('  |  ');
      doc.fontSize(9).fillColor('#475569').text(contact);
      doc.moveDown(0.8);

      doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(45, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.8);

      // Section: Career Summary
      if (cv.summary) {
        doc.fontSize(12).fillColor('#1e293b').font('Helvetica-Bold').text('BERUFLICHES PROFIL / SUMMARY');
        doc.fontSize(9.5).fillColor('#334155').font('Helvetica').text(cv.summary, { lineGap: 2 });
        if (cv.isSummaryAiGenerated) {
          doc.fontSize(7.5).fillColor('#64748b').font('Helvetica-Oblique').text('[AI Generated Summary — Verified by Applicant]');
        }
        doc.moveDown(1);
      }

      // Section: Education (Ausbildung / Studium)
      if (cv.educationData && cv.educationData.length > 0) {
        doc.fontSize(12).fillColor('#1e293b').font('Helvetica-Bold').text('AUSBILDUNG & STUDIUM / EDUCATION');
        doc.moveDown(0.3);

        for (const edu of cv.educationData) {
          doc.fontSize(10).fillColor('#0f172a').font('Helvetica-Bold').text(`${edu.degree} — ${edu.field}`);
          doc.fontSize(9).fillColor('#2563eb').font('Helvetica').text(`${edu.institution}  (${edu.period || 'Graduated'})`);
          if (edu.grade) {
            doc.fontSize(8.5).fillColor('#475569').text(`Grade / CGPA: ${edu.grade}`);
          }
          if (edu.provenance) {
            doc.fontSize(7.5).fillColor('#16a34a').font('Helvetica-Oblique').text(`✓ Source: ${edu.provenance}`);
          }
          doc.moveDown(0.6);
        }
        doc.moveDown(0.5);
      }

      // Section: Work Experience (Berufserfahrung)
      if (cv.employmentData && cv.employmentData.length > 0) {
        doc.fontSize(12).fillColor('#1e293b').font('Helvetica-Bold').text('BERUFSERFAHRUNG / WORK EXPERIENCE');
        doc.moveDown(0.3);

        for (const emp of cv.employmentData) {
          doc.fontSize(10).fillColor('#0f172a').font('Helvetica-Bold').text(emp.role);
          doc.fontSize(9).fillColor('#2563eb').font('Helvetica').text(`${emp.company}  (${emp.period})`);
          if (emp.responsibilities) {
            doc.fontSize(9).fillColor('#334155').font('Helvetica').text(emp.responsibilities, { lineGap: 1.5 });
          }
          doc.moveDown(0.6);
        }
        doc.moveDown(0.5);
      }

      // Section: Skills & Competencies (Kenntnisse & Fähigkeiten)
      if (cv.skillsData && cv.skillsData.length > 0) {
        doc.fontSize(12).fillColor('#1e293b').font('Helvetica-Bold').text('KENNTNISSE & FÄHIGKEITEN / SKILLS');
        doc.moveDown(0.3);
        const skillList = cv.skillsData.map((s) => `${s.name} (${s.level || 'Proficient'})`).join('  •  ');
        doc.fontSize(9).fillColor('#334155').font('Helvetica').text(skillList);
        doc.moveDown(1);
      }

      // Section: Languages (Sprachkenntnisse)
      if (cv.languagesData && cv.languagesData.length > 0) {
        doc.fontSize(12).fillColor('#1e293b').font('Helvetica-Bold').text('SPRACHKENNTNISSE / LANGUAGES');
        doc.moveDown(0.3);
        for (const lang of cv.languagesData) {
          const cert = lang.certificate ? ` [${lang.certificate}]` : '';
          doc.fontSize(9).fillColor('#0f172a').font('Helvetica-Bold').text(`${lang.language}: `, { continued: true });
          doc.fontSize(9).fillColor('#334155').font('Helvetica').text(`CEFR Level ${lang.level}${cert}`);
        }
        doc.moveDown(1);
      }

      // Footer
      doc.fontSize(8).fillColor('#94a3b8').text(
        `Generated via Nexora (ImpactX'26 / Educaro Deutschland) on ${new Date().toLocaleDateString('de-DE')}`,
        45,
        780,
        { align: 'center', width: 505 },
      );

      doc.end();
    });
  }
}
