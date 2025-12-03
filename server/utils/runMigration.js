// utils/runMigration.js - Chạy migration SQL
const fs = require('fs').promises;
const path = require('path');
const pool = require('../config/database');

async function runMigration(filePath) {
    try {
        console.log(`📄 Đang chạy migration: ${filePath}`);
        
        const sql = await fs.readFile(filePath, 'utf-8');
        
        // Tách các câu lệnh SQL (phân cách bởi ;)
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));
        
        const connection = await pool.getConnection();
        
        try {
            for (const statement of statements) {
                if (statement.trim()) {
                    console.log(`   Executing: ${statement.substring(0, 50)}...`);
                    await connection.query(statement);
                }
            }
            
            console.log('✅ Migration chạy thành công!');
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('❌ Lỗi khi chạy migration:', error);
        throw error;
    }
}

// Nếu chạy trực tiếp
if (require.main === module) {
    const migrationFile = process.argv[2];
    if (!migrationFile) {
        console.error('❌ Vui lòng chỉ định file migration');
        console.log('Usage: node runMigration.js <migration_file.sql>');
        process.exit(1);
    }
    
    runMigration(migrationFile)
        .then(() => {
            console.log('✅ Hoàn tất!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Lỗi:', error);
            process.exit(1);
        });
}

module.exports = runMigration;













