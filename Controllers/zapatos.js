module.exports = function Zapatos(zapatos) {
    this.items = zapatos.items || {};
    this.totalItems = zapatos.totalItems || 0;
    this.totalPrice = zapatos.totalPrice || 0;
    
    this.add = function(item, id) {
        var zapatoItem = this.items[id];
        if (!zapatoItem) {
            zapatoItem = this.items[id] = {item: item, quantity: 0, price: 0};
        }
        zapatoItem.quantity++;
        zapatoItem.price = item.precio * zapatoItem.quantity;
        this.totalItems++;
        this.totalPrice += item.precio;
        console.log(zapatos.items);
    };

    this.remove = function(id) {
        this.totalItems -= this.items[id].quantity;
        this.totalPrice -= this.items[id].price;
        delete this.items[id];
    };

    this.removeAll = function() {
        zapatos.items = {};
        zapatos.totalItems = 0;
        zapatos.totalPrice = 0;
    };
    
    this.getItems = function() {
        var arr = [];
        for (var id in this.items) {
            arr.push(this.items[id]);
        }
        return arr;
    };
    this.getItemsPaypal = function() {
        var arr = [];
        for (var id in this.items) {
            arr.push({
                "name":this.items[id].item.nombre,
                "sku": "001",
                "price":this.items[id].item.precio,
                "currency": "MXN",
                "quantity": this.items[id].quantity
            });
        }
        arr.push({
            "name": "Cargo por envío",
            "sku": "001",
            "price": 500,
            "currency": "MXN",
            "quantity": 1
        });
        return arr;
    };
    this.getTotalPrice = function() {
        var arr = {};
            arr = {
                "currency": "MXN",
                "total":(this.totalPrice + 500)
            };
        return arr;
    };
};