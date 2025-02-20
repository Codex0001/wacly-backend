const router = require('express').Router();

router.get('/test', (req, res) => {
  res.json({ message: 'Employee route working!' });
});

module.exports = router;