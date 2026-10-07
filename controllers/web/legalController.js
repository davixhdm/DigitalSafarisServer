import Legal from "../../models/admin/Legal.js";
import asyncHandler from "../../utils/asyncHandler.js";

const TYPE_MAP = {
  "privacy-policy": "privacy",
  "terms-of-service": "terms",
  privacy: "privacy",
  terms: "terms",
  cookies: "cookies",
};

const getLegal = asyncHandler(async (req, res) => {
  const key = TYPE_MAP[req.params.type];
  if (!key) {
    return res.status(404).json({ message: "Legal document not found" });
  }

  const document = await Legal.findOne({ type: key, status: "active" })
    .select("type title content updatedAt")
    .lean();

  if (!document) {
    return res.status(404).json({ message: "Legal document not found" });
  }

  res.status(200).json({
    document: {
      title: document.title,
      content: document.content,
      updatedAt: document.updatedAt,
    },
  });
});

export { getLegal };