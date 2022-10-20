const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const productController = require("../controller/productController");
const cartController = require("../controller/cartController");
const orderController = require("../controller/orderController");
const validation = require("../validator/userValidation");
const productValidation = require("../validator/productValidator");
const auth = require("../middleware/auth");

// .................................. USER APIS .............................//
router.post(
    "/register",
    validation.validationForUser,
    userController.registerUser
);

router.post(
    "/login",
    validation.validationForLoginUser,
    userController.loginUser
);

router.get(
    "/user/:userId/profile",
    auth.Authentication,
    userController.getUser
);

router.put(
    "/user/:userId/profile",
    auth.Authentication,
    validation.validationForUpdateUser,
    userController.updateUser
);

// .................................. PRODUCT APIS .............................//
router.post(
    "/products",
    productValidation.validationForProduct,
    productController.createProduct
);

router.get("/products", productController.getProductbyQueryParams);

router.get("/products/:productId", productController.getProductbyParams);

router.put(
    "/products/:productId",
    productValidation.validationForUpdateProduct,
    productController.updateProduct
);

router.delete("/products/:productId", productController.deleteProduct);

// .................................. CART APIS .............................//
router.post(
    "/users/:userId/cart",
    auth.Authentication,
    cartController.createCart
);

router.put(
    "/users/:userId/cart",
    auth.Authentication,
    cartController.updateCart
);

router.get("/users/:userId/cart", auth.Authentication, cartController.getCart);

router.delete(
    "/users/:userId/cart",
    auth.Authentication,
    cartController.deleteCart
);

// .................................. ORDER APIS .............................//
router.post(
    "/users/:userId/orders",
    auth.Authentication,
    orderController.createOrder
);

router.put(
    "/users/:userId/orders",
    auth.Authentication,
    orderController.updateOrder
);

router.all("/**", function (req, res) {
    res.status(404).send({
        status: false,
        msg: "The api you request is not available",
    });
});

module.exports = router;
