var Seq         = require(__dirname + '/..'),
    jaz         = require('jaz-toolkit'),
    mysql       = require('mysql'),
    TEST_CONFIG = require(__dirname + '/test_config'),
    client      = mysql.createClient(TEST_CONFIG);

module.exports.modelDefinition = {
  setUp: function(cb) {
    var db  = Seq.createIfNotExistent(TEST_CONFIG);
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
    var Marbles = Seq.defineModel('Marbles', {
    });
    test.equal(Marbles.tableName, 'marbles', 'don\'t append a plural s at the end, if there is alredy one');
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
  },
  'test if model definition is UpperCamelCase': function(test) {
    Seq.defineModel('foo_bar', {});
    var def = Seq.getModel('FooBar');
    test.equal(def.name, 'FooBar');
    test.equal(def.fields.length, 1);
    test.done();
  }
};

module.exports.modelInstanciation = {
  setUp: function(cb) {
    var db  = Seq.createIfNotExistent(TEST_CONFIG);
    this.db = db;
    client.query("DROP TABLE items;", function() {
      var tableDef = function(table) {
        table.addColumn('name', Seq.dataTypes.VARCHAR());
        table.addColumn('price', Seq.dataTypes.INT());
        table.addTimestamps();
      };
      Seq.createTable('items', tableDef);
      db.createTable('items', tableDef, function() {
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
    test.equal(item.id, 0);
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
      test.equal(typeof item.id, 'number');
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

      Item.find(item.id, function(err, loadedItem) {
        if (err) throw err;
        test.equal(loadedItem.createdAt.toUTCString(), now.toUTCString());
        test.equal(loadedItem.updatedAt.toUTCString(), now.toUTCString());

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
          test.ok(item.createdAt.getTime() < savedItem.updatedAt.getTime(), 'updatedAt time should be a newer then createdAt time');

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
  'test if save will be delayed if no connection exists': function(test) {
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
    var db  = Seq.createIfNotExistent(TEST_CONFIG);
  },
  'test false validation will prevent saving': function(test) {
    var Item = Seq.defineModel('Item', {
        name: Seq.dataTypes.VARCHAR({ required: true })
      }),
      item = Item.create();

    item.save(function(err) {
      test.equal(err.constructor, Seq.errors.ItemNotValidError, "item should not be valid");

      test.done();
    });
  }
};

module.exports['getters & setters'] = {
  setUp: function(cb) {
    var db  = Seq.createIfNotExistent(TEST_CONFIG);
    this.db = db;
    client.query("DROP TABLE things;", function() {
      Seq.clearTableDefinitions();
      var tableDef = function(table) {
        table.addColumn('name', Seq.dataTypes.VARCHAR());
        table.addColumn('price', Seq.dataTypes.INT());
      };
      Seq.createTable('things', tableDef);
      db.createTable('things', tableDef, function() {
        cb();
      });
    });
  },
  'test element.data offers all data directly': function(test) {
    var Thing = Seq.defineModel('Thing', Seq.getTableFromMigration('things')),
        thing = Thing.create({ name: 'bla', test: 'foo', bar: 42 });

    test.equal(thing.data.name, 'bla');
    test.equal(thing.data.test, 'foo');
    test.equal(thing.data.bar, 42);
    test.done();
  },
  'test additional parameters (item was created with) can be retrieved via getters': function(test) {
    var Thing = Seq.defineModel('Thing', Seq.getTableFromMigration('things'), {
          getter: {
            test: function() { return this.data.test; },
            bar:  function() { return this.data.bar * 2; }
          }
        }),
        thing = Thing.create({ name: 'bla', test: 'foo', bar: 42 });

    test.equal(thing.test, 'foo');
    test.equal(thing.bar, 84);
    test.done();
  },
  'test getters will override buildin getters': function(test) {
    var Thing = Seq.defineModel('Thing', Seq.getTableFromMigration('things'), {
          getter: {
            name: function() { return this.data.test + this.data.name; }
          }
        }),
        thing = Thing.create({ name: 'bla', test: 'foo', price: 2 });

    test.equal(thing.name, 'foobla');
    test.equal(thing.price, 2, 'not changed getter should stay untouched');
    test.done();
  },
  'test setter can override buildin setters': function(test) {
    var Thing = Seq.defineModel('Thing', Seq.getTableFromMigration('things'), {
          setter: {
            name: function(val) { return val + this.data.name; }
          }
        }),
        thing = Thing.create({ name: 'bla' });

    test.equal(thing.name, 'bla');
    thing.name = 'Bob';
    test.equal(thing.name, 'Bobbla');
    thing.name = 'Tim';
    test.equal(thing.name, 'TimBobbla');

    test.done();
  },
  'test setter can set not defined attributes': function(test) {
    var Thing = Seq.defineModel('Thing', Seq.getTableFromMigration('things'), {
          setter: {
            something: function(val) { return val + " thing"; }
          }
        }),
        thing = Thing.create({ name: 'bla' }),
        undef;

    test.equal(thing.data.something, undef);
    thing.something = 'Foo';
    test.equal(thing.data.something, 'Foo thing');

    test.done();
  },
  'test getter gets data of later added attribute': function(test) {
    var Thing = Seq.defineModel('Thing', Seq.getTableFromMigration('things'), {
          getter: {
            test: function() { return this.data.test; },
            foo: function() { return 'bar'; }
          },
          setter: {
            test: function(val) { return val; }
          }
        }),
        thing = Thing.create(),
        undef;

    test.equal(thing.test, undef);
    test.equal(thing.foo, 'bar');
    thing.test = 'testy';
    test.equal(thing.test, 'testy');
    test.equal(thing.foo, 'bar');
    test.done();
  },
  'test additional parameters will not be saved to db': function(test) {
    var Thing = Seq.defineModel('Thing', Seq.getTableFromMigration('things'), {
          getter: {
            name: function() { return this.data.test + this.data.name; }
          }
        }),
        thing = Thing.create({ name: 'bla', test: 'foo', xxx: 1 });

    test.equal(thing.name, 'foobla');
    thing.save(function(err) {
      if (err) throw err;

      client.query("SELECT * FROM things", function(err, results) {
        if (err) throw err;
        test.equal(results.length, 1);
        test.ok(!results[0].xxx);
        test.ok(!results[0].test);
        test.equal(results[0].name, 'bla');

        test.done();
      });
    });
  }
};

module.exports['model saving'] = {
  setUp: function(cb) {
    var db  = Seq.createIfNotExistent(TEST_CONFIG);
    this.db = db;
    client.query("DROP TABLE things;", function() {
      Seq.clearTableDefinitions();
      var tableDef = function(table) {
        table.addColumn('name', Seq.dataTypes.VARCHAR());
        table.addColumn('price', Seq.dataTypes.INT());
      };
      Seq.createTable('things', tableDef);
      db.createTable('things', tableDef, function() {
        cb();
      });
    });
  },
  tearDown: function(cb) {
    Seq.removeAllListeners('log');
    cb();
  },
  'test saving of just saved item does nothing': function(test) {
    var Thing = Seq.defineModel('Thing', Seq.getTableFromMigration('things')),
        thing = Thing.create({ name: 'a cool named thing' }),
        countQueries = 0;

    Seq.on('log', function(status, message) {
      ++countQueries;
    });

    thing.save(function(err) {
      if (err) throw err;

      thing.save(function(err, thing) {
        if (err) throw err;
        test.equal(countQueries, 1);

        test.done();
      });
    });
  },
  'test saving again of just saved item updates only changed items': function(test) {
    var Thing = Seq.defineModel('Thing', Seq.getTableFromMigration('things')),
        thing = Thing.create({ name: 'just another cool named thing', price: 1 });

    thing.save(function(err) {
      if (err) throw err;

      thing.price = 1000000;

      Seq.on('log', function(status, message) {
        test.ok(message.match('price'));
        test.ok(!message.match('name'));
      });

      thing.save(function(err, thing) {
        if (err) throw err;

        test.done();
      });
    });
  }
};

module.exports['model.remove'] = {
  setUp: function(cb) {
    var db  = Seq.createIfNotExistent(TEST_CONFIG);
    this.db = db;
    client.query("DROP TABLE things;", function() {
      var tableDef = function(table) {
        table.addColumn('name', Seq.dataTypes.VARCHAR());
        table.addColumn('number', Seq.dataTypes.INT());
        table.addColumn('float', Seq.dataTypes.FLOAT());
        table.addColumn('time', Seq.dataTypes.DATETIME());
        table.addColumn('bool', Seq.dataTypes.BOOLEAN());
        table.addColumn('someText', Seq.dataTypes.TEXT());
        table.addTimestamps();
      };
      Seq.createTable('things', tableDef);
      Seq.defineModel('Thing', Seq.getTableFromMigration('things'));
      db.createTable('things', tableDef, function() {
        var values = [],
            params = [];
        values.push('(?,?,?,?,?,?,?)');
        params.push([ 1, 'Bill', 42, 23.3, new Date(2001, 3, 3), false, 'take me']);
        values.push('(?,?,?,?,?,?,?)');
        params.push([ 2, 'Bob', 20, 2232, new Date(2011, 12, 24), false, '']);
        values.push('(?,?,?,?,?,?,?)');
        params.push([ 3, 'Sally', 42, 0.666, new Date(1990, 5, 28), true, '']);
        values.push('(?,?,?,?,?,?,?)');
        params.push([ 4, 'Zoe', -3423, 99.90909, new Date(2000, 1, 1), true, 'I was here']);
        client.query("INSERT INTO things (`id`, `name`, `number`, `float`, `time`, `bool`, `some_text`) VALUES " + values.join(','), jaz.Array.flatten(params), function(err) {
          if (err) throw err;
          cb();
        });
      });
    });
  },
  'test remove an item': function(test) {
    var Thing = Seq.getModel('Thing');

    Thing.find(3, function(err, thing) {
      if (err) throw err;
      test.equal(thing.isDeleted, false);

      thing.destroy(function(err) {
        if (err) throw err;
        test.equal(thing.isDeleted, true);
        test.equal(thing.id, 0);
        Thing.find(3, function(err, thing) {
          test.equal(err.constructor, Seq.errors.ItemNotFoundError, 'Should now be deleted from db');
          test.equal(thing, null);
          test.done();
        });
      });
    });
  },
  'test removing a new item should return error': function(test) {
    var Thing = Seq.getModel('Thing'),
        thing = Thing.create({ name: 'bla' });
    thing.destroy(function(err, thing) {
      test.equal(err.constructor, Seq.errors.NotSavedYetError, 'Should now be deleted from db');
      test.equal(thing, null);
      test.done();
    });
  }
};

module.exports['model.updateAttributes'] = {
  setUp: function(cb) {
    var db  = Seq.createIfNotExistent(TEST_CONFIG);
    this.db = db;
    client.query("DROP TABLE things;", function() {
      var tableDef = function(table) {
        table.addColumn('name', Seq.dataTypes.VARCHAR());
        table.addColumn('evenNumber', Seq.dataTypes.INT({ validation: function(v) { return v%2 == 0; } }));
        table.addTimestamps();
      };
      Seq.clearTableDefinitions();
      Seq.createTable('things', tableDef);
      Seq.defineModel('Thing', Seq.getTableFromMigration('things'));
      db.createTable('things', tableDef, function() {
        var values = [],
            params = [];
        values.push('(?,?,?)');
        params.push([ 1, 'Bill', 42]);
        values.push('(?,?,?)');
        params.push([ 2, 'Bob', 20]);
        values.push('(?,?,?)');
        params.push([ 3, 'Sally', 42]);
        client.query("INSERT INTO things (`id`, `name`, `even_number`) VALUES " + values.join(','), jaz.Array.flatten(params), function(err) {
          if (err) throw err;
          cb();
        });
      });
    });
  },
  'sets record data': function(test) {
    var Thing = Seq.getModel('Thing');
    Thing.find(1, function(err, thing) {
      if (err) throw err;

      thing.updateAttributes({
        name: 'Billy',
        evenNumber: 0
      });
      test.equal(thing.name, 'Billy');
      test.equal(thing.evenNumber, 0);

      test.done();
    });
  },
  'is not dirty then': function(test) {
    var Thing = Seq.getModel('Thing');
    Thing.find(1, function(err, thing) {
      if (err) throw err;

      thing.updateAttributes({
        name: 'Billy',
        evenNumber: 0
      }, function(err) {
        if (err) throw err;
        test.equal(thing.isDirty, false);

        test.done();
      });
    });
  },
  'saves data to db directly': function(test) {
    var Thing = Seq.getModel('Thing');
    Thing.find(1, function(err, thing) {
      if (err) throw err;

      thing.updateAttributes({
        name: 'Billy',
        evenNumber: 0
      }, function(err) {
        if (err) throw err;

        client.query("SELECT * FROM things WHERE id=1", function(err, results) {
          if (err) throw err;
          test.equal(results[0].name, 'Billy');
          test.equal(results[0].even_number, 0);

          test.done();
        });
      });
    });
  },
  'validates data before saving to db': function(test) {
    var Thing = Seq.getModel('Thing');
    Thing.find(1, function(err, thing) {
      if (err) throw err;

      thing.updateAttributes({
        name: 'Billy',
        evenNumber: 1
      }, function(err) {
        test.equal(err.constructor, Seq.errors.ItemNotValidError, "item should not be valid");
        test.equal(thing.isDirty, true);

        test.done();
      });
    });
  },
  'updates updatedAt field if present': function(test) {
    var Thing = Seq.getModel('Thing');
    Thing.find(1, function(err, thing) {
      if (err) throw err;

      var origUpdatedAt = thing.updatedAt;

      thing.updateAttributes({
        name: 'Billy',
        evenNumber: 2
      }, function(err) {
        if (err) throw err;
        test.notEqual(origUpdatedAt, thing.updatedAt);

        test.done();
      });
    });
  }
};

