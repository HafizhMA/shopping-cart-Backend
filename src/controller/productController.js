// src/controller/productController.js

const { PrismaClient } = require("@prisma/client");
const { connect } = require("../routes/productRoutes");
const prisma = new PrismaClient();

// Get all products
exports.getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.json({
      status: 500,
      message: "Internal server error",
    });
  }
};

exports.getOneProduct = async (req, res) => {
  const { id } = req.params; // Assuming the product ID is in the request parameters

  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (product) {
    return res.json({
      status: 200,
      data: product,
    });
  } else {
    return res.json({
      status: 404,
      message: "No such data",
    });
  }
};

// Create a new product
exports.createProduct = async (req, res) => {
  const { data } = req.body;

  try {
    const product = await prisma.product.create({
      data: {
        namaBarang: data.namaBarang,
        deskripsiBarang: data.deskripsiBarang,
        hargaBarang: parseInt(data.hargaBarang),
        quantity: parseInt(data.quantity),
        size: data.size,
        color: data.color,
        berat: parseInt(data.berat),
        features: data.features,
        capacity: data.capacity,
        powerConsumption: data.powerConsumption,
        dimensi: data.dimensi,
        kategori: data.kategori,
        diskon: parseInt(data.diskon),
        img: data.img,
        user: {
          connect: {
            id: data.userId
          }
        }
      },
    });

    res.status(201).json({
      status: 201,
      data: product,
      message: "Data successfully posted",
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({
      status: 500,
      message: "Failed to create product",
      error: error.message // Send detailed error message for debugging
    });
  }
};

// Update a product
exports.updateProduct = async (req, res) => {
  const productId = req.params.id;
  const updatedProductData = req.body;

  try {
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updatedProductData,
    });

    res.status(200).json({
      status: 200,
      data: updatedProduct,
      message: "Data successfully updated",
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({
      status: 500,
      message: "Failed to update product",
      error: error.message // Send detailed error message for debugging
    });
  }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
  const productId = req.params.id;

  try {
    await prisma.product.delete({
      where: { id: productId },
    });

    res.json({
      status: 200,
      message: "Data successfully deleted",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.json({
      status: 500,
      message: "Internal server error",
    });
  }
};

exports.searchProduct = async (req, res) => {
  const { query } = req.query;

  try {
    const products = await prisma.product.findMany({
      where: {
        namaBarang: {
          contains: query,
          mode: 'insensitive',
        },
      },
      include: {
        user: true
      }
    });

    if (products.length === 0) {
      return res.json({
        status: 404,
        message: 'No such nama barang',
      });
    }

    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 500,
      message: 'Failed to fetch products',
    });
  }
};

// cart controller
exports.postOneCart = async (req, res) => {
  const { userId, productId } = req.body;
  try {
    // Cek apakah produk sudah ada di keranjang pengguna
    const existingCartItem = await prisma.cartItem.findFirst({
      where: {
        userId: userId,
        productId: productId,
      },
    });

    if (existingCartItem) {
      // Jika produk sudah ada di keranjang, tambahkan kuantitasnya
      await prisma.cartItem.update({
        where: {
          id: existingCartItem.id,
        },
        data: {
          quantity: existingCartItem.quantity + 1,
        },
      });
      res.json({
        status: '200',
        message: 'Successfully add 1 quantity'
      })
    } else {
      // Jika produk belum ada di keranjang, buat item keranjang baru
      const cartItem = await prisma.cartItem.create({
        data: {
          userId,
          productId,
          quantity: 1,
        },
      });
      res.status(200).json({ cartItem, message: 'Successfully added product to cart' });
    }

  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'An error occurred while adding product to cart' });
  }
};

exports.getProductCart = async (req, res) => {
  try {
    const cart = await prisma.cartItem.findMany({
      include: {
        product: {
          include: {
            user: true,
          }
        },
        user: true
      },
      orderBy: {
        createdAt: 'asc'
      },
    });

    return res.status(200).json({
      cart,
      message: 'Berhasil mendapatkan keranjang belanja'
    });
  } catch (error) {
    console.error(error);
    res.status(404).json({
      error: 'Gagal mendapatkan keranjang belanja'
    });
  }
};

exports.incrementCartItemQuantity = async (req, res) => {
  const { id } = req.params;  // ID sudah dalam bentuk string

  try {
    // Find the cart item using the string ID
    const cartItem = await prisma.cartItem.findUnique({
      where: { id }  // Gunakan ID sebagai string
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Update quantity
    const updatedCartItem = await prisma.cartItem.update({
      where: { id },  // Gunakan ID sebagai string
      data: { quantity: cartItem.quantity + 1 }
    });

    return res.status(200).json({ updatedCartItem, message: 'Quantity updated successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to update quantity' });
  }
};

// Decrement Cart Item Quantity
exports.decrementCartItemQuantity = async (req, res) => {
  const { id } = req.params;  // Konsisten menggunakan req.params untuk ID

  try {
    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'No such product' });
    }

    if (cartItem.quantity > 1) {
      // Update quantity
      const updatedCartItem = await prisma.cartItem.update({
        where: { id },
        data: { quantity: cartItem.quantity - 1 }
      });
      return res.status(200).json({ updatedCartItem, message: 'Quantity updated successfully' });
    } else {
      // Delete the cart item if quantity is 1 or less
      await prisma.cartItem.delete({
        where: { id }
      });
      return res.status(200).json({ message: 'Cart item has been deleted' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to update quantity' });
  }
};

exports.deleteOneCart = async (req, res) => {
  const { id } = req.params;

  try {
    const products = await prisma.cartItem.findUnique({
      where: { id }
    })

    if (products) {
      const deleteProduct = await prisma.cartItem.delete({
        where: { id }
      })
      res.status(200).json({
        deleteProduct, message: 'delete one product'
      })
    } else {
      res.json({
        status: '404',
        message: 'product not found'
      })
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'failed to delete product'
    })
  }
}

exports.changeQuantityCart = async (req, res) => {
  const { id, newQuantity } = req.body;

  try {
    const updateQuantity = await prisma.cartItem.update({
      where: {
        id
      },
      data: {
        quantity: newQuantity
      }
    })

    res.status(200).json({
      updateQuantity,
      message: 'success update cart quantity'
    })
  } catch (error) {
    console.error('failed change cart quantity', error);
    res.status(500).json({
      message: 'failed change cart quantity'
    })
  }
}
// end cart

// checkout
exports.getCheckout = async (req, res) => {
  const { userId, items } = req.body;

  if (!userId || !items || items.length === 0) {
    return res.status(400).json({ message: "Invalid request, missing userId or items." });
  }

  try {
    // Check for existing checkout without payments
    const existingNullPaymentCheckout = await prisma.checkout.findFirst({
      where: {
        userId: userId,
        payment: {
          none: {}, // Check for checkouts that have no payments
        },
      },
    });

    if (existingNullPaymentCheckout) {
      // If an existing checkout without payments is found, delete it
      await prisma.checkout.delete({
        where: {
          id: existingNullPaymentCheckout.id,
        },
      });

      // Create a new checkout since the previous one was deleted
      const checkoutData = {
        userId,
        items: {
          connect: items.map(item => ({ id: item.cartItemId })),
        },
      };

      // Find the default address for this user
      const alamat = await prisma.alamatPengiriman.findFirst({
        where: {
          userId: userId,
          isDefault: true,
        },
      });

      if (alamat) {
        checkoutData.alamatPengirimanId = alamat.id;
      }

      const newCheckout = await prisma.checkout.create({
        data: checkoutData,
      });

      // Update cart items with the new checkoutId
      await prisma.cartItem.updateMany({
        where: {
          id: { in: items.map(item => item.cartItemId) },
        },
        data: {
          checkoutId: newCheckout.id,
        },
      });

      return res.status(200).json({
        checkout: newCheckout,
        message: 'Checkout created after deleting previous checkout with null payment.',
      });
    }

    // If no checkout without payment exists, check for one with payment
    const existingPaymentCheckout = await prisma.checkout.findFirst({
      where: {
        userId: userId,
        payment: {
          some: {}, // Check for checkouts that have any payments
        },
      },
    });

    if (existingPaymentCheckout) {
      // If the checkout has a payment, create a new checkout
      const checkoutData = {
        userId,
        items: {
          connect: items.map(item => ({ id: item.cartItemId })),
        },
      };

      // Find the default address for this user
      const alamat = await prisma.alamatPengiriman.findFirst({
        where: {
          userId: userId,
          isDefault: true,
        },
      });

      if (alamat) {
        checkoutData.alamatPengirimanId = alamat.id;
      }

      // Create a new checkout
      const newCheckout = await prisma.checkout.create({
        data: checkoutData,
      });

      // Update cart items with the new checkoutId
      await prisma.cartItem.updateMany({
        where: {
          id: { in: items.map(item => item.cartItemId) },
        },
        data: {
          checkoutId: newCheckout.id,
        },
      });

      return res.status(200).json({
        checkout: newCheckout,
        message: 'Checkout success with a new checkout because the existing checkout has a payment.',
      });
    } else {
      // No existing checkout found, create a new one
      const checkoutData = {
        userId,
        items: {
          connect: items.map(item => ({ id: item.cartItemId })),
        },
      };

      const alamat = await prisma.alamatPengiriman.findFirst({
        where: {
          userId: userId,
          isDefault: true,
        },
      });

      if (alamat) {
        checkoutData.alamatPengirimanId = alamat.id;
      }

      const checkout = await prisma.checkout.create({
        data: checkoutData,
      });

      await prisma.cartItem.updateMany({
        where: {
          id: { in: items.map(item => item.cartItemId) },
        },
        data: {
          checkoutId: checkout.id,
        },
      });

      return res.status(200).json({
        checkout,
        message: 'Checkout success with a new checkout.',
      });
    }
  } catch (error) {
    console.error('Error during checkout', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getProductCheckout = async (req, res) => {
  const { userId } = req.body;

  try {
    const checkoutProduct = await prisma.checkout.findFirst({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc', // Ambil checkout terbaru
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                user: {
                  include: {
                    AlamatPengiriman: {
                      where: {
                        isDefault: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!checkoutProduct) {
      return res.status(404).json({ message: 'No checkout found.' });
    }

    res.status(200).json(checkoutProduct);
  } catch (error) {
    console.error('Error fetching product checkout', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

//end checkout
