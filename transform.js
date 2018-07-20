const babylon = require('babylon');
const recast = require('recast');

function parseRaw(code) {
  return recast.parse(code, { parser: { parse } }).program.body;
}

function transform(file, api) {
  const parse = source =>
    babylon.parse(source, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });

  const j = api.jscodeshift;

  // delete export declaration (use literal and not exportDeclaration to only delete the actual "export" word) (j.literal('export'))
  let source = j(recast.parse(file.source, { parser: { parse } }))
    .find(j.ImportDeclaration)
    .remove()
    .toSource();

    
  // // attach all imported components to the window
  // const root = j(file.source);
  // const imports = root.find(j.importDeclaration);

  // let identifiers = [];
  // imports.forEach(p => {
  //   identifiers += p.node.identifier;
  // });

  // let source = j(recast.parse(file.source, { parser: { parse } })).insertAfter(j.literal('let {'));

  // for (var i = 0; i < identifiers.length; i++) {
  //   source.insertAfter(j.literal(identifiers[i] + ','));
  // }
  // source.insertAfter(j.literal(' Fabric } = window.Fabric;')).toSource();

  // find name of example
  // const exampleName = source.find(j.exportDeclaration.name);


  // add footer
  // j.literal("ReactDOM.render(<"+exampleName+"/>,document.getElementById('content'));"
  return source;
}

module.exports = transform;
