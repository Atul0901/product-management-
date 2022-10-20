const userModel = require("../models/userModel");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;


// Validataion for empty request body
const checkBodyParams = function (value) {
    if (Object.keys(value).length === 0) return false;
    else return true;
};

const isValidBody = function (value) {
    if (typeof value === "undefined" || value === "null") return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
};

const isValidEmail = function (email) {
    let checkemail = /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/;
    if (checkemail.test(email)) {
        return true;
    }
    return false;
};

const isValidMobileNumber = function (mobile) {
    let checkMobile = /^\s*\+91\s[6-9]\d{9}$/;
    if (checkMobile.test(mobile)) {
        return true;
    }
    return false;
};

const isValidPassword = function (password) {
    const re =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[\w!@#$%^&*]{8,15}$/; //for password space not allowed, also handles !password
    return re.test(password);
};

// Validation for length of characters
const lengthOfCharacter = function (value) {
    if (!/^\s*(?=[a-zA-Z])[\a-z\A-Z\s]{3,64}\s*$/.test(value)) return false;
    else return true;
};

// validation for Profile image
function isValidImage(value) {
    const regEx = /.+\.(?:(jpg|gif|png|jpeg|jfif))/; //It will handle all undefined, null, only numbersNaming, dot, space allowed in between
    const result = regEx.test(value);
    return result;
}

// ....................................... Validation for User .................................//
const validationForUser = async function (req, res, next) {
    try {
        let data = req.body;
        let { fname, lname, email, phone, password, address } = data;
        let profileImage = req.files;

        if (profileImage.length === 0) {
            return res
                .status(400)
                .send({ status: false, message: "Please Upload the Profile Image" });
        } else if (profileImage.length > 1) {
            return res
                .status(400)
                .send({ status: false, message: "Please upload only one image" });
        }
        if (!isValidImage(profileImage[0].originalname)) {
            return res.status(400).send({
                status: false,
                message:
                    "Please upload only image file with extension jpg, png, gif, jpeg",
            });
        }
        if (!checkBodyParams(data) && !profileImage) {
            return res
                .status(400)
                .send({ status: false, message: "Please input Parameters" });
        }
        if (!isValidBody(fname)) {
            return res.status(400).send({
                status: false,
                message: "Please provide first name , eg.Ankita",
            });
        }
        if (!lengthOfCharacter(fname)) {
            return res.status(400).send({
                status: false,
                message: "Please provide first name with right format",
            });
        }

        if (!isValidBody(lname)) {
            return res.status(400).send({
                status: false,
                message: "Please provide last name , eg.Sangani",
            });
        }
        if (!lengthOfCharacter(lname)) {
            return res.status(400).send({
                status: false,
                message: "Please provide last name with right format",
            });
        }

        if (email) email = email.toLowerCase();
        if (!isValidBody(email)) {
            return res
                .status(400)
                .send({ status: false, message: "Please enter email" });
        } else if (!isValidEmail(email)) {
            return res
                .status(400)
                .send({ status: false, message: "Email is not valid" });
        }
        const existEmail = await userModel.findOne({ email });
        if (existEmail) {
            return res
                .status(400)
                .send({ status: false, message: "This Email is already in use" });
        }
        if (!phone) {
            return res.status(400).send({
                status: false,
                message: "Please enter mobile number",
            });
        }
        if (!isValidMobileNumber(phone)) {
            return res.status(400).send({
                status: false,
                message: "Please enter 10 digit indian number, eg. +91 9876xxxxxx",
            });
        }
        const existPhone = await userModel.findOne({ phone });
        if (existPhone) {
            return res.status(400).send({
                status: false,
                message: "This Mobile number is already in use",
            });
        }
        if (!isValidPassword(password)) {
            return res.status(400).send({
                status: false,
                message:
                    "Please enter valid password with one uppercase ,lowercse and special character and length should be 8 to 15",
            });
        }

        if (!address) {
            return res.status(400).send({
                status: false,
                message: "Address is Mandatory",
            });
        }

        if (!address.shipping) {
            return res.status(400).send({
                status: false,
                message: "Please enter shipping address",
            });
        }

        if (!isValidBody(address.shipping.street)) {
            return res.status(400).send({
                status: false,
                message: "Please enter street in shipping address",
            });
        }
        if (!isValidBody(address.shipping.city)) {
            return res.status(400).send({
                status: false,
                message: "Please enter city in shipping address",
            });
        }
        if (!lengthOfCharacter(address.shipping.city)) {
            return res.status(400).send({
                status: false,
                message: "Please enter valid city in shipping address",
            });
        }
        if (!/^\d{6}$/.test(address.shipping.pincode)) {
            return res.status(400).send({
                status: false,
                message: "Please enter valid pincode in shipping address",
            });
        }

        if (!address.billing) {
            return res.status(400).send({
                status: false,
                message: "Please enter billing address",
            });
        }

        if (!isValidBody(address.billing.street)) {
            return res.status(400).send({
                status: false,
                message: "Please enter street in billing address",
            });
        }
        if (!isValidBody(address.billing.city)) {
            return res.status(400).send({
                status: false,
                message: "Please enter city in billing address",
            });
        }
        if (!lengthOfCharacter(address.billing.city)) {
            return res.status(400).send({
                status: false,
                message: "Please enter valid city in billing address",
            });
        }
        if (!/^\d{6}$/.test(address.billing.pincode)) {
            return res.status(400).send({
                status: false,
                message: "Please enter valid pincode in billing address",
            });
        }
    } catch (error) {
        return res.status(500).send({
            status: false,
            message: error.message,
        });
    }
    next();
};

// ....................................... Validation for Login User .................................//
const validationForLoginUser = async function (req, res, next) {
    try {
        let data = req.body;

        if (!checkBodyParams(data)) {
            return res
                .status(400)
                .send({ status: false, message: "Please input Parameters" });
        }

        if (!data.email) {
            return res.status(400).send({
                status: false,
                message: "Email is mandatory",
            });
        }

        if (!isValidEmail(data.email)) {
            return res
                .status(400)
                .send({ status: false, message: "Email is not valid" });
        }
        if (data.email) data.email = data.email.toLowerCase();
        if (!data.password) {
            return res.status(400).send({
                status: false,
                message: "Password is mandatory",
            });
        }
        if (!isValidPassword(data.password)) {
            return res.status(400).send({
                status: false,
                message:
                    "Please enter valid password with one uppercase ,lowercse and special character and length should be 8 to 15",
            });
        }
    } catch (error) {
        return res.status(500).send({
            status: false,
            message: error.message,
        });
    }
    next();
};

// ....................................... Validation for Updated User .................................//
const validationForUpdateUser = async function (req, res, next) {
    try {
        let userId = req.params.userId;

        if (!ObjectId.isValid(userId)) {
            return res
                .status(400)
                .send({ status: false, message: "UserId is not valid" });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).send({ status: false, msg: "User not found" });
        }

        // authorization
        if (req.headers.userId !== user._id.toString()) {
            return res
                .status(403)
                .send({ status: false, msg: "You are not authorized...." });
        }

        let data = req.body;
        let { fname, lname, email, phone, password, address } = data;
        let profileImage = req.files;

        if (profileImage && profileImage.length > 0) {
            if (profileImage.length > 1) {
                return res
                    .status(400)
                    .send({ status: false, message: "Please upload only one image" });
            }
            if (!isValidImage(profileImage[0].originalname)) {
                return res.status(400).send({
                    status: false,
                    message:
                        "Please upload only image file with extension jpg, png, gif, jpeg",
                });
            }
        }

        if (!checkBodyParams(data) && !profileImage) {
            return res
                .status(400)
                .send({ status: false, message: "Please input Parameters" });
        }

        if (fname != undefined) {
            if (!isValidBody(fname)) {
                return res.status(400).send({
                    status: false,
                    message: "Please provide first name,eg.Ankita",
                });
            }
            if (!lengthOfCharacter(fname)) {
                return res.status(400).send({
                    status: false,
                    message: "Please provide first name with right format",
                });
            }
        }

        if (lname != undefined) {
            if (!isValidBody(lname)) {
                return res.status(400).send({
                    status: false,
                    message: "Please provide last name,eg.Sangani",
                });
            }
            if (!lengthOfCharacter(lname)) {
                return res.status(400).send({
                    status: false,
                    message: "Please provide last name with right format",
                });
            }
        }

        if (email != undefined)
            if (!isValidBody(email)) {
                return res
                    .status(400)
                    .send({ status: false, message: "Please enter email" });
            } else if (!isValidEmail(email)) {
                return res
                    .status(400)
                    .send({ status: false, message: "Email is not valid" });
            }
        const existEmail = await userModel.findOne({ email });
        if (existEmail) {
            return res
                .status(400)
                .send({ status: false, message: "This Email is already in use" });
        }

        if (phone != undefined) {
            if (!isValidMobileNumber(phone)) {
                return res.status(400).send({
                    status: false,
                    message: "Please enter 10 digit indian number, eg. +91 9876xxxxxx",
                });
            }
        }

        const existPhone = await userModel.findOne({ phone });
        if (existPhone) {
            return res.status(400).send({
                status: false,
                message: "This Mobile number is already in use",
            });
        }
        if (password != undefined) {
            if (!isValidPassword(password)) {
                return res.status(400).send({
                    status: false,
                    message:
                        "Please enter valid password with one uppercase ,lowercse and special character and length should be 8 to 15",
                });
            }
        }

        if (address && address.shipping) {
            if (
                address.shipping.street != undefined &&
                !isValidBody(address.shipping.street)
            ) {
                return res.status(400).send({
                    status: false,
                    message: "Please enter street in shipping address",
                });
            }
            if (
                address.shipping.city != undefined &&
                !lengthOfCharacter(address.shipping.city)
            ) {
                return res.status(400).send({
                    status: false,
                    message: "Please enter city in shipping address with right format",
                });
            }

            if (
                address.shipping.pincode != undefined &&
                !/^\d{6}$/.test(address.shipping.pincode)
            ) {
                return res.status(400).send({
                    status: false,
                    message: "Please enter pincode in shipping address with right format",
                });
            }
        }

        if (address && address.billing) {
            if (
                address.billing.street != undefined &&
                !isValidBody(address.billing.street)
            ) {
                return res.status(400).send({
                    status: false,
                    message: "Please enter street in billing address",
                });
            }
            if (
                address.billing.city != undefined &&
                !lengthOfCharacter(address.billing.city)
            ) {
                return res.status(400).send({
                    status: false,
                    message: "Please enter city in billing address with right format",
                });
            }

            if (
                address.billing.pincode != undefined &&
                !/^\d{6}$/.test(address.billing.pincode)
            ) {
                return res.status(400).send({
                    status: false,
                    message: "Please enter pincode in billing address with right format",
                });
            }
        }
    } catch (error) {
        return res.status(500).send({
            status: false,
            message: error.message,
        });
    }
    next();
};

module.exports = {
    checkBodyParams,
    isValidBody,
    validationForUser,
    validationForLoginUser,
    validationForUpdateUser,
};
