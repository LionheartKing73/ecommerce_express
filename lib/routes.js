var LANG, Promise, _;

_ = require('underscore');

Promise = require('bluebird');

LANG = 'en';

module.exports = function(app, client) {
  app.get('/', function(req, res) {
    return Promise.props({
      products: client.productProjections.fetch(),
      categories: client.categories.fetch()
    }).then(function(result) {
      return res.render('index', {
        title: 'Hello API',
        lang: LANG,
        products: result.products.body,
        categories: result.categories.body
      });
    })["catch"](function(e) {
      return res.status(400).json(e.body);
    });
  });
  app.get('/product/:id', function(req, res) {
    return client.productProjections.byId(req.params.id).fetch().then(function(result) {
      return res.render('product', {
        title: result.body.name[LANG],
        lang: LANG,
        product: result.body
      });
    })["catch"](function(e) {
      return res.status(400).json(e.body);
    });
  });
  return app.get('/category/:id', function(req, res) {
    return Promise.props({
      products: client.productProjections.where("categories(id = \"" + req.params.id + "\")").fetch(),
      categories: client.categories.fetch(),
      category: client.categories.byId(req.params.id).fetch()
    }).then(function(result) {
      return res.render('category', {
        title: 'Hello API',
        lang: LANG,
        products: result.products.body,
        categories: result.categories.body,
        category: result.category.body
      });
    })["catch"](function(e) {
      return res.status(400).json(e.body);
    });
  });
};
