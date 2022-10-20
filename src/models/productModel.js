const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, unique: true },
        description: { type: String, required: true },
        price: { type: Number, required: true },
        currencyId: { type: String, required: true, default: "INR" },
        currencyFormat: { type: String, required: true, default: "₹" },
        isFreeShipping: { type: Boolean, default: false, toLowerCase: true },
        productImage: { type: String, required: true },
        style: { type: String },
        availableSizes: { type: [String], required: true },
        installments: { type: Number },
        deletedAt: { type: Date, default: null },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Products", productSchema);
