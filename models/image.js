var mongoose = require('mongoose');

module.exports = mongoose.model('Image2', {
    modelo: { type: String},
    descripcion: { type: String},
   //genero: { type: String},
    precio: { type: Number },
    filename : { type: String},
    path: { type: String},
    originalname: { type: String},
    mimetype: { type: String},
    size: { type: Number},
    stock: {
        type     : Number,
        validate : {
          validator : Number.isInteger,
          message   : '{VALUE} is not an integer value'
        }},
    create_at: { type: Date, default: Date.now()}
});