const router = require('express').Router();

router.get('/test', (req, res) => {
  res.json({ message: 'Manager route working!' });
});

module.exports = router;