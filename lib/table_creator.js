var EventEmitter     = require('events').EventEmitter,
    jaz              = require('jaz-toolkit'),

    errors           = require(__dirname + '/errors'),
    
    SQL_CREATE_TABLE = 'CREATE TABLE #{tableName} (#{columns});',
    SQL_ID_FIELD     = '`id` INT(11) AUTO_INCREMENT PRIMARY KEY',
    
    undef;
/**
 * Creates a Table instance
 * @param {MysqlClient} client
 * @param {String}      tableName Name of the table
 * @param {function}    block block that is called with the Table object
 * @param {function}    cb Callback to call after finished
 */
var TableCreator = function(client, tableName, block, cb) {
  this._columns = {};
  this._uniques = [];

  var columnsSqls = [SQL_ID_FIELD];

  block && block(this);
  for (var columnName in this._columns) {
    if (!checkDataType(this._columns[columnName])) {
      cb(new errors.NotADataTypeError('Column ' + columnName + ' is not a valid data type object.'));
      return;
    }
    try {
      columnsSqls.push(this._columns[columnName].getSql(columnName));
    } catch(err) {
      cb(err);
      return;
    }
  }
  
  for (var i=0,l=this._uniques.length; i<l; ++i) {
    columnsSqls.push('UNIQUE (' + (jaz.Object.isArray(this._uniques[i]) ? this._uniques[i].join(',') : this._uniques[i]) + ')');
  }

  // TODO log created query
  var sql = jaz.String.interpolate(SQL_CREATE_TABLE, {
    tableName: tableName,
    columns:   columnsSqls.join(',')
  });
  client.query(sql, function(err) {
    if (err) {
      cb(err.number === 1050 ? new errors.TableAlreadyExistsError("Table '" + tableName + "' already exists.") : err);
    } else {
      cb(null);
    }
  });
};

/**
 * Adds a column to the table
 */
TableCreator.prototype.addColumn = function(name, type) {
  this._columns[name] = type;
};

/**
 * Adds unique keys
 */
TableCreator.prototype.addUniqueKey = function(key) {
  this._uniques.push(key);
};


/**
 * Checks if given object is a valid data type object
 */
function checkDataType(dataType) {
  return dataType.sql && dataType.type ? true : false;
};


module.exports = TableCreator;