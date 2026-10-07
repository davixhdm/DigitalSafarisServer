import * as aiService from "../../services/aiService.js";
import * as cacheService from "../../services/cacheService.js";
import RestaurantPartner from "../../models/rest/RestaurantPartner.js";
import AccommodationPartner from "../../models/accom/AccommodationPartner.js";
import Branding from "../../models/admin/Branding.js";
import SystemSetting from "../../models/admin/SystemSetting.js";
import asyncHandler from "../../utils/asyncHandler.js";
import logger from "../../utils/logger.js";

const CACHE_TTL = 300;

const buildSystemPrompt = (context) => {
  const parts = [
    "You are the DigitalSafaris concierge on the public marketing website.",
    "You help visitors understand the platform, its services, and how to get started.",
    "Be concise, friendly, and helpful.",
    "",
    "CRITICAL RULES:",
    "- Only mention restaurants or accommodations that appear in the PARTNER DATA below.",
    "- Do NOT invent partner names.",
    "- If no partner data is listed, answer generally about DigitalSafaris services without naming businesses.",
    "- Keep answers short: 2 to 4 sentences maximum.",
  ];

  if (context.restaurants?.length) {
    parts.push(
      "",
      "PARTNER DATA — Restaurants:",
      ...context.restaurants.map((r) => `- ${r.name} (${r.town})`)
    );
  }

  if (context.accommodations?.length) {
    parts.push(
      "",
      "PARTNER DATA — Accommodations:",
      ...context.accommodations.map((a) => `- ${a.name} (${a.town})`)
    );
  }

  return parts.join("\n");
};

const loadContext = async () => {
  const cacheKey = "web:ai:context";
  const cached = await cacheService.getCache(cacheKey);
  if (cached) return cached;

  const [restaurants, accommodations] = await Promise.all([
    RestaurantPartner.find({ status: "active", isDeleted: false })
      .select("name town")
      .limit(15)
      .lean(),
    AccommodationPartner.find({ status: "active", isDeleted: false })
      .select("name town")
      .limit(15)
      .lean(),
  ]);

  const context = { restaurants, accommodations };
  await cacheService.setCache(cacheKey, context, CACHE_TTL);
  return context;
};

const chat = asyncHandler(async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ reply: "Please send a message." });
  }

  const branding = (await Branding.findOne().lean()) || {};
  const general = await SystemSetting.findOne({ key: "general" }).lean();
  const settings = general?.value || {};

  const context = await loadContext();
  const systemPrompt = buildSystemPrompt(context);

  const result = await aiService.chat({
    message,
    systemPrompt,
    temperature: 0.6,
    maxTokens: 400,
  });

  if (!result.success) {
    logger.error("Web AI chat failed", { error: result.error });
    return res.status(200).json({
      reply:
        "Sorry, our concierge is unavailable right now. Please try again shortly.",
      provider: "fallback",
    });
  }

  res.status(200).json({
    reply: result.reply,
    model: result.model,
    provider: result.provider,
    brand: branding?.metaTitle || settings.appName || "Digital Safaris",
  });
});

export { chat };