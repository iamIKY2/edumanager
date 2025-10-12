exports.getNotifications = async (req, res) => {
  const userId = req.user.id;

  try {
    const [notifications] = await req.db.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi lấy danh sách thông báo', details: error.message });
  }
};

exports.markNotificationAsRead = async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user.id;

  try {
    const [result] = await req.db.query(
      'UPDATE notifications SET is_read = 1 WHERE notification_id = ? AND user_id = ?',
      [notificationId, userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Thông báo không tồn tại hoặc không thuộc về bạn' });
    }
    res.json({ message: 'Đánh dấu thông báo đã đọc' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi đánh dấu thông báo', details: error.message });
  }
};