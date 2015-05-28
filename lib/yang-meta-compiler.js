// Generated by CoffeeScript 1.9.1
(function() {
  var Extension, Meta, YangMetaCompiler,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  Meta = require('meta-class');

  Extension = (function() {
    function Extension(opts1) {
      this.opts = opts1 != null ? opts1 : {};
      this;
    }

    Extension.prototype.refine = function(opts) {
      if (opts == null) {
        opts = {};
      }
      return Meta.copy(this.opts, opts);
    };

    Extension.prototype.resolve = function(target, compiler) {
      var arg, params, ref, ref1;
      switch (this.opts.argument) {
        case 'value':
        case 'text':
        case 'date':
          return {
            name: target.get('yang'),
            value: target.get('name')
          };
      }
      if (this.opts.resolver == null) {
        throw new Error("no resolver found for '" + (target.get('yang')) + "' extension", target);
      }
      arg = target.get('name');
      params = {};
      if ((ref = target.get('children')) != null) {
        ref.forEach(function(e) {
          switch (false) {
            case !((Meta["instanceof"](e)) && (e.get('children')).length === 0):
              return params[e.get('yang')] = e.get('name');
            case (e != null ? e.constructor : void 0) !== Object:
              return params[e.name] = e.value;
          }
        });
      }
      return (ref1 = this.opts.resolver) != null ? typeof ref1.call === "function" ? ref1.call(compiler, target, arg, params) : void 0 : void 0;
    };

    return Extension;

  })();

  YangMetaCompiler = (function(superClass) {
    var assert;

    extend(YangMetaCompiler, superClass);

    function YangMetaCompiler() {
      return YangMetaCompiler.__super__.constructor.apply(this, arguments);
    }

    assert = require('assert');

    YangMetaCompiler.set('exports.yang', {
      extension: new Extension({
        argument: 'extension-name',
        'sub:description': '0..1',
        'sub:reference': '0..1',
        'sub:status': '0..1',
        'sub:sub': '0..n',
        resolver: function(self, arg, params) {
          var ext;
          ext = this.resolve('yang', arg);
          if (ext == null) {
            if (params.resolver == null) {
              params.resolver = this.get("extensions." + arg);
            }
            ext = new Extension(params);
            this.define('yang', arg, ext);
          } else {
            ext.refine(params);
          }
          return ext;
        }
      }),
      argument: new Extension({
        'sub:yin-element': '0..1',
        resolver: function(self, arg) {
          return {
            name: 'argument',
            value: arg
          };
        }
      }),
      'yin-element': new Extension({
        argument: 'value'
      }),
      value: new Extension({
        resolver: function(self, arg) {
          return {
            name: 'value',
            value: arg
          };
        }
      }),
      sub: new Extension({
        resolver: function(self, arg, params) {
          return {
            name: "sub:" + arg,
            value: params
          };
        }
      }),
      prefix: new Extension({
        argument: 'value'
      }),
      include: new Extension({
        argument: 'name',
        resolver: function(self, arg, params) {
          var source;
          source = this.get("map." + arg);
          assert(typeof source === 'string', "unable to include '" + arg + "' without mapping defined for source");
          return this.compile(function() {
            var file, path, ref;
            path = require('path');
            file = path.resolve(path.dirname((ref = module.parent) != null ? ref.filename : void 0), source);
            console.log("INFO: including '" + arg + "' using " + file);
            return (require('fs')).readFileSync(file, 'utf-8');
          });
        }
      })
    });

    YangMetaCompiler.prototype.define = function(type, key, value) {
      var base, exists;
      exists = this.resolve(type, key);
      if (exists == null) {
        if ((base = this.context)[type] == null) {
          base[type] = {};
        }
        this.context[type][key] = value;
      }
      return void 0;
    };

    YangMetaCompiler.prototype.resolve = function(type, key) {
      var from, i, prefix, ref, ref1;
      ref = key.split(':'), prefix = 2 <= ref.length ? slice.call(ref, 0, i = ref.length - 1) : (i = 0, []), key = ref[i++];
      from = (function() {
        var ref1;
        switch (false) {
          case !(prefix.length > 0):
            return (ref1 = this.resolve('module', prefix[0])) != null ? ref1.get('exports') : void 0;
          default:
            return this.context;
        }
      }).call(this);
      return from != null ? (ref1 = from[type]) != null ? ref1[key] : void 0 : void 0;
    };

    YangMetaCompiler.prototype.resolveNode = function(meta) {
      var err, ext, yang;
      yang = meta.get('yang');
      ext = this.resolve('yang', yang);
      try {
        return ext.resolve(meta, this);
      } catch (_error) {
        err = _error;
        if (this.errors == null) {
          this.errors = [];
        }
        this.errors.push({
          yang: yang,
          error: err
        });
        return void 0;
      }
    };

    YangMetaCompiler.prototype.assembleNode = function(to, from) {
      var k, objs, v;
      objs = (function() {
        var ref, results1;
        switch (false) {
          case !(Meta["instanceof"](from)):
            if (from.get('collapse')) {
              ref = from.get('bindings');
              results1 = [];
              for (k in ref) {
                v = ref[k];
                results1.push({
                  name: k,
                  value: v
                });
              }
              return results1;
            } else {
              return {
                name: this.normalizeKey(from),
                value: from
              };
            }
            break;
          case from.constructor !== Object:
            return from;
        }
      }).call(this);
      if (!(objs instanceof Array)) {
        objs = [objs];
      }
      return Meta.bind.apply(to, objs);
    };

    YangMetaCompiler.prototype.normalizeKey = function(meta) {
      return ([meta.get('yang'), meta.get('name')].filter(function(e) {
        return (e != null) && !!e;
      })).join('.');
    };

    YangMetaCompiler.prototype.parse = function(schema, parser) {
      var keyword, normalize, results, statement, stmt;
      if (parser == null) {
        parser = require('yang-parser');
      }
      if (typeof schema === 'string') {
        return this.parse(parser.parse(schema));
      }
      if (!((schema != null) && schema instanceof Object)) {
        return;
      }
      statement = schema;
      normalize = function(obj) {
        return ([obj.prf, obj.kw].filter(function(e) {
          return (e != null) && !!e;
        })).join(':');
      };
      keyword = normalize(statement);
      results = ((function() {
        var i, len, ref, results1;
        ref = statement.substmts;
        results1 = [];
        for (i = 0, len = ref.length; i < len; i++) {
          stmt = ref[i];
          results1.push(this.parse(stmt));
        }
        return results1;
      }).call(this)).filter(function(e) {
        return e != null;
      });
      return (function(superClass1) {
        extend(_Class, superClass1);

        function _Class() {
          return _Class.__super__.constructor.apply(this, arguments);
        }

        _Class.set({
          yang: keyword,
          name: statement.arg,
          children: results
        });

        return _Class;

      })(require('meta-class'));
    };

    YangMetaCompiler.prototype.compile = function(schema) {
      if (schema instanceof Function) {
        schema = schema.call(this);
      }
      if (typeof schema !== 'string') {
        return;
      }
      return this.fork(function() {
        var ext, name, output, ref;
        this.context = {
          yang: this.constructor.get('exports.yang')
        };
        ref = this.context.yang;
        for (name in ref) {
          ext = ref[name];
          if ((this.get("extensions." + name)) instanceof Function) {
            ext.refine({
              resolver: this.get("extensions." + name)
            });
          }
        }
        output = this.parse(schema).map((function(_this) {
          return function() {
            return _this.resolveNode.apply(_this, arguments);
          };
        })(this)).reduce((function(_this) {
          return function() {
            return _this.assembleNode.apply(_this, arguments);
          };
        })(this)).set({
          schema: schema,
          exports: this.context,
          'compiled-using': this.get()
        });
        if (this.errors != null) {
          console.log("WARN: the following errors were encountered by the compiler");
          console.log(this.errors);
        }
        return output;
      });
    };

    return YangMetaCompiler;

  })(Meta);

  module.exports = YangMetaCompiler;

}).call(this);