const express = require('express');
const router = express.Router();

router.get('/upload', (req, res) => {
    res.render('index');
});