var Seq         = require(__dirname + '/..'),
    jaz         = require('jaz-toolkit'),
    mysql       = require('mysql'),
    TEST_CONFIG = require(__dirname + '/test_config'),
    client      = mysql.createClient(TEST_CONFIG);

module.exports.modelDefinition = {
  setUp: function(cb) {
    var db  = Seq.create(TEST_CONFIG);
    this.db = db;
    client.query("DROP TABLE items;", function() {
      Seq.createTable('items', function(table) {
        table.addColumn('name', Seq.dataTypes.VARCHAR());
        table.addColumn('price', Seq.dataTypes.INT());
        table.addTimestamps();
      });
      cb();
    });
  },
  'test creating a model using data types': function(test) {
    var Item = Seq.defineModel('Item', {
      name: Seq.dataTypes.VARCHAR(),
      price: Seq.dataTypes.INT(),
      createdAt: Seq.dataTypes.DATETIME(),
      updatedAt: Seq.dataTypes.DATETIME()
    });
    test.equal(typeof Item, 'object');
    test.equal(Item.name, 'Item');
    test.equal(Item.tableName, 'items');
    test.done();
  },
  'test getting tableName': function(test) {
    var Miss = Seq.defineModel('Miss', {
    });
    test.equal(Miss.tableName, 'miss', 'don\'t append a plural s at the end, if there is alredy one');
    test.done();
  },
  'test creating a model has fields': function(test) {
    var Item = Seq.defineModel('Item', {
      name: Seq.dataTypes.VARCHAR(),
      price: Seq.dataTypes.INT(),
      createdAt: Seq.dataTypes.DATETIME(),
      updatedAt: Seq.dataTypes.DATETIME()
    });
    test.equal(Item.fields.length, 5);
    test.ok(Item.fields.indexOf('id') !== -1);
    test.ok(Item.fields.indexOf('name') !== -1);
    test.ok(Item.fields.indexOf('price') !== -1);
    test.ok(Item.fields.indexOf('createdAt') !== -1);
    test.ok(Item.fields.indexOf('updatedAt') !== -1);
    test.done();
  },
  'test create model from migration': function(test) {
    var Item = Seq.defineModel('Item', Seq.getTableFromMigration('items'));
    test.equal(Item.fields.length, 5);
    test.ok(Item.fields.indexOf('id') !== -1);
    test.ok(Item.fields.indexOf('name') !== -1);
    test.ok(Item.fields.indexOf('price') !== -1);
    test.ok(Item.fields.indexOf('createdAt') !== -1);
    test.ok(Item.fields.indexOf('updatedAt') !== -1);
    test.done();
  },
  'test retrieving of Model through SequelORM class': function(test) {
    var Item = Seq.getModel('Item');
    test.equal(Item.fields.length, 5);
    test.ok(Item.fields[0], 'id');
    test.ok(Item.fields[1], 'name');
    test.ok(Item.fields[2], 'price');
    test.ok(Item.fields[3], 'createdAt');
    test.ok(Item.fields[4], 'updatedAt');
    test.done();
  }
};

module.exports.modelInstanciation = {
  setUp: function(cb) {
    var db  = Seq.create(TEST_CONFIG);
    this.db = db;
    client.query("DROP TABLE items;", function() {
      Seq.createTable('items', function(table) {
        table.addColumn('name', Seq.dataTypes.VARCHAR());
        table.addColumn('price', Seq.dataTypes.INT());
        table.addTimestamps();
      });
      db.createTable('items', function(table) {
        table.addColumn('name', Seq.dataTypes.VARCHAR());
        table.addColumn('price', Seq.dataTypes.INT());
        table.addTimestamps();
      }, function() {
        cb();
      });
    });
  },
  'test creating an instance with some given data': function(test) {
    var Item = Seq.getModel('Item'),
        item = Item.create({
          name: 'John',
          price: 42
        });
    test.equal(item.id, null);
    test.equal(item.name, 'John');
    test.equal(item.price, 42);
    test.equal(item.createdAt, null);
    test.equal(item.updatedAt, null);
    test.done();
  },
  'test if element is marked as new and dirty': function(test) {
    var Item = Seq.getModel('Item'),
        item = Item.create({
          name: 'John',
          price: 42
        });
    test.equal(item.isNew, true);
    test.equal(item.isDirty, true);
    test.done();
  },
  'test if instance can be saved': function(test) {
    var Item = Seq.getModel('Item'),
        item = Item.create({
          name: 'John',
          price: 42
        });
    item.save(function(err, savedItem) {
      if (err) throw err;
      test.equal(item.isNew, false);
      test.equal(item.isDirty, false);
      test.equal(item.id, 1);
      test.ok(jaz.Object.isEqual(item, savedItem));
      client.query("SELECT * FROM items", function(err, results) {
        if (err) throw err;
        test.equal(results[0].name, 'John');
        test.equal(results[0].price, 42);
        test.done();
      });
    });
  },
  'test if timestamps are automatically set on save': function(test) {
    var Item = Seq.getModel('Item'),
        item = Item.create({
          name: 'Jane',
          price: 23
        }),
        now = new Date();
    item.save(function(err, savedItem) {
      if (err) throw err;
      test.ok(Math.abs(item.createdAt.getTime() - now.getTime()) < 10, 'createdAt time is about the same');
      test.ok(Math.abs(item.updatedAt.getTime() - now.getTime()) < 10, 'updatedAt time is about the same');
      client.query("SELECT * FROM items", function(err, results) {
        if (err) throw err;
        // TODO: those are off by one hour:
//        test.equal(results[0].created_at, now.toUTCString());
//        test.equal(results[0].updated_at, now.toUTCString());
        test.done();
      });
    });
  },
  'test if saved instance can be changed and is dirty and saveable': function(test) {
    var Item = Seq.getModel('Item'),
        item = Item.create({
          name: 'Willy',
          price: 2
        }),
        now = new Date();
    item.save(function(err, savedItem) {
      if (err) throw err;
      test.equal(item.id, 1);
      test.equal(item.isNew, false);
      test.equal(item.isDirty, false);

      item.name = 'Maya';
      test.equal(item.isNew, false);
      test.equal(item.isDirty, true);
      setTimeout(function() {
        var updateNow = new Date();
        item.save(function(err, savedItem) {
          if (err) throw err;
          test.equal(item.id, 1);
          test.equal(item.isNew, false);
          test.equal(item.isDirty, false);
          test.equal(savedItem.name, 'Maya');
          test.ok(Math.abs(item.createdAt.getTime() - now.getTime()) < 10, 'createdAt time is about the same');
          test.ok(Math.abs(item.updatedAt.getTime() - updateNow.getTime()) < 10, 'updatedAt time should be a newer date');

          client.query("SELECT * FROM items", function(err, results) {
            if (err) throw err;
            test.equal(results[0].name, 'Maya');
            test.equal(results[0].price, 2);
            test.done();
          });
        });
      }, 20);
    });
  },
  'test if record can be loaded with id': function(test) {
    var Item = Seq.getModel('Item'),
        item = Item.create({
          name: 'Willy',
          price: 2
        });

    item.save(function(err) {
      if (err) throw err;
      Item.find(1, function(err, foundItem) {
        if (err) throw err;
        test.equal(item.id, foundItem.id);
        test.equal(item.name, foundItem.name);
        test.equal(item.price, foundItem.price);
//        test.equal(Math.floor(item.getData().createdAt.getTime() / 1000), foundItem.getData().createdAt.getTime() / 1000);

        Item.find(2, function(err, foundItem) {
          test.equal(err.constructor, Seq.errors.ItemNotFoundError);
          test.equal(foundItem, null);
          test.done();
        });
      });
    });
  },
  'test adding instance methods': function(test) {
    var Item = Seq.defineModel('Item', Seq.getTableFromMigration('items'), {
      instanceMethods: {
        testMe: function() {
          return 42
        },
        foo: function(bar) {
          return 'wuff ' + bar;
        }
      }
    });
    var item = Item.create();
    test.equal(typeof item.testMe, 'function');
    test.equal(typeof item.foo, 'function');
    test.equal(item.testMe(), 42);
    test.equal(item.foo('meauw'), 'wuff meauw');
    test.done();
  },
  'test instance methods work on loaded items': function(test) {
    var Item = Seq.defineModel('Item', Seq.getTableFromMigration('items'), {
      instanceMethods: {
        testMe: function() {
          return 42
        },
        foo: function(bar) {
          return 'wuff ' + bar;
        }
      }
    });
    var item = Item.create({
      name: 'Willy',
      price: 2
    });
    item.save(function(err) {
      if (err) throw err;
      Item.find(1, function(err, foundItem) {
        if (err) throw err;
        test.equal(typeof foundItem.testMe, 'function');
        test.equal(typeof foundItem.foo, 'function');
        test.equal(foundItem.testMe(), 42);
        test.equal(foundItem.foo('meauw'), 'wuff meauw');
        test.done();
      });
    });
  },
  'test what this is in instance methods': function(test) {
    var Item = Seq.defineModel('Item', Seq.getTableFromMigration('items'), {
      instanceMethods: {
        doublePrice: function() {
          this.price *= 2;
        },
        sayName: function() {
          return 'Hello ' + this.name;
        }
      }
    });
    var item = Item.create({
      name: 'Bob',
      price: 21
    });
    item.doublePrice();
    test.equal(item.price, 42);
    test.equal(item.sayName(), 'Hello Bob');
    test.done();
  },
  'test static methods and this context': function(test) {
    var Item = Seq.defineModel('Item', Seq.getTableFromMigration('items'), {
      classMethods: {
        doSomething: function() {
          return this;
        },
        sayName: function() {
          return 'Hello ' + this.name;
        }
      }
    });
    test.equal(Item.doSomething(), Item);
    test.done();
  },
  'test if save will be delayed it no connection exists': function(test) {
    Seq.removeConnection();
    var Item = Seq.getModel('Item'),
        item = Item.create({
          name: 'Willy',
          price: 2
        });
    item.save(function(err) {
      client.query("SELECT * FROM items", function(err, results) {
        if (err) throw err;
        test.equal(results.length, 1);
        test.done();
      });
    });
    var db  = Seq.create(TEST_CONFIG);
  }
};

/**
 TODO:
  find (with where parameters)
  findAll
  findAllAsHash
  Test datetimes mit before save and after load methods
  Define custom before save methods
  
  
  later on:
  caching (remember item,id combo in cache and don't query for them)
 */