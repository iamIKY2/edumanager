// utils/fileExtractor.js - Extract text từ các loại file
const fs = require('fs').promises;
const path = require('path');

class FileExtractor {
    /**
     * Extract text từ file
     */
    async extractText(filePath, fileType) {
        try {
            switch (fileType.toLowerCase()) {
                case '.txt':
                    return await this.extractFromTxt(filePath);
                case '.pdf':
                    return await this.extractFromPdf(filePath);
                case '.docx':
                case '.doc':
                    return await this.extractFromWord(filePath);
                case '.pptx':
                case '.ppt':
                    return await this.extractFromPowerPoint(filePath);
                case '.xlsx':
                case '.xls':
                    return await this.extractFromExcel(filePath);
                default:
                    throw new Error(`Unsupported file type: ${fileType}`);
            }
        } catch (error) {
            console.error(`❌ Error extracting text from ${fileType}:`, error);
            throw error;
        }
    }

    /**
     * Extract từ TXT
     */
    async extractFromTxt(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            return content;
        } catch (error) {
            throw new Error(`Cannot read TXT file: ${error.message}`);
        }
    }

    /**
     * Extract từ PDF (cần thư viện pdf-parse)
     */
    async extractFromPdf(filePath) {
        try {
            // Kiểm tra xem có thư viện pdf-parse không
            let pdfParse;
            try {
                pdfParse = require('pdf-parse');
            } catch (err) {
                console.warn('⚠️ pdf-parse not installed, using fallback');
                return 'PDF file detected. Please install pdf-parse package for full support.\nFor now, you can use AI to extract text from PDF.';
            }
            
            const dataBuffer = await fs.readFile(filePath);
            const data = await pdfParse(dataBuffer);
            return data.text;
        } catch (error) {
            throw new Error(`Cannot extract PDF: ${error.message}`);
        }
    }

    /**
     * Extract từ Word (cần thư viện mammoth)
     */
    async extractFromWord(filePath) {
        try {
            // Kiểm tra xem có thư viện mammoth không
            let mammoth;
            try {
                mammoth = require('mammoth');
            } catch (err) {
                console.warn('⚠️ mammoth not installed, using fallback');
                return 'Word file detected. Please install mammoth package for full support.\nFor now, you can use AI to extract text from Word.';
            }
            
            const result = await mammoth.extractRawText({ path: filePath });
            return result.value;
        } catch (error) {
            throw new Error(`Cannot extract Word: ${error.message}`);
        }
    }

    /**
     * Extract từ PowerPoint
     */
    async extractFromPowerPoint(filePath) {
        // PowerPoint extraction phức tạp hơn, tạm thời return placeholder
        return 'PowerPoint file detected. Text extraction from PPT/PPTX is not yet fully supported.\nPlease convert to PDF or Word for better results.';
    }

    /**
     * Extract từ Excel
     */
    async extractFromExcel(filePath) {
        try {
            // Sử dụng xlsx (đã có trong package.json)
            const XLSX = require('xlsx');
            const workbook = XLSX.readFile(filePath);
            
            let text = '';
            workbook.SheetNames.forEach(sheetName => {
                const sheet = workbook.Sheets[sheetName];
                const sheetText = XLSX.utils.sheet_to_txt(sheet);
                text += `\n\nSheet: ${sheetName}\n${sheetText}`;
            });
            
            return text.trim();
        } catch (error) {
            throw new Error(`Cannot extract Excel: ${error.message}`);
        }
    }
}

module.exports = new FileExtractor();





