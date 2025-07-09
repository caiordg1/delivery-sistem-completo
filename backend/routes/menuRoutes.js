const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');

router.get('/', menuController.getMenuItems);
router.post('/', menuController.createProduct);
router.patch('/:id', menuController.updateProduct);
router.delete('/:id', menuController.deleteProduct);
module.exports = router;
