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

//-----------------------------------ORDERS-----------------------------------------------
//UPDATE ORDER --admin only
router.patch('/orders/:id', authenticateUser, isAdmin, (req, res)=> {
    let orderId= req.params.id;
    let statusId= req.body.idStatus;

    let values= {
        orderId: orderId,
        statusId: statusId
    }

    sequelize.query('UPDATE orders SET status_id = :statusId WHERE id= :orderId', 
    {replacements: values})
    .then((r)=> {
        if (r[0].info.includes('Rows matched: 1')) {
            res.json({message: 'Order status changed successfully'});     
        } else {
            throw new Error();
        }
    })
    .catch(err=> res.status(404).json({status_code: 404}));
})

//DELETE ORDER
router.delete('/orders/:id', authenticateUser, isAdmin, (req, res)=> {
    let orderId= req.params.id;
    let values= [orderId];

    sequelize.query('DELETE FROM orders WHERE id= ?', {
    replacements: values
    })
    .then((r)=> {
        if (r[0].affectedRows== 0) {
            throw new Error();
        } else {
            res.json({message: 'Order deleted successfully'})
        }
    
    })
    .catch((err)=> res.status(404).json({status_code: 404}));

})

//SEE PENDING ORDERS --admin only
router.get('/orders/pending', authenticateUser, isAdmin, (req, res)=> {
    sequelize.query(`SELECT 
    orders.order_date,
    orders.id,
    orders.total_price,
    orders.user_id,
    CONCAT(users.name, ' ', users.last_name) AS name,
    users.address,
    status.status
    FROM orders
    JOIN users
    ON orders.user_id= users.id
    JOIN status 
    ON orders.status_id= status.id
    WHERE orders.status_id= 3
    ORDER BY order_date;
    `, 
    {type: sequelize.QueryTypes.SELECT})
    .then((c)=> {
        if (c.length > 0) { 
        for (let x=0; x<c.length; x++) {
            c[x].description= [];
            let values= [c[x].id];
            sequelize.query('SELECT order_products.order_id AS order_id, products.name AS product_name, order_products.amount AS amount from order_products JOIN PRODUCTS ON products.id= order_products.product_id WHERE order_products.order_id= ?', 
            { replacements: values,
            type: sequelize.QueryTypes.SELECT})
            .then((r)=> {
                for (let z=0; z< r.length; z++) {
                    if (r[z].order_id == c[x].id) {
                        c[x].description.push(`${r[z].amount}x ${r[z].product_name}`);
                    }
                }
                if (x== c.length-1) {
                    res.json(c);
                }
            })
        }
    } else {
        throw new Error();
    }
    })
    .catch(err=> res.status(404).json({status_code: 404}));
})

//SEE ORDERS IN PROGRESS --admin only
router.get('/orders/inprogress', authenticateUser, isAdmin, (req, res)=> {
    sequelize.query(`SELECT 
    orders.order_date,
    orders.id,
    orders.total_price,
    orders.user_id,
    CONCAT(users.name, ' ', users.last_name) AS name,
    users.address,
    status.status
    FROM orders
    JOIN users
    ON orders.user_id= users.id
    JOIN status 
    ON orders.status_id= status.id
    WHERE orders.status_id= 4
    ORDER BY order_date;
    `, 
    {type: sequelize.QueryTypes.SELECT})
    .then((c)=> {
        if (c.length >0) {
        for (let x=0; x<c.length; x++) {
            c[x].description= [];
            let values= [c[x].id];
            sequelize.query('SELECT order_products.order_id AS order_id, products.name AS product_name, order_products.amount AS amount from order_products JOIN PRODUCTS ON products.id= order_products.product_id WHERE order_products.order_id= ?', 
            { replacements: values,
            type: sequelize.QueryTypes.SELECT})
            .then((r)=> {
                for (let z=0; z< r.length; z++) {
                    if (r[z].order_id == c[x].id) {
                        c[x].description.push(`${r[z].amount}x ${r[z].product_name}`);
                    }
                }
                if (x== c.length-1) {
                    res.json(c);
                }
            })
        }
    } else {
        throw new Error();
    }
    })
    .catch(err=> res.status(404).json({status_code: 404}))
})

//SEE ORDERS THAT ARE READY --admin only
router.get('/orders/ready', authenticateUser, isAdmin, (req, res)=> {
    sequelize.query(`SELECT 
    orders.order_date,
    orders.id,
    orders.total_price,
    orders.user_id,
    CONCAT(users.name, ' ', users.last_name) AS name,
    users.address,
    status.status
    FROM orders
    JOIN users
    ON orders.user_id= users.id
    JOIN status 
    ON orders.status_id= status.id
    WHERE orders.status_id= 5
    ORDER BY order_date;
    `, 
    {type: sequelize.QueryTypes.SELECT})
    .then((c)=> {
        if (c.length>0) {
        for (let x=0; x<c.length; x++) {
            c[x].description= [];
            let values= [c[x].id];
            sequelize.query('SELECT order_products.order_id AS order_id, products.name AS product_name, order_products.amount AS amount from order_products JOIN PRODUCTS ON products.id= order_products.product_id WHERE order_products.order_id= ?', 
            { replacements: values,
            type: sequelize.QueryTypes.SELECT})
            .then((r)=> {
                for (let z=0; z< r.length; z++) {
                    if (r[z].order_id == c[x].id) {
                        c[x].description.push(`${r[z].amount}x ${r[z].product_name}`);
                    }
                }
                if (x== c.length-1) {
                    res.json(c);
                }
            })
        }
        } else {
            throw new Error();
        }
    })
    .catch(err=> res.status(404).json({status_code: 404}));
})

//SEE ORDERS THAT HAVE BEEN SHIPPED --admin only
router.get('/orders/shipped', authenticateUser, isAdmin, (req, res)=> {
    sequelize.query(`SELECT 
    orders.order_date,
    orders.id,
    orders.total_price,
    orders.user_id,
    CONCAT(users.name, ' ', users.last_name) AS name,
    users.address,
    status.status
    FROM orders
    JOIN users
    ON orders.user_id= users.id
    JOIN status 
    ON orders.status_id= status.id
    WHERE orders.status_id= 6
    ORDER BY order_date;
    `, 
    {type: sequelize.QueryTypes.SELECT})
    .then((c)=> {
        if (c.length>0) { 
        for (let x=0; x<c.length; x++) {
            c[x].description= [];
            let values= [c[x].id];
            sequelize.query('SELECT order_products.order_id AS order_id, products.name AS product_name, order_products.amount AS amount from order_products JOIN PRODUCTS ON products.id= order_products.product_id WHERE order_products.order_id= ?', 
            { replacements: values,
            type: sequelize.QueryTypes.SELECT})
            .then((r)=> {
                for (let z=0; z< r.length; z++) {
                    if (r[z].order_id == c[x].id) {
                        c[x].description.push(`${r[z].amount}x ${r[z].product_name}`);
                    }
                }
                if (x== c.length-1) {
                    res.json(c);
                }
            })
        }
        } else {
            throw new Error();
        }
    })
    .catch(err=> res.status(404).send());
})

//SEE ORDERS THAT HAVE BEEN DELIVERED --admin only
router.get('/orders/delivered', authenticateUser, isAdmin, (req, res)=> {
    sequelize.query(`SELECT 
    orders.order_date,
    orders.id,
    orders.total_price,
    orders.user_id,
    CONCAT(users.name, ' ', users.last_name) AS name,
    users.address,
    status.status
    FROM orders
    JOIN users
    ON orders.user_id= users.id
    JOIN status 
    ON orders.status_id= status.id
    WHERE orders.status_id= 7
    ORDER BY order_date;
    `, 
    {type: sequelize.QueryTypes.SELECT})
    .then((c)=> {
        if (c.length>0) { 
        for (let x=0; x<c.length; x++) {
            c[x].description= [];
            let values= [c[x].id];
            sequelize.query('SELECT order_products.order_id AS order_id, products.name AS product_name, order_products.amount AS amount from order_products JOIN PRODUCTS ON products.id= order_products.product_id WHERE order_products.order_id= ?', 
            { replacements: values,
            type: sequelize.QueryTypes.SELECT})
            .then((r)=> {
                for (let z=0; z< r.length; z++) {
                    if (r[z].order_id == c[x].id) {
                        c[x].description.push(`${r[z].amount}x ${r[z].product_name}`);
                    }
                }
                if (x== c.length-1) {
                    res.json(c);
                }
            })
        }
        } else { 
            throw new Error();
        }
    })
    .catch(err=> res.status(404).send());
})

//SEE CANCELLED ORDERS --admin only
router.get('/orders/cancelled', authenticateUser, isAdmin, (req, res)=> {
    sequelize.query(`SELECT 
    orders.order_date,
    orders.id,
    orders.total_price,
    orders.user_id,
    CONCAT(users.name, ' ', users.last_name) AS name,
    users.address,
    status.status
    FROM orders
    JOIN users
    ON orders.user_id= users.id
    JOIN status 
    ON orders.status_id= status.id
    WHERE orders.status_id= 8
    ORDER BY order_date;
    `, 
    {type: sequelize.QueryTypes.SELECT})
    .then((c)=> {
        if (c.length>0) { 
        for (let x=0; x<c.length; x++) {
            c[x].description= [];
            let values= [c[x].id];
            sequelize.query('SELECT order_products.order_id AS order_id, products.name AS product_name, order_products.amount AS amount from order_products JOIN PRODUCTS ON products.id= order_products.product_id WHERE order_products.order_id= ?', 
            { replacements: values,
            type: sequelize.QueryTypes.SELECT})
            .then((r)=> {
                for (let z=0; z< r.length; z++) {
                    if (r[z].order_id == c[x].id) {
                        c[x].description.push(`${r[z].amount}x ${r[z].product_name}`);
                    }
                }
                if (x== c.length-1) {
                    res.json(c);
                }
            })
        }
    } else {
        throw new Error();
    }
    })
    .catch(err=> res.status(404).send());
})

//SEE ALL ORDERS --admin only
router.get('/orders', authenticateUser, isAdmin, (req, res)=> {
    sequelize.query(`SELECT  
    orders.order_date,
    orders.id,
    orders.total_price,
    orders.user_id,
    CONCAT(users.name, ' ', users.last_name) AS name,
    users.address,
    status.status
    FROM orders
    JOIN users
        ON orders.user_id = users.id
    JOIN status
        ON orders.status_id= status.id
        ORDER BY order_date`, 
    {type: sequelize.QueryTypes.SELECT})
    .then((c)=> {
        if (c.length<=0) {
            throw new Error();
        }
        for (let x=0; x<c.length; x++) {
            c[x].description= [];
            let values= [c[x].id];
            sequelize.query('SELECT order_products.order_id AS order_id, products.name AS product_name, order_products.amount AS amount from order_products JOIN PRODUCTS ON products.id= order_products.product_id WHERE order_products.order_id= ?', 
            { replacements: values,
            type: sequelize.QueryTypes.SELECT})
            .then((r)=> {
                for (let z=0; z< r.length; z++) {
                    if (r[z].order_id == c[x].id) {
                        c[x].description.push(`${r[z].amount}x ${r[z].product_name}`);
                    }
                }
                if (x== c.length-1) {
                    res.json(c);
                } 
            })
        }
       
    })
    .catch(err=> res.status(404).send());
})

//SEE ONE ORDER
router.get('/orders/:id', authenticateUser, seeFullOrder, (req, res)=> {
    let orderId= req.params.id;
    let values = {
        orderId : orderId
    }

    sequelize.query('SELECT * FROM orders WHERE orders.id= :orderId', 
    { replacements: values,
    type: sequelize.QueryTypes.SELECT})
    .then((projects)=> {
        values.userId= projects[0].user_id;
        sequelize.query('SELECT products.name, order_products.price, order_products.amount FROM order_products JOIN products ON order_products.product_id= products.id  WHERE order_products.order_id = :orderId', 
        { replacements: values,
        type: sequelize.QueryTypes.SELECT})
        .then((result)=> {
            sequelize.query('SELECT sum(price) AS total_price FROM order_products WHERE order_id= :orderId', 
            { replacements: values,
            type: sequelize.QueryTypes.SELECT})
            .then((final)=> {
                result.push(final[0]);
                sequelize.query('SELECT status.status FROM orders JOIN status ON orders.status_id = status.id WHERE orders.id= :orderId', 
                { replacements: values,
                type: sequelize.QueryTypes.SELECT})
                .then((status)=> {
                    result.push(status[0]);
                    sequelize.query('SELECT users.address AS address, users.name AS name, users.last_name AS last_name, users.user AS username, users.email AS email, users.phone_number AS phone_number FROM orders JOIN users ON orders.user_id = users.id WHERE users.id= :userId', 
                    { replacements: values,
                    type: sequelize.QueryTypes.SELECT})
                    .then((address)=> {
                            let user= [address[0]]
                            result.push(user);
                            return res.json(result);
                        })
                    })
                })
            }) 
    })
})


module.exports= router;