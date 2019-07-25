const express = require('express');
const path = require('path');
const morgan = require('morgan');
const multer = require('multer');
const uuid = require('uuid/v4');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var mongoose = require('mongoose'); 
var bodyParser = require('body-parser');

//Initializations
const app = express();
var database = require('./database');  
mongoose.connect(process.env.CUSTOMCONNSTR_MyConnectionString || database.localUrl, {
  useNewUrlParser: true
})
.then(db => console.log('DB is connected'))
.catch(err => console.log(err));

mongoose.set('useFindAndModify', false);

//Settings
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//Middlewares
app.use(morgan('dev'));
app.use(express.urlencoded({extended : false}));
const storage = multer.diskStorage({
    destination: path.join(__dirname, 'public/img/uploads'),                                            
    filename: (req, file, cb, filename) => {
      cb(null, uuid() + path.extname(file.originalname));
    }
});
app.use(multer({storage: storage}).single('image'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true
}))
// res.locals is an object passed to hbs engine
app.use(function(req, res, next) {
  res.locals.session = req.session;
  next();
});


//Routes
app.use(require('./routes/index'));

//static files
app.use(express.static(path.join(__dirname, 'public')));

//start server
app.listen(app.get('port'), () => {
    console.log(`Server on port ${app.get('port')}`);
});