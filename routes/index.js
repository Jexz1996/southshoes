const {Router} = require('express');
const router = Router();
const { unlink } = require('fs-extra');
const path = require('path');

const Image = require('../models/Image');
const DetalleVenta = require('../models/detalleVenta');

var Zapatos = require('../Controllers/zapatos');
const paypal = require('paypal-rest-sdk');

paypal.configure({
  'mode': 'sandbox', //sandbox or live
  //'client_id': 'AQAiolW6zXXp4BkiP9OgwuChsc0GA4sXf-AKMPc_ziCGLLwIaCVyOA2I3R7RIQy_TeCq8gPWvvWRIun6',
  'client_id': 'AaJ49aCPVXamKehlAzEoE2u7I51QzalHlitL1zTrbdh7e4eh1I-t5yxOhSck6gqchQyKy_B-MdKGfh_a',
  //'client_secret': 'EFTXulvnICrBMepQsx-FydjVXOPHMOug3hKsTwKToWAPC37zyiDp3m3rMMQdVFfSpfjtll37a9Xz0obn'
  'client_secret': 'EOP7geo4jwNgJ1JUHzcrp0ZY0U0Ob7Ze76v71aoOdRaukR2P5rKOAgNWXb52MISp0QzPk5fkc5RPdZWC'
});

router.get('/', async (req, res) =>{
    const images = await Image.find();
    const images2 = await Image.find().sort({$natural:-1}).limit(2); 
    res.render('index',{ images, images2 });
});
router.get('/upload', (req, res) => {
    res.render('upload');
});
router.post('/upload', async (req, res) => {
    const image = new Image();
    image.nombre = req.body.nombre;
    image.apellidos = req.body.apellidos;
    image.genero = req.body.genero;
    image.precio = 5;
    image.stock = 5;
    image.filename = req.file.filename;
    image.path = '/img/uploads/' + req.file.filename;
    image.originalname = req.file.originalname;
    image.mimetype = req.file.mimetype;
    image.size = req.file.size;
    
    await image.save();

    res.redirect('/');
});
router.get('/image/:id', async ( req, res) => {
    const {id} = req.params;
    const image = await Image.findById(id);
    res.render('delete', { image });
});
router.get('/image/:id/delete', async (req, res) => {
    const {id} = req.params;
    const image = await Image.remove({_id: id});
    await unlink(path.resolve('./public/' + image.path));
    res.redirect('/');
});
router.get('/producto/detalle/:id', async (req, res) => {
    const {id} = req.params;
    const producto = await Image.findById(id);
    const productos = await Image.find();
    res.render('detalle', { producto, productos });
});
router.get('/imageedit/:id', async ( req, res) => {
    const {id} = req.params;
    const image = await Image.findById(id);
    res.render('edit', { image });
});
router.post('/image/:id/edit', async (req, res) => {
    const id = req.body.id;
    var filename_;
    var path_;
    var originalname_;
    var mimetype_;
    var size_;
    const image = await Image.findById(id);
    if(req.file != null){
        await unlink(path.resolve('./public/' + image.path));
        filename_ = req.file.filename;
        path_ = '/img/uploads/' + req.file.filename;
        originalname_ = req.file.originalname;
        mimetype_ = req.file.mimetype;
        size_ = req.file.size;
    }else{       
        filename_ = image.filename;
        path_ = image.path;
        originalname_ = image.originalname;
        mimetype_ = image.mimetype;
        size_ = image.size;
    }
    let image_ = {
            nombre : req.body.nombre,
            apellidos : req.body.apellidos,
            genero : req.body.genero,
            filename : filename_, 
            path : path_,
            originalname : originalname_,
            mimetype : mimetype_,
            size : size_,
            precio : 150
        }      
    await Image.findByIdAndUpdate(id, image_);
    res.redirect('/');
});
router.get('/add/:id', async (req, res) => {
    var productId = req.params.id;
    var cart = new Zapatos(req.session.zapatos ? req.session.zapatos : {});
    const zapato = await Image.findById(productId);
    console.log( cart.getItems());
    if(cart.getItems() != 0){
        cart.getItems().forEach(async function(element) {  
            if(element.item._id == productId)   {
                if((zapato.stock - element.quantity)==0 ){    
                    console.log('no se puede descontar');                
                }
                else{
                    cart.add(zapato, productId);
                    req.session.zapatos = cart;
                }
            }
        });     
    }
    else{
        cart.add(zapato, productId);
        req.session.zapatos = cart;
    }
    console.log( cart.getItems());     
    res.redirect('/');
  });
router.get('/cart', function(req, res) {
    if (!req.session.zapatos) {
      return res.render('cart', {
        products: null
      });
    }else{
        var cart = new Zapatos(req.session.zapatos);
        res.render('cart', {
          products: cart.getItems()
        });
    }
   
});
router.get('/remove/:id', function(req, res) {
    var productId = req.params.id;
    var borrado = req.body.num;
    console.log(borrado);
    var cart = new Zapatos(req.session.zapatos ? req.session.zapatos : {});
    cart.remove(productId);
    req.session.zapatos = cart;
    res.redirect('/cart');
});
router.post('/pay', (req, res) => {
    var cart = new Zapatos(req.session.zapatos);
    const create_payment_json = {
      "intent": "sale",
      "payer": {
          "payment_method": "paypal"
      },
      "redirect_urls": {
          "return_url": "http://localhost:3000/success",
          "cancel_url": "http://localhost:3000/cancel"
      },
      "transactions": [{
          "item_list": {
              "items": cart.getItemsPaypal()
          },
          "amount": cart.getTotalPrice()
          ,
          "description": "Hat for the best team ever"
      }]
};
paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
        throw error;
    } else {
        for(let i = 0;i < payment.links.length;i++){
          if(payment.links[i].rel === 'approval_url'){
            res.redirect(payment.links[i].href);
          }
        }
    }
  });
});
router.get('/success', (req, res) => {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
    var cart = new Zapatos(req.session.zapatos);
    const execute_payment_json = {
      "payer_id": payerId
    };
    paypal.payment.execute(paymentId, execute_payment_json, async function (error, payment) {
      if (error) {
          console.log(error.response);
          throw error;
      } else {
          const detalleVenta = new DetalleVenta();
          detalleVenta.idCompra = paymentId;
          detalleVenta.estado = "Fase Inicial";
          detalleVenta.total = cart.totalPrice;
          detalleVenta.idUsuario = "241ab";
          
          await detalleVenta.save();
               console.log(cart.getItems())
               
          cart.getItems().forEach(async function(element) {
                console.log(element.item.stock - element.quantity)
                let stock = {                   
                    nombre : element.item.nombre,
                    apellidos : element.item.apellidos,
                    genero : element.item.genero,
                    filename : element.item.filename, 
                    path : element.item.path,
                    originalname : element.item.originalname,
                    mimetype : element.item.mimetype,
                    size : element.item.size,
                    precio : element.item.precio,
                    stock : (element.item.stock - element.quantity)
                }      
            await Image.findByIdAndUpdate(element.item._id, stock);
            });                      
          cart.removeAll();
          res.send('Success');
      }
  });
});
router.get('/seguimiento', async (req, res) =>{
    const seguimiento = await DetalleVenta.find({idUsuario: "241ab" });
    res.render('seguimiento',{ seguimiento});
});


//inicio Rutas BackEnd

router.get('/BackIndex', async (req, res) =>{
    res.render('BackIndex');
});

router.get('/BackCatalog', async (req, res) =>{
  const images = await Image.find();
  const images2 = await Image.find().sort({$natural:-1}).limit(2); 
    res.render('BackCatalog', { images, images2 } );
});

router.get('/BackCatalogCreate', async (req, res) =>{
    res.render('BackCatalogCreate');
});

router.get('/BackComprasRealizadas', async(req, res) =>{
  const ventas = await DetalleVenta.find();
  res.render('BackVentasRealizadas',{ventas});
});

router.get('/BackComprasRealizadas/:id/delete', async (req, res) => {
    const {id} = req.params;
    const ventas = await DetalleVenta.remove({_id: id});
    res.redirect('/BackComprasRealizadas');
});

router.post('/Backupload', async (req, res) => {
    const image = new Image();
    image.modelo = req.body.modelo;
    image.descripcion = req.body.descripcion;
    image.precio = req.body.precio;
    image.stock = req.body.stock;
    image.filename = req.file.filename;
    image.path = '/img/uploads/' + req.file.filename;
    image.originalname = req.file.originalname;
    image.mimetype = req.file.mimetype;
    image.size = req.file.size;
    
    await image.save();

    res.redirect('/BackCatalog');
});

router.get('/Backedit/:id', async (req, res) =>{
  const {id} = req.params;
  const images = await Image.findById(id);
  
    res.render('Backedit',  { images});
});

router.post('/Backedit/:id/edit', async (req, res) => {
    const id = req.body.id;
    var filename_;
    var path_;
    var originalname_;
    var mimetype_;
    var size_;
    const image = await Image.findById(id);
    if(req.file != null){
        await unlink(path.resolve('./public/' + image.path));
        filename_ = req.file.filename;
        path_ = '/img/uploads/' + req.file.filename;
        originalname_ = req.file.originalname;
        mimetype_ = req.file.mimetype;
        size_ = req.file.size;
    }else{       
        filename_ = image.filename;
        path_ = image.path;
        originalname_ = image.originalname;
        mimetype_ = image.mimetype;
        size_ = image.size;
    }
    let image_ = {
            modelo : req.body.modelo,
            descripcion : req.body.descripcion,
            precio : req.body.precio,
            stock : req.body.stock,
            filename : filename_, 
            path : path_,
            originalname : originalname_,
            mimetype : mimetype_,
            size : size_
        }      
    await Image.findByIdAndUpdate(id, image_);
    res.redirect('/BackCatalog');
});

router.get('/Backedit/:id/delete', async (req, res) => {
    const {id} = req.params;
    const image = await Image.remove({_id: id});
    console.log(image.path);
    await unlink(path.resolve('./public/' + image.path));
    res.redirect('/BackCatalog');
});

//Fin rutas Backend


module.exports = router;