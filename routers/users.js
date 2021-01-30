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

//-------------------------------------USERS---------------------------------------//

//-------------------------------------REGISTER-----------------------------------------//
router.post('/users/register', hashPassword, (req, res)=> {
    let o = {
        user: req.body.user,
        name: req.body.name,
        last_name: req.body.last_name,
        password: req.body.password,
        email: req.body.email,
        phone_number: req.body.phone_number,
        address: req.body.address,
        admin: req.body.admin
    }

    let values= {user: o.user,
                name: o.name,
                last_name: o.last_name,
                password: o.password, 
                email: o.email,
                phone_number: o.phone_number,
                address: o.address,
                admin: o.admin
            };

    sequelize.query('SELECT * FROM users WHERE user= :user OR email= :email', 
    { replacements: values,
    type: sequelize.QueryTypes.SELECT}
    ).then((projects) => {
        if (projects.length>=1) {
            return res.status(400).json({status_code: 400, message: 'User already exists'});
        } 
        sequelize.query('INSERT INTO USERS (user, password, name, last_name, email, phone_number, address, admin) VALUES (:user, :password, :name, :last_name, :email, :phone_number, :address, :admin)', {
            replacements: values})
        .then((c)=> res.status(201).send('New User has been created'))
        .catch(err=> console.error(err));
    }) 
})

//-------------------------------------LOGIN-----------------------------------------//
router.post('/users/login', hashPassword, (req, res)=> {
    let o = {
        user: req.body.user,
        password: req.body.password,
    }

    let values= {user: o.user,
                password: o.password, 
    };

    sequelize.query('SELECT * FROM users WHERE user= :user', 
    { replacements: values,
    type: sequelize.QueryTypes.SELECT}
    ).then((projects) => {
        if (projects.length>=1) {
            if (projects[0].password == o.password) {
                var j = {
                    user: projects[0].user,
                    user_id: projects[0].id,
                    admin: projects[0].admin
                }
                var token = jwt.sign( j, jwtPass);
                return res.status(200).json({token: token}); //.send si no funciona
            }
        } 
        return res.status(400).json({status_code: 400, message: 'Incorrect user or password'}); 
    }) 
})

//ALL USERS (ADMIN ONLY)
router.get('/users', authenticateUser, isAdmin, (req, res)=> {
    sequelize.query('SELECT * FROM users', 
    { type: sequelize.QueryTypes.SELECT}
    ).then(function(projects) {
        res.json(projects);
    })
    .catch(err=> res.status(404).json({status_code: 404}));
})

//GET ONE USER 
router.get('/users/:id', authenticateUser, isSameUser, (req, res)=> {
    let values= [req.params.id];
    sequelize.query('SELECT * FROM users WHERE id= ?', 
    { replacements: values,
    type: sequelize.QueryTypes.SELECT}
    ).then(function(projects) {
        if (projects.length <= 0) {
            throw new Error();
        } else {
            return res.json(projects)
        }
    })
    .catch(err=> res.status(404).json({status_code: 404}));
})  

//-------------------------------FAVORITES-------------------------------------------------
//GET ALL FAVORITES
router.get('/users/:id/favorites', authenticateUser, isSameUser, (req, res)=> {
    let id= req.params.id;
    let values= [id];

    sequelize.query('SELECT * FROM favorites WHERE user_id= ?', 
    { replacements: values,
    type: sequelize.QueryTypes.SELECT}
    ).then((projects) => {
        if (projects.length>0) {
            sequelize.query('SELECT products.name AS product_name, products.price AS product_price FROM favorites JOIN products ON favorites.product_id = products.id WHERE favorites.user_id= ?', 
            { replacements: values,
            type: sequelize.QueryTypes.SELECT}
            ).then((c)=> {
                return res.json(c)
            })
        } else {
            return res.send('Favorites empty');
        }
    })
    .catch((err)=> res.status(404).json({status_code: 404}));
})

//ADD A FAVORITE
router.post('/users/:id/products/:idProduct/favorites', authenticateUser, (req, res)=> {
    let id_user= req.params.id;
    let id_prod= req.params.idProduct
    let values= [id_user, id_prod];

    sequelize.query('SELECT * FROM favorites WHERE user_id= ? AND product_id= ?', 
    { replacements: values,
    type: sequelize.QueryTypes.SELECT}
    ).then((projects) => {
        if (projects.length>0) {
            return res.status(400).json({message: 'The product has already been added to Favorites'});
        } 
        sequelize.query('INSERT INTO favorites (user_id, product_id) VALUES (?, ?)', {
            replacements: values})
        .then((c)=> res.status(200).json({message: 'Added to Favorites'}))
        .catch((err)=> res.status(404).json({status_code: 404}));
    })
    
})

//DELETE FAVORITE
router.delete('/users/:id/favorites/:idProd', authenticateUser, isSameUser, (req, res) => {
    let id_user= req.params.id;
    let id_prod= req.params.idProd
    let values= [id_user, id_prod];

    sequelize.query('DELETE FROM favorites WHERE user_id= ? AND product_id=?', 
    { replacements: values})
    .then((r)=> {
        if (r[0].affectedRows== 0) {
            throw new Error();
        } else { 
        res.json({message: 'Deleted from Favorites'})
        }
    })
    .catch((err)=>res.status(404).json({status_code: 404}));
  });


module.exports= router;