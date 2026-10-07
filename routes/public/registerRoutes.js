import { Router } from "express";
import {
  registerCustomer,
  registerRestaurant,
  registerTransport,
  registerAccommodation,
  verifyEmail,
  resendVerification,
  loginCustomer,
  forgotPassword,
  resetPassword,
  sendPhoneOTP,
  verifyPhone,
} from "../../controllers/public/registerController.js";

const router = Router();

router.post("/customer", registerCustomer);
router.post("/restaurant", registerRestaurant);
router.post("/transport", registerTransport);
router.post("/accommodation", registerAccommodation);

router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/login", loginCustomer);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/send-phone-otp", sendPhoneOTP);
router.post("/verify-phone", verifyPhone);

export default router;