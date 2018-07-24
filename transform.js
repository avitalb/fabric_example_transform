const babylon = require('babylon');
const recast = require('recast');

function parseRaw(code) {
  const parse = source =>
  babylon.parse(source, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript']
  });
  return recast.parse(code, { parser: { parse } }).program.body;
}

function transform(file, api) {
  const parse = source =>
    babylon.parse(source, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });

  const j = api.jscodeshift;

  let source = j(recast.parse(file.source, { parser: { parse } }));

  //remove react import
  source = source.find(j.ImportDeclaration,node => node.source.value == 'react').remove().toSource();
  source = j(recast.parse(source, { parser: { parse } }));


  // attach all imported components to the window
  let attachedWindowString = "let {\n";

  let imports = source.find(j.ImportDeclaration);

  let identifiers = [];
  imports.forEach(p => {
    identifiers.push(p.node.specifiers[0].local.loc.identifierName);
  });


  for (var i = 0; i < identifiers.length; i++) {
    attachedWindowString += identifiers[i] + ',\n';
  }
  attachedWindowString += 'Fabric } = window.Fabric;';


  let parsedAttachedWindowString = parseRaw(attachedWindowString);

  // remove the rest of the import declarations
  source = source.find(j.ImportDeclaration).remove().toSource();
  source = j(recast.parse(source, { parser: { parse } }));

  // remove exports and replace with variable declarations
  let exportDeclarations = source.find(j.ExportNamedDeclaration);
  let exampleName;

  // there should only be 1 export declaration but forEach is the only way of actually interacting with the tree nodes
  exportDeclarations.forEach(
    p=> exampleName = p.node.declaration.declarations[0].id.name
  )
  exportDeclarations.forEach(
    p => source = source.find(j.ExportNamedDeclaration).replaceWith(p.node.declaration).insertBefore(parsedAttachedWindowString))

  // add React Render footer
  const sourceWithFooter = source.toSource() + "\n" + 'ReactDOM.render(<'+ exampleName + '/>,document.getElementById("content"));';

  return sourceWithFooter;
}

module.exports = transform;
