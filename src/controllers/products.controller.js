import ProductsService from "../services/products.service.js";

// Obtener todos los productos
export const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageSize = parseInt(limit);
    const currentPage = parseInt(page);
    
    // Para paginación más avanzada, necesitarías implementar cursor-based pagination
    const result = await ProductsService.getAllProducts(pageSize);
    
    res.status(200).json({
      success: true,
      data: result.products,
      pagination: {
        currentPage,
        pageSize,
        hasMore: result.hasMore,
        totalItems: result.products.length
      }
    });
  } catch (error) {
    console.error("Error en getAllProducts:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message
    });
  }
};

// Buscar productos
export const searchProduct = async (req, res) => {
  try {
    const { q, categoria, marca, minPrice, maxPrice, destacado, rgb, disponibilidad } = req.query;
    
    const filters = {
      categoria,
      marca,
      minPrice,
      maxPrice,
      destacado: destacado === 'true' ? true : destacado === 'false' ? false : undefined,
      rgb: rgb === 'true' ? true : rgb === 'false' ? false : undefined,
      disponibilidad
    };

    // Remover filtros undefined
    Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

    const products = await ProductsService.searchProducts(q, filters);
    
    res.status(200).json({
      success: true,
      data: products,
      count: products.length,
      searchTerm: q,
      filters: filters
    });
  } catch (error) {
    console.error("Error en searchProduct:", error);
    res.status(500).json({
      success: false,
      message: "Error al buscar productos",
      error: error.message
    });
  }
};

// Obtener producto por ID
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID del producto es requerido"
      });
    }

    const product = await ProductsService.getProductById(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado"
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error("Error en getProductById:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el producto",
      error: error.message
    });
  }
};

// Obtener productos destacados
export const getFeaturedProducts = async (req, res) => {
  try {
    const products = await ProductsService.getFeaturedProducts();
    
    res.status(200).json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    console.error("Error en getFeaturedProducts:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener productos destacados",
      error: error.message
    });
  }
};

// Obtener productos por categoría
export const getProductsByCategory = async (req, res) => {
  try {
    const { categoria } = req.params;
    
    if (!categoria) {
      return res.status(400).json({
        success: false,
        message: "Categoría es requerida"
      });
    }

    const products = await ProductsService.getProductsByCategory(categoria);
    
    res.status(200).json({
      success: true,
      data: products,
      categoria,
      count: products.length
    });
  } catch (error) {
    console.error("Error en getProductsByCategory:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener productos por categoría",
      error: error.message
    });
  }
};

// Crear producto
export const createProduct = async (req, res) => {
  try {
    const productData = req.body;
    
    // Validaciones básicas
    if (!productData.nombre || !productData.precio || !productData.categoria) {
      return res.status(400).json({
        success: false,
        message: "Nombre, precio y categoría son campos requeridos"
      });
    }

    const newProduct = await ProductsService.createProduct(productData);
    
    res.status(201).json({
      success: true,
      message: "Producto creado exitosamente",
      data: newProduct
    });
  } catch (error) {
    console.error("Error en createProduct:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Error al crear el producto",
      error: error.message
    });
  }
};

// Actualizar producto
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const productData = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID del producto es requerido"
      });
    }

    const updatedProduct = await ProductsService.updateProduct(id, productData);
    
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado"
      });
    }

    res.status(200).json({
      success: true,
      message: "Producto actualizado exitosamente",
      data: updatedProduct
    });
  } catch (error) {
    console.error("Error en updateProduct:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar el producto",
      error: error.message
    });
  }
};

// Eliminar producto
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID del producto es requerido"
      });
    }

    const deleted = await ProductsService.deleteProduct(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado"
      });
    }

    res.status(200).json({
      success: true,
      message: "Producto eliminado exitosamente"
    });
  } catch (error) {
    console.error("Error en deleteProduct:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar el producto",
      error: error.message
    });
  }
};

// Actualizar stock
export const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID del producto es requerido"
      });
    }

    if (stock === undefined || stock < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock debe ser un número válido mayor o igual a 0"
      });
    }

    const updatedProduct = await ProductsService.updateStock(id, parseInt(stock));
    
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado"
      });
    }

    res.status(200).json({
      success: true,
      message: "Stock actualizado exitosamente",
      data: updatedProduct
    });
  } catch (error) {
    console.error("Error en updateStock:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar el stock",
      error: error.message
    });
  }
};

// Obtener estadísticas
export const getProductStats = async (req, res) => {
  try {
    const stats = await ProductsService.getProductStats();
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("Error en getProductStats:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas",
      error: error.message
    });
  }
};