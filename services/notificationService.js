import { getFirebase } from "../config/firebase.js";
import { getIO } from "../config/socket.js";
import CustomerNotification from "../models/customer/CustomerNotification.js";
import logger from "../utils/logger.js";

const saveInApp = async ({ recipient, recipientType, title, body, type, relatedId, data }) => {
  if (recipientType === "customer") {
    return CustomerNotification.create({
      customer: recipient,
      title,
      body,
      type,
      channel: "in_app",
      relatedId,
      data,
    });
  }
  return null;
};

const sendPush = async ({ tokens, title, body, data }) => {
  const app = getFirebase();
  if (!app || !tokens?.length) return { skipped: true };

  try {
    const response = await app.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: data || {},
    });
    return { success: true, response };
  } catch (err) {
    logger.error("Push notification failed", { error: err.message });
    return { success: false, error: err.message };
  }
};

const emitSocket = ({ room, event, payload }) => {
  try {
    const io = getIO();
    io.to(room).emit(event, payload);
  } catch (err) {
    logger.error("Socket emit failed", { error: err.message });
  }
};

const notify = async ({
  recipient,
  recipientType,
  title,
  body,
  type,
  relatedId = null,
  data = {},
  fcmTokens = [],
  socketRoom = null,
  socketEvent = null,
}) => {
  const tasks = [];

  tasks.push(
    saveInApp({ recipient, recipientType, title, body, type, relatedId, data })
  );

  if (fcmTokens.length > 0) {
    tasks.push(sendPush({ tokens: fcmTokens, title, body, data }));
  }

  if (socketRoom && socketEvent) {
    emitSocket({ room: socketRoom, event: socketEvent, payload: { title, body, data } });
  }

  await Promise.allSettled(tasks);
};

export { notify, sendPush, emitSocket, saveInApp };