/**
 * Require a module with a fallback
 */

module.exports = function(parent) {
  function require(name, fallback) {
    try {
      return parent(name);
    } catch (e) {
      try {
        return parent(fallback || name + '-component');
      } catch(e2) {
        try {
          return parent('component-' + name);
        } catch (e3) {
          throw e;
        }
      }
    }
  }

  // Merge the old properties
  for (var key in parent) {
    require[key] = parent[key];
  }

  return require;
};
