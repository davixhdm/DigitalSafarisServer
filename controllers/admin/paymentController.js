import CustomerPayment from "../../models/customer/CustomerPayment.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const list = asyncHandler(async (req, res) => {
  const { status, method, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (method) filter.method = method;

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    CustomerPayment.find(filter)
      .populate("customer", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    CustomerPayment.countDocuments(filter),
  ]);

  const data = items.map((p) => ({
    _id: p._id,
    reference: p.reference,
    customerId: p.customer?._id ?? null,
    customerName: p.customer
      ? `${p.customer.firstName} ${p.customer.lastName}`
      : "—",
    method: p.method,
    status: p.status,
    amount: p.amount,
    currency: p.currency ?? "KES",
    serviceType: p.purpose,
    relatedId: p.relatedId,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));

  res.status(200).json(
    new ApiResponse(200, {
      items: data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.max(1, Math.ceil(total / Number(limit))),
    })
  );
});

const details = asyncHandler(async (req, res) => {
  const p = await CustomerPayment.findById(req.params.id)
    .populate("customer", "firstName lastName email phone")
    .lean();

  if (!p) throw new ApiError(404, "Payment not found");

  const payment = {
    _id: p._id,
    reference: p.reference,
    customerId: p.customer?._id ?? null,
    customerName: p.customer
      ? `${p.customer.firstName} ${p.customer.lastName}`
      : "—",
    method: p.method,
    status: p.status,
    amount: p.amount,
    currency: p.currency ?? "KES",
    serviceType: p.purpose,
    relatedId: p.relatedId,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };

  res.status(200).json(new ApiResponse(200, { payment }));
});

export { list, details };