import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

const uploadDir = path.join(process.cwd(), 'uploads', 'cover-letters'); // Shared with cover letters for now as per plan

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Generate a professional PDF cover letter
 * @param {string} content - The body text of the letter
 * @param {object} candidate - { name, email, phone, address }
 * @param {object} job - { title, company, address }
 * @returns {Promise<string>} - The relative path to the generated PDF
 */
export const generatePDF = async (content, candidate, job) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margins: {
                    top: 50,
                    bottom: 50,
                    left: 72, // 1 inch
                    right: 72 // 1 inch
                }
            });

            const filename = `${uuidv4()}.pdf`;
            const filePath = path.join(uploadDir, filename);
            const relativePath = `/uploads/cover-letters/${filename}`;

            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // 1. Header (Candidate Info)
            doc.font('Times-Bold').fontSize(16).text(candidate.name, { align: 'center' });
            doc.moveDown(0.5);

            doc.font('Times-Roman').fontSize(10);
            const contactInfo = [candidate.email, candidate.phone, candidate.location].filter(Boolean).join(' | ');
            doc.text(contactInfo, { align: 'center' });
            doc.moveDown(2);

            // 2. Date
            const today = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            doc.text(today, { align: 'left' });
            doc.moveDown(1.5);

            // 3. Recipient Info
            doc.text('Hiring Manager');
            doc.text(job.company_name || job.company || 'Company Name');
            if (job.address || job.location) doc.text(job.address || job.location);
            doc.moveDown(1.5);

            // 4. Body Content (Includes Salutation & Sign-off)
            doc.fontSize(11).lineGap(4); // 1.5 line spacing approx

            // Handle content paragraphs
            const paragraphs = content.split('\n\n');
            paragraphs.forEach(para => {
                doc.text(para, { align: 'justify' });
                doc.moveDown(1);
            });

            doc.end();

            stream.on('finish', () => {
                resolve(relativePath);
            });

            stream.on('error', (err) => {
                reject(err);
            });

        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Generate a professional Resume PDF
 * @param {string} content - The optimized resume text
 * @param {object} candidate - { name, email, phone, location }
 * @returns {Promise<string>} - Relative path to PDF
 */
export const generateResumePDF = async (content, candidate) => {
    return new Promise((resolve, reject) => {
        try {
            const filename = `resume_${uuidv4()}.pdf`;
            const filePath = path.join(uploadDir, filename); // Reusing uploadDir from above or generic uploads/
            // Ideally should be uploads/resumes/optimized but keeping simple for now
            const relativePath = `/uploads/cover-letters/${filename}`; // Reusing existing path structure to avoid permission issues

            const doc = new PDFDocument({ margin: 50, font: 'Times-Roman' });
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Header
            doc.font('Times-Bold').fontSize(20).text(candidate.name, { align: 'center' });
            doc.moveDown(0.3);

            doc.font('Times-Roman').fontSize(10);
            const contact = [candidate.email, candidate.phone, candidate.location].filter(Boolean).join(' | ');
            doc.text(contact, { align: 'center' });
            doc.moveDown(1.5);

            // Content Parsing (Basic)
            // Expecting standard headers like "SUMMARY", "EXPERIENCE" in CAPS
            const lines = content.split('\n');

            doc.fontSize(11);

            lines.forEach(line => {
                const trimmed = line.trim();

                // Check if line is a Header (All Caps and short)
                if (trimmed.length > 3 && trimmed.length < 30 && trimmed === trimmed.toUpperCase() && /^[A-Z\s]+$/.test(trimmed)) {
                    doc.moveDown(0.5);
                    doc.font('Times-Bold').fontSize(12).text(trimmed);
                    doc.font('Times-Roman').fontSize(11); // Reset
                }
                // Bullet points
                else if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
                    doc.text(trimmed, { indent: 10, align: 'justify' });
                }
                // Normal text
                else {
                    doc.text(trimmed, { align: 'justify' });
                }
            });

            // Pagination
            const range = doc.bufferedPageRange();
            for (let i = range.start; i < range.start + range.count; i++) {
                doc.switchToPage(i);
                doc.fontSize(9).text(`Page ${i + 1}`, 50, doc.page.height - 50, { align: 'center' });
            }

            doc.end();

            stream.on('finish', () => resolve(relativePath));
            stream.on('error', reject);

        } catch (e) {
            reject(e);
        }
    });
};
