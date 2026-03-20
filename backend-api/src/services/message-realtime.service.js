const redis = require('../config/redis');

const publishRedisEvent = async (channel, payload) => {
  try {
    console.log(`[Redis Publish] Channel: ${channel}, Payload:`, JSON.stringify(payload).substring(0, 200));
    await redis.publish(channel, JSON.stringify(payload));
    console.log(`[Redis Publish] Successfully published to ${channel}`);
  } catch (error) {
    console.error(`[Redis Publish] Failed to publish ${channel}:`, error);
  }
};

const publishMessageCreated = async ({ bookingId, senderUserId, receiverUserId, message }) => {
  await publishRedisEvent('message:created', {
    bookingId: String(bookingId),
    senderUserId: senderUserId != null ? String(senderUserId) : null,
    receiverUserId: receiverUserId != null ? String(receiverUserId) : null,
    message
  });
};

const publishMessageRead = async ({ bookingId, readerUserId, messageId, updatedCount }) => {
  await publishRedisEvent('message:read', {
    bookingId: String(bookingId),
    readerUserId: readerUserId != null ? String(readerUserId) : null,
    messageId: messageId != null ? String(messageId) : null,
    updatedCount: Number(updatedCount || 0),
    seenAt: new Date().toISOString()
  });
};

module.exports = {
  publishMessageCreated,
  publishMessageRead
};
