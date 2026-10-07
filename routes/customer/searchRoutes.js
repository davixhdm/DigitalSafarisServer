import { Router } from "express";
import {
  restaurants,
  accommodations,
  properties,
  rooms,
  menuItems,
  locations,
  global,
} from "../../controllers/customer/searchController.js";

const router = Router();

router.get("/restaurants", restaurants);
router.get("/accommodations", accommodations);
router.get("/properties", properties);
router.get("/rooms", rooms);
router.get("/menu-items", menuItems);
router.get("/locations", locations);
router.get("/global", global);

export default router;