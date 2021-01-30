const express= require('express');
const jwt= require('jsonwebtoken');
const jwtPass = process.env.JWT_PASS;
const sequelize= require('../database/connection');
const bodyParser = require('body-parser');
const cors = require('cors');
const {seeFullOrder, hashPassword, authenticateUser, isAdmin, isSameUser} = require('../middlewares/middlewares');

//CREATE NEW ROUTER
const router= new express.Router();

router.use(express.json());
router.use(cors());
router.use( bodyParser.json() );       
router.use(bodyParser.urlencoded({ extended: false }));

// //------------------------------------CHECKOUT---------------------------------------------
// //CONFIRM PAYMENT --CHANGE STATUS
router.patch('/checkout/orders/:id', authenticateUser, (req, res)=> {
    const id= req.user.user_id;
    let orderId= req.params.id;

    let values= {
        userId: id,
        orderId: orderId,
        statusId: 2
    }

    sequelize.query('UPDATE orders SET status_id = :statusId WHERE id= :orderId AND user_id= :userId', 
    {replacements: values})
    .then((r)=> {
        if (r[0].info.includes('Rows matched: 1')) {
            res.json({message: 'Payment confirmed'});     
        } else {
            throw new Error();
        }
    })
    .catch(err=> res.status(404).json({status_code: 404}));
})

module.exports= router;