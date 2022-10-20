const userModel = require("../models/userModel");
const productModel = require("../models/productModel");
const uploadFile = require("../middleware/aws");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const isValidBody = function (value) {
    if (typeof value === "undefined" || value === "null") return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
};

// validation for Product image
function isValidImage(value) {
    const regEx = /.+\.(?:(jpg|gif|png|jpeg|jfif))/; //It will handle all undefined, null, only numbersNaming, dot, space allowed in between
    const result = regEx.test(value);
    return result;
}

// .................................. Create Product .............................//
const createProduct = async function (req, res) {
    try {
        let data = req.body;

        let productImage = req.files;

        let uploadedFileURL = await uploadFile.uploadFile(productImage[0]);
        data.productImage = uploadedFileURL;

        const productCreation = await productModel.create(data);
        return res.status(201).send({
            status: true,
            message: "Success",
            data: productCreation,
        });
    } catch (error) {
        return res.status(500).send({
            status: false,
            message: error.message,
        });
    }
};

// .................................. Get Product by Query Params .............................//
const getProductbyQueryParams = async function (req, res) {
    try {
        const data = req.query;
        let { size, name, priceGreaterThan, priceLessThan, priceSort } = data;
        const obj = { isDeleted: false };

        let checkQueryParams = Object.keys(data);
        let arr = ["priceLessThan", "priceGreaterThan", "name", "size", "priceSort"];
        for (let i = 0; i < checkQueryParams.length; i++) {
            let update = arr.includes(checkQueryParams[i]);
            if (!update)
                return res.status(400).send({
                    status: false,
                    message:
                        "you can only update priceLessThan, priceGreaterThan, name and size fields.",
                });
        }

        const availableSizes = size;
        if (availableSizes) {
            let newSize = size.split(",").map((ele) => ele.trim());
            obj.availableSizes = { $in: newSize };
        }
        if (size != undefined) {
            if (!isValidBody(size)) {
                return res
                    .status(400)
                    .send({ status: false, message: "Please enter proper size" });
            }
        }

        let title = name;
        if (title) obj.title = { $regex: name, $options: "i" };
        if (name != undefined) {
            if (!isValidBody(name)) {
                return res
                    .status(400)
                    .send({ status: false, message: "Please enter proper name" });
            }
        }

        if (priceGreaterThan && priceLessThan) {
            obj.price = { $gt: priceGreaterThan, $lt: priceLessThan };
        } else if (priceGreaterThan) {
            obj.price = { $gt: priceGreaterThan };
        } else if (priceLessThan) {
            obj.price = { $lt: priceLessThan };
        }

        if (priceGreaterThan != undefined) {
            if (!isValidBody(priceGreaterThan)) {
                return res.status(400).send({
                    status: false,
                    message: "Please enter proper maximum price",
                });
            }
            if (isNaN(priceGreaterThan)) {
                return res.status(400).send({
                    status: false,
                    message: "Please enter proper maximum price",
                });
            }
        }

        if (priceLessThan != undefined) {
            if (!isValidBody(priceLessThan)) {
                return res.status(400).send({
                    status: false,
                    message: "Please enter proper minimum price",
                });
            }
            if (isNaN(priceLessThan)) {
                return res.status(400).send({
                    status: false,
                    message: "Please enter proper minimum price",
                });
            }
        }

        if (priceSort != undefined) {
            if (!["1", "-1"].includes(priceSort)) {
                return res.status(400).send({
                    status: false,
                    message:
                        "Please enter price sort value for ascending order gives 1 or for descending order gives -1",
                });
            }
        }

        if (priceSort) {
            price = priceSort;
            let priceDetails = await productModel.find(obj).sort({ price: price });
            if (priceDetails.length === 0) {
                return res
                    .status(404)
                    .send({ status: false, message: "Product not found" });
            }
            return res.status(200).send({
                status: true,
                message: "Success",
                data: priceDetails,
            });
        }

        if (priceGreaterThan || priceLessThan) {
            let priceDetails = await productModel.find(obj).sort({ price: 1 });
            if (priceDetails.length === 0) {
                return res
                    .status(404)
                    .send({ status: false, message: "Product not found" });
            }
            return res.status(200).send({
                status: true,
                message: "Success",
                data: priceDetails,
            });
        }

        let productDetails = await productModel.find(obj);
        if (productDetails.length === 0) {
            return res
                .status(404)
                .send({ status: true, message: "Product not found" });
        }

        return res
            .status(200)
            .send({ status: true, message: "Success", data: productDetails });
    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
};

// .................................. Get Product by Path Params .............................//
const getProductbyParams = async function (req, res) {
    try {
        let productId = req.params.productId;

        if (!ObjectId.isValid(productId)) {
            return res
                .status(400)
                .send({ status: false, message: "ProductId is not valid" });
        }

        let findProducts = await productModel.findOne(
            { _id: productId, isDeleted: false },
            { deletedAt: 0, __v: 0 }
        );
        if (!findProducts) {
            return res
                .status(404)
                .send({ status: false, message: "Product not found" });
        }

        return res
            .status(200)
            .send({ status: true, message: "Success", data: findProducts });
    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
};

// .................................. Update Product .............................//
const updateProduct = async function (req, res) {
    try {
        let productId = req.params.productId;
        let data = req.body;
        if (!ObjectId.isValid(productId)) {
            return res
                .status(400)
                .send({ status: false, message: "ProductId is not valid" });
        }
        const {
            title,
            description,
            price,
            isFreeShipping,
            style,
            availableSizes,
            installments,
        } = data;

        let obj = { isDeleted: false };

        if (title) {
            const existTitle = await productModel.findOne({ title });
            if (existTitle) {
                return res
                    .status(400)
                    .send({ status: false, message: "This title is already in use" });
            }
            obj.title = title;
        }

        if (description) obj.description = description;
        if (price) obj.price = price;
        if (isFreeShipping) obj.isFreeShipping = isFreeShipping;
        if (style) obj.style = style;
        if (availableSizes) obj.availableSizes = availableSizes;
        if (installments) obj.installments = installments;

        // ... validation for Product Image ... //
        let productImage = req.files;

        if (productImage && productImage.length > 0) {
            if (productImage.length > 1) {
                return res
                    .status(400)
                    .send({ status: false, message: "Please upload only one image" });
            }
            if (!isValidImage(productImage[0].originalname)) {
                return res.status(400).send({
                    status: false,
                    message:
                        "Please upload only image file with extension jpg, png, gif, jpeg, jfif",
                });
            }
            let uploadedFileURL = await uploadFile.uploadFile(productImage[0]);
            obj.productImage = uploadedFileURL;
        }

        const updateProductDetails = await productModel.findOneAndUpdate(
            { _id: productId, isDeleted: false },
            obj,
            { new: true }
        );

        if (!updateProductDetails) {
            return res.status(404).send({ status: false, msg: "Product not found" });
        }

        return res.status(200).send({
            status: true,
            message: "Product successfully updated",
            data: updateProductDetails,
        });
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
};

// .................................. Delete Product .............................//
const deleteProduct = async function (req, res) {
    try {
        let productId = req.params.productId;
        if (!ObjectId.isValid(productId)) {
            return res
                .status(400)
                .send({ status: false, message: "ProductId is not valid" });
        }

        const deleteProductDetails = await productModel.findOneAndUpdate(
            { _id: productId, isDeleted: false },
            { isDeleted: true, deletedAt: Date.now() },
            { new: true }
        );

        if (!deleteProductDetails) {
            return res.status(404).send({ status: false, msg: "Product not found" });
        }

        return res.status(200).send({
            status: true,
            message: "Product successfully deleted",
        });
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
};

module.exports = {
    createProduct,
    getProductbyQueryParams,
    getProductbyParams,
    updateProduct,
    deleteProduct,
};
