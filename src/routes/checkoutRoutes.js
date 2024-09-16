const express = require('express');
const checkoutController = require("../controller/checkoutController");
const router = express.Router();

router.post('/createAlamat', checkoutController.postAlamat);
router.get('/getAlamat', checkoutController.getAlamat);
router.patch('/choosenAlamat', checkoutController.setAlamat);
router.put('/updateAlamat', checkoutController.updateAlamat);
router.delete('/deleteAlamat/:id', checkoutController.deleteAlamat);
router.get('/getOngkir', checkoutController.getOngkir)

module.exports = router;

