import * as aiService from "../../services/aiService.js";
import * as cacheService from "../../services/cacheService.js";
import RestaurantPartner from "../../models/rest/RestaurantPartner.js";
import AccommodationPartner from "../../models/accom/AccommodationPartner.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const CACHE_TTL = 300;

const buildSystemPrompt = (town, context) => {
  const parts = [
    "You are the Digital Safaris concierge.",
    "You help customers with accommodation, food, transport, and general travel queries.",
    "Be concise, friendly, and helpful.",
    "",
    "CRITICAL RULES:",
    "- Only mention restaurants, accommodations, or transport that appear in the PARTNER DATA section below.",
    "- Do NOT invent partner names, do NOT reference partners from outside this list, and do NOT use your general knowledge of businesses in this region.",
    "- If no partners are listed, say so clearly and suggest the customer browse the app or try a different town.",
    "- You may give general travel advice (best time to visit, packing tips, cultural notes) as long as it does not name specific businesses.",
  ];

  if (town) parts.push("", `Customer location: ${town}`);

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
    parts.push("", "PARTNER DATA — Restaurants: none on file for this location.");
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
    parts.push("", "PARTNER DATA — Accommodations: none on file for this location.");
  }

  return parts.join("\n");
};

const loadContext = async (town) => {
  if (!town) return { restaurants: [], accommodations: [] };

  const cacheKey = `ai:context:${town.toLowerCase()}`;
  const cached = await cacheService.getCache(cacheKey);
  if (cached) return cached;

  const [restaurants, accommodations] = await Promise.all([
    RestaurantPartner.find({
      status: "active",
      isDeleted: false,
      town: new RegExp(town, "i"),
    })
      .select("name town cuisineTypes")
      .limit(15)
      .lean(),
    AccommodationPartner.find({
      status: "active",
      isDeleted: false,
      town: new RegExp(town, "i"),
    })
      .select("name town type")
      .limit(15)
      .lean(),
  ]);

  const context = { restaurants, accommodations };
  await cacheService.setCache(cacheKey, context, CACHE_TTL);
  return context;
};

const chat = asyncHandler(async (req, res) => {
  const { message, town, temperature, maxTokens } = req.body;
  if (!message) throw new ApiError(400, "Message required");

  const context = await loadContext(town);
  const systemPrompt = buildSystemPrompt(town, context);

  const result = await aiService.chat({ message, systemPrompt, temperature, maxTokens });
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