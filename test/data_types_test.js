var types = require(__dirname + '/..').dataTypes,
    jaz   = require('jaz-toolkit');

module.exports = {
  'test INT specification': function(test) {
    test.equal(types.INT().type, 'integer');
    test.equal(types.INT().sql, 'INT(#{length})');
    test.equal(types.INT().defaultOptions.length, 11);
    test.done();
  },
  'test INT validation': function(test) {
    test.ok(types.INT().validation(3));
    test.ok(types.INT().validation(0));
    test.ok(!types.INT().validation("3"));
    test.ok(!types.INT().validation(42.6));
    test.ok(!types.INT().validation("54.6"));
    test.ok(!types.INT().validation("D"));
    test.ok(!types.INT().validation(Number.NaN));
    test.done();
  },
  'test VARCHAR specification': function(test) {
    test.equal(types.VARCHAR().type, 'varchar');
    test.equal(types.VARCHAR().sql, 'VARCHAR(#{length})');
    test.equal(types.VARCHAR().defaultOptions.length, 255);
    test.done();
  },
  'test VARCHAR validation': function(test) {
    test.ok(types.VARCHAR().validation("Hallo"));
    test.ok(types.VARCHAR().validation(""));
    test.ok(!types.VARCHAR().validation(4));
    test.ok(!types.VARCHAR().validation(42.6));
    test.ok(!types.VARCHAR().validation(null));
    test.ok(!types.VARCHAR().validation(function() {}));
    test.done();
  },
  'test TEXT specification': function(test) {
    test.equal(types.TEXT().type, 'text');
    test.equal(types.TEXT().sql, 'TEXT');
    test.equal(types.TEXT().defaultOptions, null);
    test.done();
  },
  'test TEXT validation': function(test) {
    test.ok(types.TEXT().validation("Hallo"));
    test.ok(types.TEXT().validation(""));
    test.ok(!types.TEXT().validation(4));
    test.ok(!types.TEXT().validation(42.6));
    test.ok(!types.TEXT().validation(null));
    test.ok(!types.TEXT().validation(function() {}));
    test.done();
  },
  'test BOOLEAN specification': function(test) {
    test.equal(types.BOOLEAN().type, 'boolean');
    test.equal(types.BOOLEAN().sql, 'INT(1)');
    test.equal(types.BOOLEAN().defaultOptions, null);
    test.done();
  },
  'test BOOLEAN validation': function(test) {
    test.ok(types.BOOLEAN().validation(true));
    test.ok(types.BOOLEAN().validation(false));
    test.ok(!types.BOOLEAN().validation("Hallo"));
    test.ok(!types.BOOLEAN().validation(""));
    test.ok(!types.BOOLEAN().validation({}));
    test.ok(!types.BOOLEAN().validation(3));
    test.ok(!types.BOOLEAN().validation(64.3));
    test.ok(!types.BOOLEAN().validation(function() {}));
    test.done();
  },
  'test FLOAT specification': function(test) {
    test.equal(types.FLOAT().type, 'float');
    test.equal(types.FLOAT().sql, 'FLOAT');
    test.equal(types.FLOAT().defaultOptions, null);
    test.done();
  },
  'test FLOAT validation': function(test) {
    test.ok(types.FLOAT().validation(4));
    test.ok(types.FLOAT().validation(42.3));
    test.ok(!types.FLOAT().validation("42.3"));
    test.ok(!types.FLOAT().validation("fd"));
    test.ok(!types.FLOAT().validation(Number.NaN));
    test.done();
  },
  'test DATETIME specification': function(test) {
    test.equal(types.DATETIME().type, 'datetime');
    test.equal(types.DATETIME().sql, 'DATETIME');
    test.equal(types.DATETIME().defaultOptions, null);
    test.done();
  },
  'test DATETIME validation': function(test) {
    test.ok(types.DATETIME().validation(new Date()));
    test.ok(types.DATETIME().validation(new Date(2011,11,11)));
    test.ok(!types.DATETIME().validation((new Date(2011,11,11)).getTime()));
    test.ok(!types.DATETIME().validation(242342342));
    test.ok(!types.DATETIME().validation("today"));
    test.ok(!types.DATETIME().validation(null));
    test.ok(!types.DATETIME().validation(true));
    test.ok(!types.DATETIME().validation({}));
    test.done();
  },

  'test ENUM specification': function(test) {
    var enumType = types.ENUM({ values: ['test', 'lala'] });
    test.equal(enumType.type, 'enum');
    test.equal(enumType.sql, "ENUM(" + ['test', 'lala'].join(', ') + ")");
    test.equal(enumType.defaultOptions, null);
    test.done();
  },
  'test ENUM validation without values are always false': function(test) {
    test.ok(!types.ENUM().validation(1));
    test.ok(!types.ENUM().validation('test'));
    test.ok(!types.ENUM().validation(''));
    test.done();
  },
  'test ENUM validation with values can be true': function(test) {
    var enumType = types.ENUM({ values: ['test', 'lala'] });
    test.ok(enumType.validation('lala'));
    test.ok(enumType.validation('test'));
    test.ok(!enumType.validation(''));
    test.ok(!enumType.validation('lalala'));
    test.done();
  },


  'test FLOAT save conversion': function(test) {
    test.equal(types.FLOAT().save(4.3), 4.3);
    test.equal(types.FLOAT().save(43), 43);
    test.done();
  },
  'test BOOLEAN save conversion': function(test) {
    test.equal(types.BOOLEAN().save(true), true);
    test.equal(types.BOOLEAN().save(false), false);
    test.done();
  },
  'test DATETIME save conversion': function(test) {
    var now = new Date();
    test.equal(typeof types.DATETIME().save(now), 'string');
    test.equal(types.DATETIME().save(now), jaz.Date.toMySQLString(now));
    test.done();
  },
  'test DATETIME load conversion': function(test) {
    var now       = new Date(2012, 1, 12, 14, 15, 16),
        nowLoaded = new Date(2012, 1, 12, 14 + now.getTimezoneOffset()/60, 15, 16);
    test.equal(types.DATETIME().load(nowLoaded).toUTCString(), now.toUTCString());
    test.equal(types.DATETIME().load(nowLoaded).constructor, Date);
    test.done();
  }
};
