import { Injectable, Logger } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { CV } from '@prisma/client';

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

      const personalInfo = (cv.personalInfo || {}) as any;
      const isEnglish = (personalInfo.language || '').toLowerCase().startsWith('en');

      const educationData = (Array.isArray(cv.educationData) ? cv.educationData : []) as any[];
      const employmentData = (Array.isArray(cv.employmentData) ? cv.employmentData : []) as any[];
      const skillsData = (Array.isArray(cv.skillsData) ? cv.skillsData : []) as any[];
      const languagesData = (Array.isArray(cv.languagesData) ? cv.languagesData : []) as any[];

      // Header: Name & Contact
      doc.fontSize(22).fillColor('#0f172a').font('Helvetica-Bold').text(personalInfo.fullName || 'Applicant Name');
      doc.fontSize(10).fillColor('#2563eb').font('Helvetica').text(
        isEnglish ? 'NEXORA ? CURRICULUM VITAE (INTERNATIONAL)' : 'NEXORA ? LEBENSLAUF (DIN 5008 STANDARD)'
      );
      doc.moveDown(0.5);

      const contact = [
        personalInfo.email,
        personalInfo.phone,
        personalInfo.location,
      ].filter(Boolean).join('  |  ');
      doc.fontSize(9).fillColor('#475569').text(contact);
      doc.moveDown(0.8);

      doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(45, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.8);

      // Section: Career Summary
      if (cv.summary) {
        doc.fontSize(12).fillColor('#1e293b').font('Helvetica-Bold').text(
          isEnglish ? 'PROFESSIONAL PROFILE' : 'BERUFLICHES PROFIL'
        );
        doc.fontSize(9.5).fillColor('#334155').font('Helvetica').text(cv.summary, { lineGap: 2 });
        if (cv.isSummaryAiGenerated) {
          doc.fontSize(7.5).fillColor('#64748b').font('Helvetica-Oblique').text(
            isEnglish ? '[AI-Assisted Summary ? Verified with Dossier Credentials]' : '[KI-Generiertes Profil ? Verifiziert anhand der Dossier-Daten]'
          );
        }
        doc.moveDown(1);
      }

      // Section: Education (Ausbildung / Studium)
      if (educationData.length > 0) {
        doc.fontSize(12).fillColor('#1e293b').font('Helvetica-Bold').text(
          isEnglish ? 'EDUCATION & ACADEMIC BACKGROUND' : 'AUSBILDUNG & STUDIUM'
        );
        doc.moveDown(0.3);

        for (const edu of educationData) {
          doc.fontSize(10).fillColor('#0f172a').font('Helvetica-Bold').text(`${edu.degree} ? ${edu.field}`);
          doc.fontSize(9).fillColor('#2563eb').font('Helvetica').text(
            `${edu.institution}  (${edu.period || (isEnglish ? 'Completed' : 'Abschluss')})`
          );
          if (edu.grade) {
            doc.fontSize(8.5).fillColor('#475569').text(
              isEnglish ? `Grade / CGPA: ${edu.grade}` : `Note / CGPA: ${edu.grade}`
            );
          }
          if (edu.provenance) {
            doc.fontSize(7.5).fillColor('#16a34a').font('Helvetica-Oblique').text(
              isEnglish ? `? Verified Source: ${edu.provenance}` : `? Nachweis: ${edu.provenance}`
            );
          }
          doc.moveDown(0.6);
        }
        doc.moveDown(0.5);
      }

      // Section: Work Experience (Berufserfahrung)
      if (employmentData.length > 0) {
        doc.fontSize(12).fillColor('#1e293b').font('Helvetica-Bold').text(
          isEnglish ? 'PROFESSIONAL WORK EXPERIENCE' : 'BERUFSERFAHRUNG'
        );
        doc.moveDown(0.3);

        for (const emp of employmentData) {
          doc.fontSize(10).fillColor('#0f172a').font('Helvetica-Bold').text(emp.role);
          doc.fontSize(9).fillColor('#2563eb').font('Helvetica').text(`${emp.company}  (${emp.period})`);
          if (emp.responsibilities) {
            doc.fontSize(9).fillColor('#334155').font('Helvetica').text(emp.responsibilities, { lineGap: 1.5 });
          }
          doc.moveDown(0.6);
        }
        doc.moveDown(0.5);
      }

      // Section: Skills & Competencies (Kenntnisse & F?higkeiten)
      if (skillsData.length > 0) {
        doc.fontSize(12).fillColor('#1e293b').font('Helvetica-Bold').text(
          isEnglish ? 'SKILLS & CORE COMPETENCIES' : 'KENNTNISSE & F?HIGKEITEN'
        );
        doc.moveDown(0.3);
        const skillList = skillsData.map((s) => `${s.name} (${s.level || (isEnglish ? 'Proficient' : 'Fortgeschritten')})`).join('  ?  ');
        doc.fontSize(9).fillColor('#334155').font('Helvetica').text(skillList);
        doc.moveDown(1);
      }

      // Section: Languages (Sprachkenntnisse)
      if (languagesData.length > 0) {
        doc.fontSize(12).fillColor('#1e293b').font('Helvetica-Bold').text(
          isEnglish ? 'LANGUAGE PROFICIENCY' : 'SPRACHKENNTNISSE'
        );
        doc.moveDown(0.3);
        for (const lang of languagesData) {
          const cert = lang.certificate ? ` [${lang.certificate}]` : '';
          doc.fontSize(9).fillColor('#0f172a').font('Helvetica-Bold').text(`${lang.language}: `, { continued: true });
          doc.fontSize(9).fillColor('#334155').font('Helvetica').text(`CEFR Level ${lang.level}${cert}`);
        }
        doc.moveDown(1);
      }

      // Footer
      doc.fontSize(8).fillColor('#94a3b8').text(
        isEnglish
          ? `Generated via Nexora (In collaboration with Educaro Deutschland) on ${new Date().toLocaleDateString('en-US')}`
          : `Erstellt ?ber Nexora (In Kooperation mit Educaro Deutschland) am ${new Date().toLocaleDateString('de-DE')}`,
        45,
        780,
        { align: 'center', width: 505 },
      );

      doc.end();
    });
  }
}
