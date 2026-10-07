import Contact from "../../models/admin/Contact.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const list = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { name: new RegExp(search, "i") },
      { email: new RegExp(search, "i") },
      { subject: new RegExp(search, "i") },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Contact.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Contact.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      items,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.max(1, Math.ceil(total / Number(limit))),
    })
  );
});

const details = asyncHandler(async (req, res) => {
  const contact = await Contact.findById(req.params.id).lean();
  if (!contact) throw new ApiError(404, "Contact not found");
  res.status(200).json(new ApiResponse(200, { contact }));
});

const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["new", "in_progress", "resolved"].includes(status)) {
    throw new ApiError(400, "Invalid status");
  }

  const contact = await Contact.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        status,
        ...(status === "resolved"
          ? { repliedBy: req.admin._id, repliedAt: new Date() }
          : {}),
      },
    },
    { new: true }
  );

  if (!contact) throw new ApiError(404, "Contact not found");
  res.status(200).json(new ApiResponse(200, contact, "Status updated"));
});

const remove = asyncHandler(async (req, res) => {
  const contact = await Contact.findByIdAndDelete(req.params.id);
  if (!contact) throw new ApiError(404, "Contact not found");
  res.status(200).json(new ApiResponse(200, null, "Contact deleted"));
});

const create = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  const contact = await Contact.create({
    name,
    email,
    phone: phone || null,
    subject,
    message,
  });
  res.status(201).json(new ApiResponse(201, contact, "Message received"));
});

export { list, details, updateStatus, remove, create };