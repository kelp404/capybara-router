let _router;

exports.setRouter = router => {
  _router = router;
};

/**
 * @returns {Router} - The router.
 */
exports.getRouter = () => _router;
