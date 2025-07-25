import { Router } from "express";
import {
  login,
  register,
  getProfile,
  refreshToken,
  changePassword
} from "../controllers/auth.controller.js";
import { auth } from "../middlewares/auth.js"; // asegúrate del path
const router = Router();
router.post("/login", login);
router.post("/register", register);
router.get("/profile", auth, getProfile);
router.post("/refresh-token", auth, refreshToken);
router.post("/change-password", auth, changePassword);
export default router;