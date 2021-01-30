const jwt= require('jsonwebtoken');
const md5= require('md5');
const sequelize= require('../database/connection');
const jwtPass = process.env.JWT_PASS;

//-------------------------------------MIDDLEWARE---------------------------------------//
const seeFullOrder= (req, res, next) => {
    try {
        let orderId= req.params.id; //la orden tiene un status de 1 o 2?
        let admin= req.user.admin; //Si es true, el usuario es admin? Si es, dejalo pasar, sino 404
        let values= [orderId];

        sequelize.query('SELECT * FROM orders WHERE id= ?', 
        { replacements: values,
        type: sequelize.QueryTypes.SELECT}
        ).then(function(projects) {
            if (projects[0].status_id == 1 || projects[0].status_id == 2) {
                if (admin == 1) {
                    return next();
                } else if (admin == 0) {
                    res.status(404).send();
                }
            } else {
                return next();
            }
        })
    }
    catch(err) {
        res.json({error: 'No autorizado'})
    }
}

const hashPassword= (req, res,next) => {
    let password= req.body.password;
    req.body.password= md5(password);
    next();
}

const authenticateUser= (req, res, next) => { 
    try {
        const token= req.headers.authorization.split(' ')[1];
        const verifyToken= jwt.verify(token, jwtPass);
        if (verifyToken) {
            req.user= verifyToken;
            return next();
        }
    }
    catch(err) {
        res.status(400).json({message: 'Header must contain JWT to verify identity'});
    }
}

const isAdmin= (req, res, next) => { 
    try {
        const token= req.headers.authorization.split(' ')[1];
        const verifyToken= jwt.verify(token, jwtPass);
            if (verifyToken.admin=== '1') {
                return next()
            }
        throw new Error();
    }
    catch(err) {
        res.status(403).json({message: 'Forbidden'});
    }

}

const isSameUser= (req, res, next) => {
    try {
        let id= req.params.id;
        const token= req.headers.authorization.split(' ')[1];
        const verifyToken= jwt.verify(token, jwtPass);
            if (verifyToken.admin == 1) {
                return next();
            } else if (verifyToken.user_id == id) {
                return next();
            }
            throw new Error();
    }
    catch(err) {
        res.status(403).json({status_code: 403, message: 'Forbidden'});
    }
}

const doesProductExist= (req, res, next) => {
    try {
        let productId= req.params.idProduct;
        let values= [productId];

        sequelize.query('SELECT * FROM products WHERE id= ?', 
        { replacements: values,
        type: sequelize.QueryTypes.SELECT}
        ).then(function(projects) {
            if (projects.length== 0) {
                throw new Error();
            } else {
                return next();
            }
        })
        .catch(err=> res.status(404).json({status_code: 404}));
    }
    catch(err) {
        res.status(404).json({status_code: 404})
    }
}



module.exports= {
    seeFullOrder,
    hashPassword,
    authenticateUser,
    isAdmin,
    isSameUser,
    doesProductExist
}