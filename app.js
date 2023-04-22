const express = require('express');
const mysql = require('mysql');
const dotenv = require('dotenv');
const path = require("path");
const app = express();
const hbs = require('hbs');
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser")
app.use(bodyParser.text({type: '/'}));
dotenv.config({
    path: "./.env"
});
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DATABASE
});

db.connect((err) => {
    if (err) { console.log(err) } else { console.log("Data_Base connection successfull") }
})

// app.use(express.urlencoded());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
const location = path.join(__dirname, "./public")
app.use(express.static(location))
app.set('view engine', 'hbs');

const partialPath = path.join(__dirname, "./views/partials")
hbs.registerPartials(partialPath);


app.use('/', require('./routes/pages'));
app.use('/auth', require('./routes/auth'));

app.listen(5000, () => {
    console.log("Server started @ port 5000")
})

