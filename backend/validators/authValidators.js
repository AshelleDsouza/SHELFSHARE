const { body, validationResult } = require('express-validator');

// Validation error formatting middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    return res.status(400).json({
      success: false,
      message: errorDetails[0]?.message || 'Validation failed. Please correct your inputs.',
      errors: errorDetails,
    });
  }
  next();
};

const registerValidator = [
  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('Full name is required.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters.'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required.')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required.')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.')
    .matches(/\d/)
    .withMessage('Password must contain at least one number.'),
  body('confirm_password')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Confirm password does not match.');
      }
      return true;
    }),
  body('college_name')
    .trim()
    .notEmpty()
    .withMessage('College name is required.')
    .isLength({ min: 3, max: 150 })
    .withMessage('College name must be between 3 and 150 characters.'),
  body('course_id')
    .notEmpty()
    .withMessage('Please select your enrolled course.')
    .isInt({ min: 1 })
    .withMessage('Invalid course selected.'),
  body('semester_id')
    .notEmpty()
    .withMessage('Please select your current semester.')
    .isInt({ min: 1 })
    .withMessage('Invalid semester selected.'),
  handleValidationErrors,
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required.')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required.'),
  handleValidationErrors,
];

const forgotPasswordValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required.')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  handleValidationErrors,
];

const resetPasswordValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required.')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('reset_code')
    .notEmpty()
    .withMessage('Reset code is required.'),
  body('new_password')
    .notEmpty()
    .withMessage('New password is required.')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.')
    .matches(/\d/)
    .withMessage('Password must contain at least one number.'),
  body('confirm_password')
    .custom((value, { req }) => {
      if (value !== req.body.new_password) {
        throw new Error('Confirm password does not match.');
      }
      return true;
    }),
  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
};
