import CustomerNotification from "../../models/customer/CustomerNotification.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const list = asyncHandler(async (req, res) => {
  const { isRead, type, page = 1, limit = 20 } = req.query;
  const filter = { customer: req.customer._id };
  if (isRead !== undefined) filter.isRead = isRead === "true";
  if (type) filter.type = type;

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    CustomerNotification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    CustomerNotification.countDocuments(filter),
  ]);

  res.status(200).json(new ApiResponse(200, { items, total, page: Number(page), limit: Number(limit) }));
});

const unreadCount = asyncHandler(async (req, res) => {
  const count = await CustomerNotification.countDocuments({ customer: req.customer._id, isRead: false });
  res.status(200).json(new ApiResponse(200, { count }));
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await CustomerNotification.findOneAndUpdate(
    { _id: req.params.id, customer: req.customer._id },
    { $set: { isRead: true, readAt: new Date() } },
    { new: true }
  );
  if (!notification) throw new ApiError(404, "Notification not found");
  res.status(200).json(new ApiResponse(200, notification, "Marked as read"));
});

const markAllRead = asyncHandler(async (req, res) => {
  await CustomerNotification.updateMany(
    { customer: req.customer._id, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
  res.status(200).json(new ApiResponse(200, null, "All marked as read"));
});

const remove = asyncHandler(async (req, res) => {
  const notification = await CustomerNotification.findOneAndDelete({
    _id: req.params.id,
    customer: req.customer._id,
  });
  if (!notification) throw new ApiError(404, "Notification not found");
  res.status(200).json(new ApiResponse(200, null, "Notification deleted"));
});

export { list, unreadCount, markRead, markAllRead, remove };