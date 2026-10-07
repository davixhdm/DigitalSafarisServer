import CustomerAddress from "../../models/customer/CustomerAddress.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const list = asyncHandler(async (req, res) => {
  const items = await CustomerAddress.find({ customer: req.customer._id }).sort({ createdAt: -1 }).lean();
  res.status(200).json(new ApiResponse(200, items));
});

const create = asyncHandler(async (req, res) => {
  const { isDefault } = req.body;

  if (isDefault) {
    await CustomerAddress.updateMany({ customer: req.customer._id }, { $set: { isDefault: false } });
  }

  const address = await CustomerAddress.create({
    ...req.body,
    customer: req.customer._id,
  });

  res.status(201).json(new ApiResponse(201, address, "Address created"));
});

const update = asyncHandler(async (req, res) => {
  const address = await CustomerAddress.findOne({ _id: req.params.id, customer: req.customer._id });
  if (!address) throw new ApiError(404, "Address not found");

  if (req.body.isDefault) {
    await CustomerAddress.updateMany({ customer: req.customer._id }, { $set: { isDefault: false } });
  }

  Object.assign(address, req.body);
  await address.save();

  res.status(200).json(new ApiResponse(200, address, "Address updated"));
});

const remove = asyncHandler(async (req, res) => {
  const address = await CustomerAddress.findOneAndDelete({ _id: req.params.id, customer: req.customer._id });
  if (!address) throw new ApiError(404, "Address not found");
  res.status(200).json(new ApiResponse(200, null, "Address deleted"));
});

const setDefault = asyncHandler(async (req, res) => {
  await CustomerAddress.updateMany({ customer: req.customer._id }, { $set: { isDefault: false } });
  const address = await CustomerAddress.findOneAndUpdate(
    { _id: req.params.id, customer: req.customer._id },
    { $set: { isDefault: true } },
    { new: true }
  );
  if (!address) throw new ApiError(404, "Address not found");
  res.status(200).json(new ApiResponse(200, address, "Default address set"));
});

export { list, create, update, remove, setDefault };