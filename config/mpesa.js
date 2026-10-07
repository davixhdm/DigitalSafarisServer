import { env } from "./env.js";

const mpesaConfig = {
  env: env.mpesaEnv,
  baseUrl: env.mpesaBaseUrl,
  consumerKey: env.mpesaConsumerKey,
  consumerSecret: env.mpesaConsumerSecret,
  shortCode: env.mpesaShortcode,
  tillNumber: env.mpesaTillNumber,
  passkey: env.mpesaPasskey,
  transactionType: env.mpesaTransactionType,
  callbackUrl: env.mpesaCallbackUrl,
  b2c: {
    initiatorName: env.mpesaB2cInitiatorName,
    securityCredential: env.mpesaB2cSecurityCredential,
    commandId: env.mpesaB2cCommandId,
    resultUrl: env.mpesaB2cResultUrl,
    timeoutUrl: env.mpesaB2cTimeoutUrl,
  },
};

export default mpesaConfig;