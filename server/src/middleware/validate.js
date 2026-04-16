const validateBody = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    return next();
  } catch (err) {
    return next(err);
  }
};

const validateParams = (schema) => (req, res, next) => {
  try {
    req.params = schema.parse(req.params);
    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = { validateBody, validateParams };
