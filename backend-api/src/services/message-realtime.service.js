const redis = require('../config/redis');

const publishRedisEvent = async (channel, payload) => {
  try {
    await redis.publish(channel, JSON.stringify(payload));
  } catch (error) {
    console.error(`Failed to publish ${channel}:`, error);
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
