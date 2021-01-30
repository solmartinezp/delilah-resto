const express= require('express');
const jwt= require('jsonwebtoken');
const jwtPass = process.env.JWT_PASS;
const sequelize= require('../database/connection');
const bodyParser = require('body-parser');
const cors = require('cors');
const {seeFullOrder, hashPassword, authenticateUser, isAdmin, isSameUser, doesProductExist} = require('../middlewares/middlewares');

//CREATE NEW ROUTER
const router= new express.Router();

router.use(express.json());
router.use(cors());
router.use( bodyParser.json() );       
router.use(bodyParser.urlencoded({ extended: false }));

//-----------------------------------CART-----------------------------------------------------
//ADD TO CART
router.post('/cart/orders/products/:idProduct', authenticateUser, doesProductExist, (req, res)=> {
    const id= req.user.user_id;
    const id_prod= req.params.idProduct;
    let values= {
        user_id: id,
        status_id: 1,
        product_id: id_prod
    };
    
    sequelize.query('SELECT * FROM orders WHERE user_id = :user_id  AND status_id= 1', 
    { replacements: values,
    type: sequelize.QueryTypes.SELECT}
    ).then(function(projects) {
        if (projects.length> 0) {
            values.orderId= projects[0].id;
         //YA HAY UN CARRITO EXISTENTE, AGREGAR EL PRODUCTO AL CARRITO
            //Si el producto ya está en el carrito, le cambio la cantidad
            sequelize.query('SELECT * FROM order_products WHERE product_id = :product_id AND order_id= :orderId', 
            { replacements: values,
            type: sequelize.QueryTypes.SELECT})
            .then((product)=> {
                if(product.length>0) {
                    values.newAmount= product[0].amount+1;
                    values.newPrice= product[0].price * values.newAmount;
                    sequelize.query(`UPDATE order_products SET amount = :newAmount, price= :newPrice WHERE order_id= :orderId AND product_id= :product_id`, 
                    { replacements: values})
                    .then((r)=> {
                        sequelize.query('SELECT sum(price) AS total FROM order_products WHERE order_id= :orderId', 
                        { replacements: values,
                        type: sequelize.QueryTypes.SELECT})
                        .then((sumPrice)=> {
                        values.totalPrice= sumPrice[0].total;
                        sequelize.query('UPDATE orders SET total_price= :totalPrice WHERE id= :orderId', 
                        { replacements: values})
                            .then((r)=> {
                                res.json({message: 'Updated amount and price'});
                            })
                        })   
                    })
                } else { //Si el producto no está en el carrito, lo agrego
                    sequelize.query('SELECT * FROM products WHERE id= :product_id', 
                    { replacements: values, 
                        type: sequelize.QueryTypes.SELECT}
                    )
                    .then((pr) => { 
                        values.orderId= projects[0].id;
                        values.price= pr[0].price;
                        sequelize.query('INSERT INTO order_products (order_id, product_id, amount, price) VALUES (:orderId, :product_id, 1, :price)', 
                        { replacements: values})
                        .then((r)=> {
                            sequelize.query('SELECT sum(price) AS total FROM order_products WHERE order_id= :orderId', 
                            { replacements: values,
                            type: sequelize.QueryTypes.SELECT}
                            ).then((sumPrice)=> {
                            values.totalPrice= sumPrice[0].total;
                            sequelize.query('UPDATE orders SET total_price= :totalPrice WHERE id= :orderId', 
                            { replacements: values})
                                .then((r)=> {
                                    res.json({message: 'Added to cart'});
                                })
                            })   
                        })
                    })
                }
            })
        
        } else  {
        //creo la orden con el estado 1    
            sequelize.query('INSERT INTO orders (user_id, status_id, total_price) VALUES (:user_id, :status_id, 0)', 
            { replacements: values}
            ).then((projects)=> {
                values.idOrder= projects[0];
                sequelize.query('SELECT products.price AS product_price FROM products WHERE products.id = :product_id', 
                { replacements: values,
                type: sequelize.QueryTypes.SELECT}
                ).then((priceObject)=> {
                    values.productPrice= priceObject[0].product_price;
                    sequelize.query('INSERT INTO order_products (order_id, product_id, amount, price) VALUES (:idOrder, :product_id, 1, :productPrice)', 
                    { replacements: values}
                        ).then((result)=> {
                            sequelize.query('SELECT sum(price) AS total FROM order_products WHERE order_id= :idOrder', 
                            { replacements: values,
                            type: sequelize.QueryTypes.SELECT}
                            ).then((sumPrice)=> {
                            values.totalPrice= sumPrice[0].total;
                            sequelize.query('UPDATE orders SET total_price= :totalPrice WHERE id= :idOrder', 
                            { replacements: values})
                                .then((r)=> {
                                    res.json({message: 'Added to cart'});
                                })
                            })
                        })
                })
            })
        }
    })

})

//DELETE PRODUCT FROM CART
router.delete('/cart/orders/:idOrder/products/:idProduct', authenticateUser, (req, res)=> {
    let idOrder= req.params.idOrder;
    let idProd= req.params.idProduct;

    let values= {
        idOrder: idOrder,
        idProd: idProd
    }

    sequelize.query('SELECT * from order_products WHERE order_id = :idOrder', 
    { replacements: values, 
    type: sequelize.QueryTypes.SELECT})
        .then((r)=> {
            if (r== '[]') {
                throw new Error();
            }
            sequelize.query('DELETE from order_products WHERE product_id= :idProd', 
            { replacements: values})
            .then((c)=> {
                if (c[0].affectedRows== 0) {
                    throw new Error();
                } else { 
                    sequelize.query('SELECT sum(price) AS total FROM order_products WHERE order_id= :idOrder', 
                    { replacements: values,
                    type: sequelize.QueryTypes.SELECT}
                    ).then((sumPrice)=> {
                    values.totalPrice= sumPrice[0].total;
                    sequelize.query('UPDATE orders SET total_price= :totalPrice WHERE id= :idOrder', 
                    { replacements: values})
                        .then((s)=> {
                            res.json({message: 'Product removed from shopping cart'});
                        })
                    }) 
                }
            })
            .catch(err=> res.status(404).json({status_code: 404}));
        })
        
})

//SEE CART
router.get('/cart/orders/:id', authenticateUser, (req, res)=> {
    const id= req.user.user_id;
    let orderId= req.params.id;

    let values= {
        userId: id,
        orderId: orderId
    }

    let array= [];
    let obj = {};
    sequelize.query('SELECT * FROM orders WHERE orders.id= :orderId', 
    { replacements: values,
    type: sequelize.QueryTypes.SELECT}
    ).then((projects)=> {
        if (!projects[0].total_price) {
            return res.send('Empty shopping cart');
        }
        if (projects[0].status_id == 1 ) {
            sequelize.query('SELECT products.name, order_products.price, order_products.amount FROM order_products JOIN products ON order_products.product_id= products.id  WHERE order_products.order_id = :orderId ', 
            { replacements: values,
            type: sequelize.QueryTypes.SELECT})
            .then((result)=> {
                sequelize.query('SELECT sum(price) AS total_price FROM order_products WHERE order_id= :orderId', 
                { replacements: values,
                type: sequelize.QueryTypes.SELECT})
                .then((final)=> {
                    result.push(final[0]);
                    sequelize.query('SELECT users.address FROM orders JOIN users ON orders.user_id = users.id WHERE users.id= :userId', 
                    { replacements: values,
                    type: sequelize.QueryTypes.SELECT})
                    .then((address)=> {
                        result.push(address[0]);
                        res.json(result);
                    })
                })
            })
        }
        
    }).catch(err=> res.status(404).json({status_code: 404}));

})


module.exports= router;