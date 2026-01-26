import { body } from "express-validator"

const userRegisterValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is Required")
            .isEmail()
            .withMessage("Email is Invalid"),
        body("username")
            .trim()
            .notEmpty()
            .withMessage("username is required")
            .toLowerCase()
            .withMessage("username must be in lowercase")
            .isLength({min : 3})
            .withMessage("username must be at least 3 character long"),
        body("password")
            .trim()
            .notEmpty()
            .withMessage("password is required"),
        body("fullName")
            .optional()
            .trim(),
    ];
}
 
const userLoginValidator = () => {
    return [
        body("email")
            .optional()
            .isEmail()
            .withMessage("Email is Invalid"),
        body("password")
            .notEmpty()
            .withMessage("password is required")
    ]
}

const userChangeCurrentPasswordValidator = () => {
    return [
        body("oldPassword")
            .notEmpty()
            .withMessage("Old password is required"),
        body("newPassword")
            .notEmpty()
            .withMessage("New Password is required"),
    ];
}

const userForgotPasswordValidator = () => {
    return [
        body("email")
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Email is Invalid")
    ];
}

const userResetForgotPasswordValidator = () => {
    return [
        body("newPassword")
            .notEmpty()
            .withMessage("Password is required")
    ]
}

export {
    userRegisterValidator , userLoginValidator , userChangeCurrentPasswordValidator , 
    userForgotPasswordValidator
}