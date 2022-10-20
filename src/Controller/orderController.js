const cartModel = require("../models/cartModel");
const orderModel = require("../models/orderModel");
const userModel = require("../models/userModel");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

// .................................. Create Order .............................//
const createOrder = async function (req, res) {
    try {
        let userId = req.params.userId;
        let cartId = req.body.cartId;
        let cancellable = req.body.cancellable;

        if (!ObjectId.isValid(userId)) {
            return res
                .status(400)
                .send({ status: false, message: "UserId is not valid" });
        }

        if (!ObjectId.isValid(cartId)) {
            return res
                .status(400)
                .send({ status: false, message: "CartId is not valid" });
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

        const cart = await cartModel.findById(cartId).select({ _id: 0 });
        if (cart.totalItems === 0) {
            return res.status(201).send({
                status: false,
                message: "Please add some items in cart to create an order",
            });
        }

        let totalQuantity = cart.items.map((x) => x.quantity);
        const sumOfQuantity = totalQuantity.reduce(
            (previousValue, currentValue) => previousValue + currentValue,
            0
        );

        if (cancellable) {
            if (typeof cancellable !== "boolean") {
                return res
                    .status(400)
                    .send({ status: true, message: "Cancellable only be true or false" });
            }
        }

        const obj = {
            ...cart.toJSON(),
            totalQuantity: sumOfQuantity,
            cancellable: cancellable,
        };

        const order = await orderModel.create(obj);
        return res
            .status(201)
            .send({ status: true, message: "Success", data: order });
    } catch (error) {
        return res.status(500).send({
            status: false,
            message: error.message,
        });
    }
};

// .................................. Update Order .............................//
const updateOrder = async function (req, res) {
    try {
        let userId = req.params.userId;
        let orderId = req.body.orderId;
        let status = req.body.status;

        if (!status) {
            return res.status(400).send({
                status: false,
                message: "Status is mandatory'",
            });
        }

        let statusList = ["pending", "completed", "cancelled"];
        if (!statusList.includes(status)) {
            return res.status(400).send({
                status: false,
                message: "Status should be from 'pending','completed' and 'cancelled'",
            });
        }

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

        if (!ObjectId.isValid(orderId)) {
            return res
                .status(400)
                .send({ status: false, message: "OrderId is not valid" });
        }

        const cart = await cartModel.findOne({ userId: userId });
        if (cart.totalItems === 0) {
            return res.status(404).send({ status: true, message: "Cart not found" });
        }

        const order = await orderModel.findOne({ _id: orderId, userId: userId });
        if (!order) {
            return res.status(404).send({ status: true, message: "Order not found" });
        }

        if (order.cancellable === false) {
            return res
                .status(400)
                .send({ status: true, message: "Order can't be cancelled" });
        }

        if (order.cancellable) {
            const orderStatus = await orderModel.findOneAndUpdate(
                {
                    _id: orderId,
                    userId: userId,
                },
                {
                    $set: { status: status },
                },
                {
                    new: true,
                }
            );
            return res
                .status(200)
                .send({ status: true, message: "Success", data: orderStatus });
        }
    } catch (error) {
        return res.status(500).send({
            status: false,
            message: error.message,
        });
    }
};

module.exports = { createOrder, updateOrder };
