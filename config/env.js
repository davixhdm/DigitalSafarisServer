import dotenv from "dotenv";
dotenv.config();

const splitList = (value) =>
  String(value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  appName: process.env.APP_NAME || "Digital Safaris",
  apiUrl: process.env.API_URL,
  clientUrl: process.env.CLIENT_URL,
  adminUrl: process.env.ADMIN_URL,
  partnerUrl: process.env.PARTNER_URL,
  websiteUrl: process.env.WEBSITE_URL,

  corsOrigins: splitList(process.env.CORS_ORIGINS),

  mongodbUri: process.env.MONGODB_URI,

  redisEnabled: process.env.REDIS_ENABLED === "true",
  redisUrl: process.env.REDIS_URL,

  jwtSecret: process.env.JWT_SECRET,
  jwtExpires: process.env.JWT_EXPIRES,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES,

  storageProvider: process.env.STORAGE_PROVIDER || "local",
  localStoragePath: process.env.LOCAL_UPLOAD_PATH,
  localStorageUrl: process.env.LOCAL_UPLOAD_URL,

  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,

  mpesaEnv: process.env.MPESA_ENV,
  mpesaBaseUrl: process.env.MPESA_BASE_URL,
  mpesaConsumerKey: process.env.MPESA_CONSUMER_KEY,
  mpesaConsumerSecret: process.env.MPESA_CONSUMER_SECRET,
  mpesaShortcode: process.env.MPESA_SHORTCODE,
  mpesaTillNumber: process.env.MPESA_TILL_NUMBER,
  mpesaPasskey: process.env.MPESA_PASSKEY,
  mpesaTransactionType: process.env.MPESA_TRANSACTION_TYPE,
  mpesaCallbackUrl: process.env.MPESA_CALLBACK_URL,
  mpesaB2cInitiatorName: process.env.MPESA_B2C_INITIATOR_NAME,
  mpesaB2cSecurityCredential: process.env.MPESA_B2C_SECURITY_CREDENTIAL,
  mpesaB2cCommandId: process.env.MPESA_B2C_COMMAND_ID,
  mpesaB2cResultUrl: process.env.MPESA_B2C_RESULT_URL,
  mpesaB2cTimeoutUrl: process.env.MPESA_B2C_TIMEOUT_URL,

  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  stripeCurrency: process.env.STRIPE_CURRENCY,

  emailProvider: process.env.EMAIL_PROVIDER || "hdm",
  brevoApiKey: process.env.BREVO_API_KEY,
  brevoSenderEmail: process.env.BREVO_SENDER_EMAIL,
  brevoSenderName: process.env.BREVO_SENDER_NAME,

  smsEnabled: process.env.SMS_ENABLED === "true",
  smsProvider: process.env.SMS_PROVIDER || "hdm",
  africasTalkingUsername: process.env.AFRICASTALKING_USERNAME,
  africasTalkingApiKey: process.env.AFRICASTALKING_API_KEY,
  africasTalkingSenderId: process.env.AFRICASTALKING_SENDER_ID,

  hdmApiKey: process.env.HDM_API_KEY,
  hdmApiUrl: process.env.HDM_API_URL,
  hdmFromEmail: process.env.HDM_FROM_EMAIL,
  hdmFromName: process.env.HDM_FROM_NAME,
  hdmSmsSender: process.env.HDM_SMS_SENDER,
  hdmSmsType: process.env.HDM_SMS_TYPE,

  hdmAiApiKey: process.env.HDM_AI_API_KEY,
  hdmAiApiUrl: process.env.HDM_AI_API_URL,
  hdmAiModel: process.env.HDM_AI_MODEL,

  firebaseEnabled: process.env.FIREBASE_ENABLED === "true",
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY,
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  firebaseDatabaseUrl: process.env.FIREBASE_DATABASE_URL,

  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX) || 100,

  keepAliveEnabled: process.env.KEEP_ALIVE_ENABLED === "true",
};