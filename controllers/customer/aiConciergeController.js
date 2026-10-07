import * as aiService from "../../services/aiService.js";
import * as cacheService from "../../services/cacheService.js";
import RestaurantPartner from "../../models/rest/RestaurantPartner.js";
import AccommodationPartner from "../../models/accom/AccommodationPartner.js";
import Location from "../../models/admin/Location.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const CACHE_TTL = 300;

const buildSystemPrompt = (customer, context) => {
  const parts = [
    "You are the Digital Safaris concierge.",
    "You help customers with accommodation, food, transport, and general travel queries.",
    "Be concise, friendly, and helpful. Reply in 2 to 4 sentences.",
    "",
    "CRITICAL RULES:",
    "- Only mention restaurants, accommodations, or locations that appear in the DATA section below.",
    "- Do NOT invent partner names or towns that are not listed.",
    "- For questions about where Digital Safaris operates, list ONLY the towns in the OPERATIONAL LOCATIONS section.",
    "- If a customer asks about a town that is not listed, say you don't have partners there yet.",
    "- You may give general travel advice (best time to visit, packing tips, cultural notes) as long as it does not name specific businesses.",
    "",
    `Customer name: ${customer.firstName}.`,
  ];

  if (customer.town) parts.push(`Customer town: ${customer.town}.`);

  if (context?.locations?.length) {
    parts.push(
      "",
      "OPERATIONAL LOCATIONS (towns Digital Safaris currently serves):",
      ...context.locations.map(
        (l) => `- ${l.name}${l.county ? ` (${l.county})` : ""}`
      )
    );
  } else {
    parts.push("", "OPERATIONAL LOCATIONS: none on file.");
  }

  if (context?.restaurants?.length) {
    parts.push(
      "",
      "PARTNER DATA — Restaurants:",
      ...context.restaurants.map(
        (r) =>
          `- ${r.name} (${r.town})${r.cuisineTypes?.length ? ` — ${r.cuisineTypes.join(", ")}` : ""}`
      )
    );
  } else {
    parts.push("", "PARTNER DATA — Restaurants: none on file.");
  }

  if (context?.accommodations?.length) {
    parts.push(
      "",
      "PARTNER DATA — Accommodations:",
      ...context.accommodations.map(
        (a) => `- ${a.name} (${a.town})${a.type ? ` — ${a.type}` : ""}`
      )
    );
  } else {
    parts.push("", "PARTNER DATA — Accommodations: none on file.");
  }

  return parts.join("\n");
};

const loadContext = async (town) => {
  const cacheKey = `ai:context:v2:${town ? town.toLowerCase() : "all"}`;
  const cached = await cacheService.getCache(cacheKey);
  if (cached) return cached;

  const locationFilter = { isOperational: true, type: { $in: ["town", "city", "area"] } };

  const [locations, restaurants, accommodations] = await Promise.all([
    Location.find(locationFilter)
      .select("name county type")
      .sort({ name: 1 })
      .lean(),
    town
      ? RestaurantPartner.find({
          status: "active",
          isDeleted: false,
          town: new RegExp(town, "i"),
        })
          .select("name town cuisineTypes")
          .limit(15)
          .lean()
      : [],
    town
      ? AccommodationPartner.find({
          status: "active",
          isDeleted: false,
          town: new RegExp(town, "i"),
        })
          .select("name town type")
          .limit(15)
          .lean()
      : [],
  ]);

  const context = { locations, restaurants, accommodations };
  await cacheService.setCache(cacheKey, context, CACHE_TTL);
  return context;
};

const chat = asyncHandler(async (req, res) => {
  const { message, temperature, maxTokens } = req.body;
  if (!message) throw new ApiError(400, "Message required");

  const context = await loadContext(req.customer.town);
  const systemPrompt = buildSystemPrompt(req.customer, context);

  const result = await aiService.chat({
    message,
    systemPrompt,
    temperature,
    maxTokens,
  });
  if (!result.success) throw new ApiError(502, result.error || "AI service failed");

  res.status(200).json(
    new ApiResponse(200, {
      reply: result.reply,
      model: result.model,
      tokensUsed: result.tokensUsed,
      provider: result.provider,
    })
  );
});

export { chat };