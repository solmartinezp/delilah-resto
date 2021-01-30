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


// ----------------------------------PRODUCTS----------------------------------------------
// GET ALL PRODUCTS
router.get('/products',  authenticateUser, (req, res)=> {
    sequelize.query('SELECT id, name, description, price FROM products WHERE stock > 0', 
    { type: sequelize.QueryTypes.SELECT}
    ).then(function(projects) {
        res.json(projects);
    })
    .catch(err=> res.status(404).json({status_code: 404}));
})

//CREATE NEW PRODUCT-- admin only
router.post('/products', authenticateUser, isAdmin, (req, res)=> {
    let o = {
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        stock: req.body.stock,
    }

    let values= {name: o.name,
                description: o.description,
                price: o.price,
                stock: o.price
            };


    sequelize.query('SELECT * FROM products WHERE name= :name', 
    { replacements: values,
    type: sequelize.QueryTypes.SELECT}
    ).then((projects) => {
        if (projects.length>=1) {
            return res.status(400).json({message: 'Product already exists'});
        } 
        sequelize.query('INSERT INTO products (name, description, price, stock) VALUES (:name, :description, :price, :stock)', {
        replacements: values})
            .then((c)=> {
                res.status(201).json({message: 'New Product'});
            })
    }) 
})

//UPDATE PRODUCT-- admin only
router.patch('/products/:id', authenticateUser, isAdmin, (req,res)=> {
    let id_pro= req.params.id;
    
    let o = {
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        stock: req.body.stock,
    }

    let a= {};
    for (const property in o) {
        if (o[property]== undefined) {
            console.log('Skip');
        } else {
            a[`${property}`]= o[property];
        }
    }

    let stringOne= 'UPDATE products SET ';
    let stringTwo= [];
    for (const nuevo in a) {
        stringTwo.push(` ${nuevo} = '${a[nuevo]}'`);
    }
    let stringThree= ` WHERE ID= ${id_pro}`

    let stringFour= stringOne + stringTwo + stringThree;

    sequelize.query(stringFour)
    .then((r)=> {
        if (r[0].info.includes('Rows matched: 1')) {
            res.json({message: 'Product updated'});     
        } else {
            throw new Error();
        }
    })
    .catch((err)=> res.status(404).json({status_code: 404}));
})

//DELETE PRODUCT --admin only
router.delete('/products/:id', authenticateUser, isAdmin, (req, res)=> {
    let id_pro= req.params.id;
    let values= [id_pro];

    sequelize.query('DELETE FROM products WHERE id= ?', {
    replacements: values
    })
    .then((r)=> {
        if (r[0].affectedRows== 0) {
            throw new Error();
        } else {
            res.json({message: 'Product deleted'})
        }
    
    })
    .catch((err)=> res.status(404).json({status_code: 404}));
})

module.exports= router;