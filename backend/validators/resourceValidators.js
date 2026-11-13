const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    return res.status(400).json({
      success: false,
      message: errorDetails[0]?.message || 'Validation failed. Please verify your inputs.',
      errors: errorDetails,
    });
  }
  next();
};

const ALLOWED_RESOURCE_TYPES = [
  'Lecture Notes',
  'Handwritten Notes',
  'Previous Year Question Papers',
  'Assignments',
  'Presentations',
  'Programming Examples',
  'Reference Materials',
  'Other',
];

const createResourceValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Resource title is required.')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters.'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Resource description is required.')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters.'),
  body('course_id')
    .notEmpty()
    .withMessage('Course selection is required.')
    .isInt({ min: 1 })
    .withMessage('Invalid course selected.'),
  body('semester_id')
    .notEmpty()
    .withMessage('Semester selection is required.')
    .isInt({ min: 1 })
    .withMessage('Invalid semester selected.'),
  body('subject_id')
    .notEmpty()
    .withMessage('Subject selection is required.')
    .isInt({ min: 1 })
    .withMessage('Invalid subject selected.'),
  body('resource_type')
    .notEmpty()
    .withMessage('Resource type is required.')
    .isIn(ALLOWED_RESOURCE_TYPES)
    .withMessage(`Invalid resource type. Allowed types: ${ALLOWED_RESOURCE_TYPES.join(', ')}`),
  body('unit_name')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 120 })
    .withMessage('Unit name cannot exceed 120 characters.'),
  body('tags')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Tags cannot exceed 255 characters.'),
  handleValidationErrors,
];

const updateResourceValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Resource title is required.')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters.'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Resource description is required.')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters.'),
  body('resource_type')
    .notEmpty()
    .withMessage('Resource type is required.')
    .isIn(ALLOWED_RESOURCE_TYPES)
    .withMessage('Invalid resource type.'),
  body('unit_name')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 120 }),
  body('tags')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 255 }),
  handleValidationErrors,
];

module.exports = {
  createResourceValidator,
  updateResourceValidator,
};
