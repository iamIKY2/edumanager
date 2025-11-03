// server/routes/shared/helpers.js
const createNotification = async (db, io, userId, content, type, relatedId, relatedType) => {
  try {
    console.log('🔵 [Notification] Creating notification for user:', userId);
    console.log('🔵 [Notification] Content:', content);
    
    const [result] = await db.query(
      'INSERT INTO notifications (user_id, content, type, related_id, related_type) VALUES (?, ?, ?, ?, ?)',
      [userId, content, type, relatedId, relatedType]
    );
    
    const notificationData = {
      notification_id: result.insertId,
      content,
      type,
      related_id: relatedId,
      related_type: relatedType,
      created_at: new Date().toISOString(),
      is_read: 0
    };
    
    const roomId = `user_${userId}`;
    console.log('🔵 [Notification] Emitting to room:', roomId);
    console.log('🔵 [Notification] Data:', notificationData);
    
    io.to(roomId).emit('notification', notificationData);
    
    // Log số lượng sockets trong room (cần await vì fetchSockets là async)
    const socketsInRoom = await io.in(roomId).fetchSockets();
    console.log(`📊 [Notification] Sockets in room ${roomId}:`, socketsInRoom.length);
    
    if (socketsInRoom.length === 0) {
      console.warn(`⚠️ [Notification] No sockets found in room ${roomId}! User might not be connected.`);
    }
    
    console.log('✅ [Notification] Notification created and emitted');
  } catch (error) {
    console.error('❌ [Notification] Lỗi tạo thông báo:', error);
    console.error('❌ [Notification] Error stack:', error.stack);
  }
};

module.exports = { createNotification };