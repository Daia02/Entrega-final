import "dotenv/config";
import express from "express";
import cors from "cors";
const app = express();



app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "API Rest en Node.js" });
});

import productsRouter from "./src/routes/products.route.js";
app.use("/api", productsRouter);

import authRouter from "./src/routes/auth.route.js";
app.use(authRouter);

app.use((req, res, next) => {
  res.status(404).json({ error: "Not Found" });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));