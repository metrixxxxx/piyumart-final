import { db } from "@/lib/db";

export async function notify({ userId, type, message }) {
  const [result] = await db.query(
    "INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)",
    [userId, type, message]
  );

  if (global.io) {
    global.io.to(`user_${userId}`).emit("notification:new", {
      id: result.insertId,
      type,
      message,
      is_read: 0,
      created_at: new Date(),
    });
  }
}