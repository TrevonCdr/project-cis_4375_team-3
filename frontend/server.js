var express = require('express');
var app = express();
var path = require('path');
const port = 8080;

app.set("views", path.resolve(__dirname, "views"));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('pages/index.ejs')
})

app.listen(port);
console.log('listening for request on port' + port);