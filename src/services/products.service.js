import { db } from "../models/data.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
} from "firebase/firestore";

const COLLECTION_NAME = "products";

class ProductsService {
  constructor() {
    this.productsCollection = collection(db, COLLECTION_NAME);
  }

  // Obtener todos los productos con paginación opcional
  async getAllProducts(pageSize = 10, lastDocument = null) {
    try {
      let productsQuery = query(
        this.productsCollection,
        orderBy("fecha_creacion", "desc"),
        limit(pageSize)
      );

      if (lastDocument) {
        productsQuery = query(
          this.productsCollection,
          orderBy("fecha_creacion", "desc"),
          startAfter(lastDocument),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(productsQuery);
      const products = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return {
        products,
        lastDocument: snapshot.docs[snapshot.docs.length - 1],
        hasMore: snapshot.docs.length === pageSize,
      };
    } catch (error) {
      console.error("Error al obtener productos:", error);
      throw new Error("Error al obtener los productos");
    }
  }

  // Obtener producto por ID
  async getProductById(id) {
    try {
      const productRef = doc(this.productsCollection, id);
      const snapshot = await getDoc(productRef);
      
      if (!snapshot.exists()) {
        return null;
      }

      return { id: snapshot.id, ...snapshot.data() };
    } catch (error) {
      console.error("Error al obtener producto por ID:", error);
      throw new Error("Error al obtener el producto");
    }
  }

  // Buscar productos por diferentes criterios
  async searchProducts(searchTerm, filters = {}) {
    try {
      let productsQuery = query(this.productsCollection);
      
      // Filtros disponibles
      if (filters.categoria) {
        productsQuery = query(productsQuery, where("categoria", "==", filters.categoria));
      }
      
      if (filters.marca) {
        productsQuery = query(productsQuery, where("marca", "==", filters.marca));
      }
      
      if (filters.disponibilidad) {
        productsQuery = query(productsQuery, where("disponibilidad", "==", filters.disponibilidad));
      }
      
      if (filters.destacado !== undefined) {
        productsQuery = query(productsQuery, where("destacado", "==", filters.destacado));
      }
      
      if (filters.rgb !== undefined) {
        productsQuery = query(productsQuery, where("rgb", "==", filters.rgb));
      }

      const snapshot = await getDocs(productsQuery);
      let products = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Filtro por término de búsqueda (nombre, descripción, tags)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        products = products.filter((product) => {
          return (
            product.nombre.toLowerCase().includes(searchLower) ||
            product.descripcion.toLowerCase().includes(searchLower) ||
            product.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
            product.marca.toLowerCase().includes(searchLower)
          );
        });
      }

      // Filtros por rango de precio
      if (filters.minPrice) {
        products = products.filter(product => product.precio >= parseFloat(filters.minPrice));
      }
      
      if (filters.maxPrice) {
        products = products.filter(product => product.precio <= parseFloat(filters.maxPrice));
      }

      return products;
    } catch (error) {
      console.error("Error al buscar productos:", error);
      throw new Error("Error al buscar productos");
    }
  }

  // Obtener productos destacados
  async getFeaturedProducts() {
    try {
      const featuredQuery = query(
        this.productsCollection,
        where("destacado", "==", true),
        orderBy("valoracion", "desc"),
        limit(6)
      );

      const snapshot = await getDocs(featuredQuery);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error al obtener productos destacados:", error);
      throw new Error("Error al obtener productos destacados");
    }
  }

  // Obtener productos por categoría
  async getProductsByCategory(categoria) {
    try {
      const categoryQuery = query(
        this.productsCollection,
        where("categoria", "==", categoria),
        orderBy("valoracion", "desc")
      );

      const snapshot = await getDocs(categoryQuery);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error al obtener productos por categoría:", error);
      throw new Error("Error al obtener productos por categoría");
    }
  }

  // Crear nuevo producto
  async createProduct(productData) {
    try {
      // Validar datos requeridos
      const requiredFields = ['nombre', 'modelo', 'descripcion', 'precio', 'categoria', 'marca', 'stock'];
      for (const field of requiredFields) {
        if (!productData[field]) {
          throw new Error(`El campo ${field} es requerido`);
        }
      }

      // Agregar campos adicionales
      const newProduct = {
        ...productData,
        fecha_creacion: new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString(),
        disponibilidad: productData.stock > 0 ? "en stock" : "sin stock",
        num_reviews: 0,
        valoracion: 0,
      };

      const docRef = await addDoc(this.productsCollection, newProduct);
      return { id: docRef.id, ...newProduct };
    } catch (error) {
      console.error("Error al crear producto:", error);
      throw new Error(error.message || "Error al crear el producto");
    }
  }

  // Actualizar producto
  async updateProduct(id, productData) {
    try {
      const productRef = doc(this.productsCollection, id);
      const snapshot = await getDoc(productRef);

      if (!snapshot.exists()) {
        return null;
      }

      // Actualizar fecha de modificación y disponibilidad
      const updatedData = {
        ...productData,
        fecha_actualizacion: new Date().toISOString(),
      };

      // Actualizar disponibilidad basada en stock
      if (productData.stock !== undefined) {
        updatedData.disponibilidad = productData.stock > 0 ? "en stock" : "sin stock";
      }

      await updateDoc(productRef, updatedData);
      return { id, ...snapshot.data(), ...updatedData };
    } catch (error) {
      console.error("Error al actualizar producto:", error);
      throw new Error("Error al actualizar el producto");
    }
  }

  // Eliminar producto
  async deleteProduct(id) {
    try {
      const productRef = doc(this.productsCollection, id);
      const snapshot = await getDoc(productRef);

      if (!snapshot.exists()) {
        return false;
      }

      await deleteDoc(productRef);
      return true;
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      throw new Error("Error al eliminar el producto");
    }
  }

  // Actualizar stock de producto
  async updateStock(id, newStock) {
    try {
      const productRef = doc(this.productsCollection, id);
      const snapshot = await getDoc(productRef);

      if (!snapshot.exists()) {
        return null;
      }

      const updatedData = {
        stock: newStock,
        disponibilidad: newStock > 0 ? "en stock" : "sin stock",
        fecha_actualizacion: new Date().toISOString(),
      };

      await updateDoc(productRef, updatedData);
      return { id, ...snapshot.data(), ...updatedData };
    } catch (error) {
      console.error("Error al actualizar stock:", error);
      throw new Error("Error al actualizar el stock");
    }
  }

  // Obtener estadísticas de productos
  async getProductStats() {
    try {
      const snapshot = await getDocs(this.productsCollection);
      const products = snapshot.docs.map(doc => doc.data());
      
      const stats = {
        total: products.length,
        enStock: products.filter(p => p.disponibilidad === "en stock").length,
        sinStock: products.filter(p => p.disponibilidad === "sin stock").length,
        destacados: products.filter(p => p.destacado).length,
        conRGB: products.filter(p => p.rgb).length,
        valoracionPromedio: products.reduce((sum, p) => sum + p.valoracion, 0) / products.length,
        precioPromedio: products.reduce((sum, p) => sum + p.precio, 0) / products.length,
        categorias: [...new Set(products.map(p => p.categoria))],
        marcas: [...new Set(products.map(p => p.marca))]
      };

      return stats;
    } catch (error) {
      console.error("Error al obtener estadísticas:", error);
      throw new Error("Error al obtener estadísticas");
    }
  }
}

export default new ProductsService();