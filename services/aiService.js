import hdmAi from "../config/hdmAi.js";
import { env } from "../config/env.js";
import logger from "../utils/logger.js";

const chat = async ({ message, systemPrompt, temperature, maxTokens }) => {
  try {
    const payload = { message, system_prompt: systemPrompt };
    if (typeof temperature === "number") payload.temperature = temperature;
    if (typeof maxTokens === "number") payload.max_tokens = maxTokens;

    const { data } = await hdmAi.post("/completion", payload);

    if (!data?.success) {
      return { success: false, error: data?.error || "AI request failed" };
    }

    return {
      success: true,
      reply: data.data.reply,
      model: data.data.model || env.hdmAiModel,
      tokensUsed: data.data.tokens_used,
      provider: data.data.provider,
    };
  } catch (err) {
    logger.error("AI chat failed", { error: err.response?.data || err.message });
    return { success: false, error: err.response?.data || err.message };
  }
};

export { chat };