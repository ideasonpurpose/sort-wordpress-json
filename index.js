// todo: inject the WordPress theme.json schema from https://github.com/WordPress/gutenberg/tree/trunk/schemas

function sortByType(label, srcObject) {
  // TODO: use label to customize the sort

  const destObject = {};

  const keys = Object.keys(srcObject);

  const rkeys = keys.slice().reverse();

  rkeys.forEach((key) => {
    destObject[key] = srcObject[key];
  });

  return destObject;
}

function sortWPJson(srcJSON) {
  // TODO: Handle Buffers and strings

  if (Buffer.isBuffer(srcJSON)  ){
    srcJSON = srcJSON.toString()
  }

  if (typeof srcJSON === 'string') {
    srcJSON = JSON.parse(srcJSON);
  }

  // just a big dfs traversal of the tree, then

  return sortByType('test', srcJSON);
}

export default sortWPJson;
export { sortWPJson };
