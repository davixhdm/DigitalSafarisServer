import { Router } from "express";
import express from "express";
import {
  mpesaB2cResult,
  mpesaB2cTimeout,
  mpesaC2b,
  mpesaReversal,
  stripe,
  hdmBridge,
  firebase,
} from "../../controllers/public/webhookController.js";

const router = Router();

router.post("/mpesa/b2c", mpesaB2cResult);
router.post("/mpesa/b2c/timeout", mpesaB2cTimeout);
router.post("/mpesa/c2b", mpesaC2b);
router.post("/mpesa/reversal", mpesaReversal);

router.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    req.rawBody = req.body;
    next();
  },
  stripe
);

router.post("/hdm-bridge", hdmBridge);
router.post("/firebase", firebase);

export default router;