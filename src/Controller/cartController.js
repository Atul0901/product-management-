const cartModel = require("../models/cartModel");
const productModel = require("../models/productModel");
const userModel = require("../models/userModel");
const orderModel = require("../models/orderModel");
const { checkBodyParams } = require("../validator/userValidation");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

// .................................. Create Cart ................................//
const createCart = async function (req, res) {
    try {
        let data = req.body;
        if (!checkBodyParams(data)) {
            return res
                .status(400)
                .send({ status: false, message: "Please input Parameters" });
        }

        let { productId, cartId } = data;
        let userId = req.params.userId;

        if (!ObjectId.isValid(userId)) {
            return res
                .status(400)
                .send({ status: false, message: "UserId is not valid" });
        }

        if (!ObjectId.isValid(productId)) {
            return res
                .status(400)
                .send({ status: false, message: "ProductId is not valid" });
        }

        let user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).send({
                status: true,
                message: "User not found",
            });
        }
        // authorization
        if (req.headers.userId !== user._id.toString())
            return res
                .status(403)
                .send({ status: false, message: "You are not authorized...." });

        let product = await productModel.findOne({
            _id: productId,
            isDeleted: false,
        });

        if (!product) {
            return res.status(404).send({
                status: false,
                msg: "Product not found",
            });
        }

        let findCart;
        if (cartId) {
            findCart = await cartModel.findOne({
                _id: cartId,
                userId: userId,
            });

            if (!findCart) {
                return res.status(404).send({
                    status: false,
                    message: "This cart is not availble",
                });
            }
        } else {
            findCart = await cartModel.findOne({ userId: userId });
            if (findCart) {
                cartId = findCart._id;
            }
        }

        if (findCart) {
            let isProductAlready = findCart.items.filter(
                (x) => x.productId.toString() === productId
            );

            if (isProductAlready.length > 0) {
                const updateQuantity = await cartModel
                    .findOneAndUpdate(
                        { userId: userId, "items.productId": productId },
                        { $inc: { "items.$.quantity": 1, totalPrice: product.price } },
                        { new: true }
                    )
                    .populate([{ path: "items.productId" }]);
                return res.status(201).send({
                    status: true,
                    message: "Success",
                    data: updateQuantity,
                });
            }

            let cartUpdate = await cartModel
                .findOneAndUpdate(
                    { userId: userId, cartId: cartId },
                    {
                        $push: { items: [{ productId: productId, quantity: 1 }] },
                        $inc: {
                            totalPrice: product.price,
                            totalItems: 1,
                        },
                    },
                    { new: true }
                )
                .populate([{ path: "items.productId" }]);

            return res.status(201).send({
                status: true,
                message: "Success",
                data: cartUpdate,
            });
        }

        const obj = {
            userId: userId,
            items: [{ productId: product, quantity: 1 }],
            totalPrice: product.price,
            totalItems: 1,
        };

        const cart = await cartModel.create(obj);
        return res
            .status(201)
            .send({ status: true, message: "Success", data: cart });
    } catch (error) {
        return res.status(500).send({
            status: false,
            message: error.message,
        });
    }
};

// .................................. Update Cart .............................//
const updateCart = async function (req, res) {
    try {
        let userId = req.params.userId;
        let data = req.body;

        if (!ObjectId.isValid(userId)) {
            return res
                .status(400)
                .send({ status: false, message: "UserId is not valid" });
        }
        const { productId, cartId, removeProduct } = data;

        if (![0, 1].includes(removeProduct)) {
            return res.status(400).send({
                status: false,
                message: "Remove Product key is mandatory or only accept 0 or 1",
            });
        }

        if (!ObjectId.isValid(productId)) {
            return res.status(400).send({
                status: false,
                message: "Please enter productId or ProductId is not valid",
            });
        }

        if (!ObjectId.isValid(cartId)) {
            return res.status(400).send({
                status: false,
                message: "Please enter cartId or CartId is not valid",
            });
        }
        let user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).send({
                status: true,
                message: "User not found",
            });
        }

        // authorization
        if (req.headers.userId !== user._id.toString())
            return res
                .status(403)
                .send({ status: false, msg: "You are not authorized...." });

        let product = await productModel.findOne({
            _id: productId,
            isDeleted: false,
        });
        if (!product) {
            return res.status(404).send({
                status: false,
                msg: "Product not found",
            });
        }

        let cart = await cartModel
            .findOne({
                userId: userId,
                _id: cartId,
            })
            .populate([{ path: "items.productId" }]);
        if (!cart) {
            return res.status(404).send({
                status: false,
                msg: "Cart not found",
            });
        }

        let cartProductUse = cart.items.filter(
            (x) => x.productId._id.toString() === productId
        );

        if (removeProduct === 0) {
            if (cartProductUse.length === 0) {
                return res.status(200).send({
                    status: true,
                    message: "Success",
                    data: cart,
                });
            }
            let cartDetails = await cartModel
                .findOneAndUpdate(
                    { _id: cartId, "items.productId": productId },
                    {
                        $pull: { items: { productId: productId } },
                        $inc: {
                            totalPrice: -product.price * cartProductUse[0].quantity,
                            totalItems: -1,
                        },
                    },
                    { new: true }
                )
                .populate([{ path: "items.productId" }]);
            return res.status(200).send({
                status: true,
                message: "Success",
                data: cartDetails,
            });
        }

        if (removeProduct === 1) {
            if (cartProductUse.length === 0) {
                return res.status(200).send({
                    status: true,
                    message: "Success",
                    data: cart,
                });
            }
            if (cartProductUse[0].quantity === 1) {
                let cartDetails = await cartModel
                    .findOneAndUpdate(
                        { _id: cartId, "items.productId": productId },
                        {
                            $pull: { items: { productId: productId } },
                            $inc: {
                                totalPrice: -product.price * cartProductUse[0].quantity,
                                totalItems: -1,
                            },
                        },
                        { new: true }
                    )
                    .populate([{ path: "items.productId" }]);
                return res.status(200).send({
                    status: true,
                    message: "Success",
                    data: cartDetails,
                });
            }
            if (cartProductUse[0].quantity > 1) {
                let cartDetails = await cartModel
                    .findOneAndUpdate(
                        { _id: cartId, "items.productId": productId },
                        {
                            $inc: {
                                "items.$.quantity": -1,
                                totalPrice: -product.price,
                            },
                        },
                        { new: true }
                    )
                    .populate([{ path: "items.productId" }]);
                return res.status(200).send({
                    status: true,
                    message: "Success",
                    data: cartDetails,
                });
            }
        }
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
};

// .................................. Get Cart .............................//
const getCart = async function (req, res) {
    try {
        let userId = req.params.userId;
        if (!ObjectId.isValid(userId)) {
            return res
                .status(400)
                .send({ status: false, message: "UserId is not valid" });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).send({ status: false, message: "User not found" });
        }

        // authorization
        if (req.headers.userId !== user._id.toString())
            return res
                .status(403)
                .send({ status: false, msg: "You are not authorized...." });

        const order = await orderModel.findOneAndUpdate(
            { userId: userId },
            { items: [], totalItems: 0, totalPrice: 0, totalQuantity: 0 },
            { new: true }
        );
        if (order) {
            return res.status(200).send({
                status: true,
                message: "Success",
                data: order,
            });
        }

        const cart = await cartModel
            .findOne({ userId: userId })
            .populate([{ path: "items.productId" }]);
        if (!cart) {
            return res.status(404).send({ status: true, message: "Cart not found" });
        }
        return res
            .status(200)
            .send({ status: true, message: "Success", data: cart });
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
};

// .................................. Delete Cart .............................//
const deleteCart = async function (req, res) {
    try {
        let userId = req.params.userId;
        if (!ObjectId.isValid(userId)) {
            return res
                .status(400)
                .send({ status: false, message: "UserId is not valid" });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).send({ status: true, message: "User not found" });
        }

        // authorization
        if (req.headers.userId !== user._id.toString())
            return res
                .status(403)
                .send({ status: false, msg: "You are not authorized...." });

        const deleteCart = await cartModel.findOneAndUpdate(
            { userId: userId },
            { items: [], totalItems: 0, totalPrice: 0 },
            { new: true }
        );

        if (!deleteCart) {
            return res.status(404).send({ status: false, msg: "Cart not found" });
        }

        return res.status(204).send({
            status: true,
            message: "Cart successfully deleted",
            data: deleteCart,
        });
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
};

module.exports = { createCart, updateCart, getCart, deleteCart };
