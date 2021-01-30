const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const jwt= require('jsonwebtoken');
const jwtPass = process.env.JWT_PASS;
const sequelize= require('./database/connection');
const md5= require('md5');
const userRoute= require('./routers/users');
const productsRoute= require('./routers/products');
const cartRoute= require('./routers/cart');
const checkoutRoute= require('./routers/checkout');
const orderRoute= require('./routers/orders');

const port= process.env.PORT;

app.use(helmet());
app.use(express.json());
app.use(cors());
app.use( bodyParser.json() );       
app.use(bodyParser.urlencoded({ extended: false }));

app.use(userRoute);
app.use(productsRoute);
app.use(cartRoute);
app.use(checkoutRoute);
app.use(orderRoute);

app.listen(port, ()=> {
    console.log('Server is up on port '+ port);
});
