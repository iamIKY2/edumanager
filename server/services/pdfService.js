const PDFDocument = require('pdfkit');

/**
 * Tạo báo cáo PDF cho admin
 */
async function generateAdminReport(reportData, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);
      
      // Header
      doc.fontSize(20)
         .text('BÁO CÁO THỐNG KÊ HỆ THỐNG THI TRỰC TUYẾN', { align: 'center' });
      
      doc.moveDown();
      doc.fontSize(12)
         .text(`Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')}`, { align: 'center' });
      
      if (options.period) {
        const periodNames = {
          week: '7 ngày qua',
          month: '30 ngày qua',
          quarter: '3 tháng qua',
          year: '1 năm qua',
          custom: `Từ ${options.start_date} đến ${options.end_date}`
        };
        doc.text(`Khoảng thời gian: ${periodNames[options.period] || 'N/A'}`, { align: 'center' });
      }
      
      doc.moveDown();
      
      // Thống kê tổng quan
      doc.fontSize(16)
         .text('THỐNG KÊ TỔNG QUAN', { underline: true });
      doc.moveDown(0.5);
      
      const stats = reportData.stats || {};
      doc.fontSize(11)
         .text(`Tổng số bài thi: ${stats.total_exams || 0}`)
         .text(`Tổng số lượt làm bài: ${stats.total_attempts || 0}`)
         .text(`Điểm trung bình: ${parseFloat(stats.average_score || 0).toFixed(2)}`)
         .text(`Tỷ lệ hoàn thành: ${parseFloat(stats.completion_rate || 0).toFixed(2)}%`)
         .text(`Cảnh báo gian lận: ${stats.cheating_warnings || 0}`)
         .text(`Số học sinh vi phạm: ${stats.violating_students || 0}`);
      
      doc.moveDown();
      
      // Phân bố xếp loại
      if (reportData.gradeDistribution && reportData.gradeDistribution.length > 0) {
        doc.fontSize(16)
           .text('PHÂN BỐ XẾP LOẠI', { underline: true });
        doc.moveDown(0.5);
        
        const total = reportData.gradeDistribution.reduce((sum, item) => sum + parseInt(item.count), 0);
        
        reportData.gradeDistribution.forEach(item => {
          const percent = total > 0 ? ((item.count / total) * 100).toFixed(1) : 0;
          doc.fontSize(11)
             .text(`${item.grade}: ${item.count} học sinh (${percent}%)`);
        });
        
        doc.moveDown();
      }
      
      // Top học sinh xuất sắc
      if (reportData.topStudents && reportData.topStudents.length > 0) {
        doc.fontSize(16)
           .text('TOP 10 HỌC SINH XUẤT SẮC', { underline: true });
        doc.moveDown(0.5);
        
        reportData.topStudents.forEach((student, index) => {
          doc.fontSize(11)
             .text(`${index + 1}. ${student.full_name || 'N/A'} - Điểm TB: ${parseFloat(student.avg_score || 0).toFixed(2)} - Số bài thi: ${student.exam_count || 0}`);
        });
        
        doc.moveDown();
      }
      
      // Học sinh cần hỗ trợ
      if (reportData.warningStudents && reportData.warningStudents.length > 0) {
        doc.fontSize(16)
           .text('HỌC SINH CẦN HỖ TRỢ', { underline: true });
        doc.moveDown(0.5);
        
        reportData.warningStudents.forEach((student, index) => {
          doc.fontSize(11)
             .text(`${index + 1}. ${student.full_name || 'N/A'} - Điểm TB: ${parseFloat(student.avg_score || 0).toFixed(2)} - Cảnh báo: ${student.warning_count || 0}`);
        });
        
        doc.moveDown();
      }
      
      // Báo cáo chi tiết theo kỳ thi
      if (reportData.details && reportData.details.length > 0) {
        doc.addPage();
        doc.fontSize(16)
           .text('BÁO CÁO CHI TIẾT THEO KỲ THI', { underline: true });
        doc.moveDown(0.5);
        
        reportData.details.forEach((exam, index) => {
          doc.fontSize(12)
             .text(`${index + 1}. ${exam.exam_name || 'N/A'}`, { underline: true });
          doc.fontSize(10)
             .text(`Môn học: ${exam.subject_name || 'N/A'}`)
             .text(`Số học sinh: ${exam.student_count || 0}`)
             .text(`Điểm trung bình: ${parseFloat(exam.average_score || 0).toFixed(2)}`)
             .text(`Điểm cao nhất: ${parseFloat(exam.highest_score || 0).toFixed(2)}`)
             .text(`Điểm thấp nhất: ${parseFloat(exam.lowest_score || 0).toFixed(2)}`)
             .text(`Tỷ lệ hoàn thành: ${parseFloat(exam.completion_rate || 0).toFixed(2)}%`)
             .text(`Cảnh báo gian lận: ${exam.cheating_warnings || 0}`);
          doc.moveDown();
        });
      }
      
      // Footer
      doc.fontSize(9)
         .text(
           `Báo cáo được tạo tự động bởi hệ thống Edexis - Trang ${doc.page}`,
           { align: 'center' }
         );
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateAdminReport
};

