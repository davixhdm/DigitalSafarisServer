import { getIO } from "../config/socket.js";
import logger from "../utils/logger.js";

const joinRoom = (socket, room) => socket.join(room);
const leaveRoom = (socket, room) => socket.leave(room);

const emitToRoom = (room, event, payload) => {
  try {
    const io = getIO();
    io.to(room).emit(event, payload);
  } catch (err) {
    logger.error("emitToRoom failed", { error: err.message });
  }
};

const emitToUser = (userId, event, payload) => {
  emitToRoom(`user:${userId}`, event, payload);
};

const emitToCustomer = (customerId, event, payload) => {
  emitToRoom(`customer:${customerId}`, event, payload);
};

const emitToRestaurant = (restaurantId, event, payload) => {
  emitToRoom(`restaurant:${restaurantId}`, event, payload);
};

const emitToTransport = (transportId, event, payload) => {
  emitToRoom(`transport:${transportId}`, event, payload);
};

const emitToAccommodation = (accommodationId, event, payload) => {
  emitToRoom(`accommodation:${accommodationId}`, event, payload);
};

const emitToAdmin = (event, payload) => {
  emitToRoom("admin", event, payload);
};

const broadcastDeliveryJob = (job) => {
  emitToRoom("transport:available", "delivery:new", job);
};

const broadcastFoodRequest = (request, restaurantIds) => {
  for (const id of restaurantIds) {
    emitToRoom(`restaurant:${id}`, "broadcast:new", request);
  }
};

const cancelBroadcast = (reference, restaurantIds) => {
  for (const id of restaurantIds) {
    emitToRoom(`restaurant:${id}`, "broadcast:cancel", { reference });
  }
};

const lockBroadcast = (reference, restaurantIds, acceptedBy) => {
  for (const id of restaurantIds) {
    emitToRoom(`restaurant:${id}`, "broadcast:locked", { reference, acceptedBy });
  }
};

export {
  joinRoom,
  leaveRoom,
  emitToRoom,
  emitToUser,
  emitToCustomer,
  emitToRestaurant,
  emitToTransport,
  emitToAccommodation,
  emitToAdmin,
  broadcastDeliveryJob,
  broadcastFoodRequest,
  cancelBroadcast,
  lockBroadcast,
};