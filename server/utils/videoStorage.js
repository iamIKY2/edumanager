// server/utils/videoStorage.js
// Utility quản lý lưu trữ video vi phạm

const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');

class VideoStorage {
    constructor() {
        // Thư mục gốc: server/uploads/videos
        this.baseDir = path.join(__dirname, '../uploads/videos');
        this.violationsDir = path.join(this.baseDir, 'violations');
        this.tempDir = path.join(this.baseDir, 'temp');
        
        // Đảm bảo thư mục tồn tại
        this.ensureDirectories();
    }

    // Tạo thư mục nếu chưa có
    ensureDirectories() {
        [this.baseDir, this.violationsDir, this.tempDir].forEach(dir => {
            if (!fsSync.existsSync(dir)) {
                fsSync.mkdirSync(dir, { recursive: true });
                console.log(`✅ Đã tạo thư mục: ${dir}`);
            }
        });
    }

    // Lấy đường dẫn thư mục theo ngày
    getVideoDir(isViolation = false) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        
        const subDir = isViolation ? 'violations' : 'temp';
        const dateDir = path.join(this.baseDir, subDir, `${year}-${month}`);
        
        // Tạo thư mục nếu chưa có
        if (!fsSync.existsSync(dateDir)) {
            fsSync.mkdirSync(dateDir, { recursive: true });
        }
        
        return dateDir;
    }

    // Lưu video
    async saveVideo(attemptId, videoBuffer, isViolation = false, violationType = '') {
        try {
            const dir = this.getVideoDir(isViolation);
            const timestamp = Date.now();
            const typePrefix = violationType ? `${violationType}_` : '';
            const filename = `attempt_${attemptId}_${typePrefix}${timestamp}.mp4`;
            const filepath = path.join(dir, filename);
            
            // Lưu file
            await fs.writeFile(filepath, videoBuffer);
            
            // Trả về đường dẫn tương đối (để lưu vào database)
            const relativePath = path.relative(
                path.join(__dirname, '../uploads'),
                filepath
            ).replace(/\\/g, '/'); // Chuyển \ thành / cho cross-platform
            
            console.log(`✅ Đã lưu video: ${relativePath}`);
            return relativePath;
        } catch (err) {
            console.error('❌ Lỗi lưu video:', err);
            throw new Error('Không thể lưu video: ' + err.message);
        }
    }

    // Lấy đường dẫn tuyệt đối từ đường dẫn tương đối
    getAbsolutePath(relativePath) {
        if (!relativePath) return null;
        
        console.log(`🔍 [VideoStorage] Input path: ${relativePath}`);
        
        // Nếu đã là đường dẫn tuyệt đối
        if (path.isAbsolute(relativePath)) {
            console.log(`   Already absolute: ${relativePath}`);
            return relativePath;
        }
        
        // Normalize slashes
        let normalizedPath = relativePath.replace(/\\/g, '/');
        
        // Nếu bắt đầu với "videos/", thêm "uploads/" vào trước
        if (normalizedPath.startsWith('videos/')) {
            normalizedPath = 'uploads/' + normalizedPath;
            console.log(`   Added 'uploads/' prefix: ${normalizedPath}`);
        }
        // Nếu không bắt đầu với "uploads/", thêm vào
        else if (!normalizedPath.startsWith('uploads/')) {
            normalizedPath = 'uploads/' + normalizedPath;
            console.log(`   Added 'uploads/' prefix: ${normalizedPath}`);
        }
        
        // Join với __dirname để tạo đường dẫn tuyệt đối
        // __dirname = server/utils, nên cần lên 1 level (..) để đến server/
        const absolutePath = path.join(__dirname, '..', normalizedPath);
        
        console.log(`   __dirname: ${__dirname}`);
        console.log(`   Normalized path: ${normalizedPath}`);
        console.log(`   Absolute path: ${absolutePath}`);
        
        // Kiểm tra file có tồn tại không
        const fsSync = require('fs');
        const exists = fsSync.existsSync(absolutePath);
        console.log(`   File exists: ${exists}`);
        
        if (exists) {
            return absolutePath;
        }
        
        // Nếu không tìm thấy, thử các đường dẫn khác
        const alternativePaths = [
            path.join(__dirname, '../../', normalizedPath), // Từ root project
            path.join(__dirname, '../', normalizedPath.replace(/^uploads\//, '')), // Bỏ uploads/ prefix
        ];
        
        // Nếu normalizedPath bắt đầu với uploads/videos/, thử từ baseDir
        if (normalizedPath.startsWith('uploads/videos/')) {
            const videoRelativePath = normalizedPath.replace(/^uploads\/videos\//, '');
            alternativePaths.push(path.join(this.baseDir, videoRelativePath));
        }
        
        for (const altPath of alternativePaths) {
            console.log(`   Trying alternative: ${altPath}`);
            if (fsSync.existsSync(altPath)) {
                console.log(`   ✅ Found at: ${altPath}`);
                return altPath;
            }
        }
        
        console.log(`   ❌ File not found in any path`);
        return absolutePath; // Trả về đường dẫn chính dù không tồn tại (để error handling)
    }

    // Kiểm tra file có tồn tại không
    async fileExists(relativePath) {
        try {
            const absolutePath = this.getAbsolutePath(relativePath);
            if (!absolutePath) return false;
            await fs.access(absolutePath);
            return true;
        } catch {
            return false;
        }
    }

    // Xóa video
    async deleteVideo(relativePath) {
        try {
            const absolutePath = this.getAbsolutePath(relativePath);
            if (!absolutePath) return false;
            
            await fs.unlink(absolutePath);
            console.log(`✅ Đã xóa video: ${relativePath}`);
            return true;
        } catch (err) {
            console.error('❌ Lỗi xóa video:', err);
            return false;
        }
    }

    // Xóa video cũ (cron job - tùy chọn)
    async cleanupOldVideos(daysOld = 30, isViolation = false) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            
            const dir = this.getVideoDir(isViolation);
            const files = await fs.readdir(dir);
            
            let deletedCount = 0;
            for (const file of files) {
                const filepath = path.join(dir, file);
                const stats = await fs.stat(filepath);
                
                if (stats.mtime < cutoffDate) {
                    await fs.unlink(filepath);
                    deletedCount++;
                }
            }
            
            console.log(`✅ Đã xóa ${deletedCount} video cũ trong ${dir}`);
            return deletedCount;
        } catch (err) {
            console.error('❌ Lỗi cleanup video:', err);
            return 0;
        }
    }

    // Lấy kích thước file
    async getFileSize(relativePath) {
        try {
            const absolutePath = this.getAbsolutePath(relativePath);
            if (!absolutePath) return 0;
            const stats = await fs.stat(absolutePath);
            return stats.size;
        } catch {
            return 0;
        }
    }
}

module.exports = new VideoStorage();

