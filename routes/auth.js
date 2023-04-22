const express = require('express');
const userController = require('../controller/users')
const router = express.Router();

router.post('/register',userController.register);
router.post('/login',userController.login);
router.get('/logout',userController.logout);
router.post('/AddScholarships',userController.AddScholarships);

module.exports = router;