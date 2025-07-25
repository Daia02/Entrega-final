import { Router } from "express";
import {
  getAllProducts,
  searchProduct,
  getProductById,
  getFeaturedProducts,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getProductStats
} from "../controllers/products.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

// Rutas públicas (no requieren autenticación)
router.get("/products", getAllProducts);
router.get("/products/search", searchProduct);
router.get("/products/featured", getFeaturedProducts);
router.get("/products/stats", getProductStats);
router.get("/products/category/:categoria", getProductsByCategory);
router.get("/products/:id", getProductById);

// Rutas protegidas (requieren autenticación)
router.post("/products", auth, createProduct);
router.put("/products/:id", auth, updateProduct);
router.patch("/products/:id/stock", auth, updateStock);
router.delete("/products/:id", auth, deleteProduct);

export default router;