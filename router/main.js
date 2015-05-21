module.exports = function(app) {

    app.get('/', function(req, res) {
        res.render('index2.html');
    });

    app.get('/2', function(req, res) {
        res.render('index.html');
    });
}
