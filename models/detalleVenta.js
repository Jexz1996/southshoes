var mongoose = require('mongoose');

module.exports = mongoose.model('DetalleVenta', {
    idCompra: { type: String},
    estado: { type: String},
    total: {
        type     : Number,
        validate : {
          validator : Number.isInteger,
          message   : '{VALUE} is not an integer value'
        }},
    idUsuario: { type: String},
});