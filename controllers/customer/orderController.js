import FoodOrder from "../../models/rest/FoodOrder.js";
import RestaurantPartner from "../../models/rest/RestaurantPartner.js";
import MenuItem from "../../models/rest/MenuItem.js";
import CustomerWallet from "../../models/customer/CustomerWallet.js";
import CustomerPayment from "../../models/customer/CustomerPayment.js";
import SystemSetting from "../../models/admin/SystemSetting.js";
import Branding from "../../models/admin/Branding.js";
import { generateRef } from "../../utils/helpers.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as emailService from "../../services/emailService.js";
import * as smsService from "../../services/smsService.js";
import * as socketService from "../../services/socketService.js";

const getContext = async () => {
  const branding = (await Branding.findOne().lean()) || {};
  const general = await SystemSetting.findOne({ key: "general" }).lean();
  const commission = await SystemSetting.findOne({ key: "commission" }).lean();
  return {
    branding,
    settings: general?.value || {},
    commission: commission?.value || { food: 10 },
  };
};

const create = asyncHandler(async (req, res) => {
  const { restaurantId, items, type, deliveryAddress, paymentMethod, notes } = req.body;

  const restaurant = await RestaurantPartner.findById(restaurantId);
  if (!restaurant) throw new ApiError(404, "Restaurant not found");
  if (restaurant.status !== "active") throw new ApiError(400, "Restaurant not available");
  if (!restaurant.isAcceptingOrders) throw new ApiError(400, "Restaurant not accepting orders");

  const menuItemIds = items.map((i) => i.menuItem);
  const menuItems = await MenuItem.find({ _id: { $in: menuItemIds }, restaurant: restaurantId });

  if (menuItems.length !== menuItemIds.length) throw new ApiError(400, "One or more items invalid");

  const builtItems = items.map((i) => {
    const mi = menuItems.find((m) => m._id.toString() === i.menuItem);
    const price = mi.discountPrice ?? mi.price;
    return {
      menuItem: mi._id,
      name: mi.name,
      price,
      quantity: i.quantity,
      subtotal: price * i.quantity,
      notes: i.notes || null,
    };
  });

  const subtotal = builtItems.reduce((s, i) => s + i.subtotal, 0);
  if (subtotal < restaurant.minimumOrder) throw new ApiError(400, `Minimum order KES ${restaurant.minimumOrder}`);

  const deliveryFee = type === "delivery" ? restaurant.deliveryFee : 0;
  const total = subtotal + deliveryFee;

  const { commission } = await getContext();
  const commissionRate = commission.food || 10;
  const commissionAmount = (subtotal * commissionRate) / 100;

  const order = await FoodOrder.create({
    reference: generateRef("ORD"),
    customer: req.customer._id,
    restaurant: restaurantId,
    type,
    items: builtItems,
    subtotal,
    deliveryFee,
    total,
    currency: "KES",
    commissionRate,
    commissionAmount,
    restaurantEarnings: subtotal - commissionAmount,
    paymentMethod,
    deliveryAddress: type === "delivery" ? deliveryAddress : null,
    customerNotes: notes || null,
    status: "pending",
    paymentStatus: "pending",
    orderType: "direct",
  });

  if (paymentMethod === "wallet") {
    const wallet = await CustomerWallet.findOne({ customer: req.customer._id });
    if (!wallet) throw new ApiError(404, "Wallet not found");
    if (wallet.balance < total) throw new ApiError(400, "Insufficient wallet balance");

    wallet.balance -= total;
    wallet.totalDebited += total;
    await wallet.save();

    await CustomerPayment.create({
      customer: req.customer._id,
      reference: generateRef("PAY"),
      method: "wallet",
      purpose: "food_order",
      relatedId: order._id,
      amount: total,
      status: "success",
    });

    order.paymentStatus = "paid";
    await order.save();
  }

  socketService.emitToRestaurant(restaurantId, "order:new", {
    reference: order.reference,
    total: order.total,
    items: order.items.length,
  });

  const { branding, settings } = await getContext();
  await emailService.orderConfirmation(req.customer, { order, branding, settings });
  await smsService.orderConfirmation(req.customer, { reference: order.reference, total: `KES ${order.total}` });

  res.status(201).json(new ApiResponse(201, order, "Order placed"));
});

const list = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = { customer: req.customer._id };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    FoodOrder.find(filter)
      .populate("restaurant", "name logo town address")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    FoodOrder.countDocuments(filter),
  ]);

  res.status(200).json(new ApiResponse(200, { items, total, page: Number(page), limit: Number(limit) }));
});

const details = asyncHandler(async (req, res) => {
  const order = await FoodOrder.findOne({ _id: req.params.id, customer: req.customer._id })
    .populate("restaurant")
    .populate("deliveryJob");
  if (!order) throw new ApiError(404, "Order not found");
  res.status(200).json(new ApiResponse(200, order));
});

const cancel = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const order = await FoodOrder.findOne({ _id: req.params.id, customer: req.customer._id });
  if (!order) throw new ApiError(404, "Order not found");
  if (!["pending", "accepted"].includes(order.status)) throw new ApiError(400, "Cannot cancel at this stage");

  order.status = "cancelled";
  order.cancelledAt = new Date();
  order.cancelledBy = "customer";
  order.cancellationReason = reason || "Customer requested";
  await order.save();

  socketService.emitToRestaurant(order.restaurant.toString(), "order:cancelled", {
    reference: order.reference,
  });

  const { branding, settings } = await getContext();
  await emailService.orderCancelled(req.customer, { order, reason, branding, settings });
  await smsService.orderCancelled(req.customer, { reference: order.reference, reason });

  res.status(200).json(new ApiResponse(200, order, "Order cancelled"));
});

const reorder = asyncHandler(async (req, res) => {
  const original = await FoodOrder.findOne({ _id: req.params.id, customer: req.customer._id });
  if (!original) throw new ApiError(404, "Order not found");

  req.body = {
    restaurantId: original.restaurant,
    items: original.items.map((i) => ({ menuItem: i.menuItem, quantity: i.quantity, notes: i.notes })),
    type: original.type,
    deliveryAddress: original.deliveryAddress,
    paymentMethod: original.paymentMethod,
    notes: original.customerNotes,
  };

  return create(req, res);
});

export { create, list, details, cancel, reorder };