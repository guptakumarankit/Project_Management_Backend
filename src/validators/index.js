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
            .withMessage("user name is required")
            .toLowerCase()
            .withMessage("user name is required")
    ];
}

export {
    userRegisterValidator
}