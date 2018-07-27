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
      plugins: ['jsx', 'typescript','classProperties']
    });

  const j = api.jscodeshift;

  let source = j(recast.parse(file.source, { parser: { parse } }));

  //remove react import
  source = source.find(j.ImportDeclaration,node => node.source.value == 'react').remove().toSource();
  source = j(recast.parse(source, { parser: { parse } }));

  //remove css imports
  source = source.find(j.ImportDeclaration,node => node.source.value.endsWith('css')).remove().toSource();
  source = j(recast.parse(source, { parser: { parse } }));

  // attach all imported components to the window
  let attachedWindowString = "let {\n";

  let imports = source.find(j.ImportDeclaration);

  let identifiers = [];
  imports.forEach(p => {
    p.node.specifiers.forEach(spec => {
    identifiers.push(spec.local.loc.identifierName)})
  });


  for (var i = 0; i < identifiers.length; i++) {
    attachedWindowString += '\t' + identifiers[i] + ',\n';
  }
  attachedWindowString += '\tFabric } = window.Fabric;';


  let parsedAttachedWindowString = parseRaw(attachedWindowString);

  // remove the rest of the import declarations
  source = source.find(j.ImportDeclaration).remove().toSource();
  source = j(recast.parse(source, { parser: { parse } }));

  // remove exports and replace with variable or class declarations, whichever the original example used
  let variableExportDeclarations = source.find(j.ExportNamedDeclaration, node => node.declaration.type == "VariableDeclaration"); 
  let classExportDeclarations = source.find(j.ExportNamedDeclaration, node => node.declaration.type == "ClassDeclaration");
  let exampleName;

  // for examples with variable export declarations
  if (variableExportDeclarations.__paths.length > 0) {
    // extract name
    variableExportDeclarations.forEach(
      p=> exampleName = p.node.declaration.declarations[0].id.name
    )

    //extract variable declaration
    variableExportDeclarations.forEach(
      p => source = source.find(j.ExportNamedDeclaration).replaceWith(p.node.declaration).insertBefore(parsedAttachedWindowString))
  }

  // for examples which export react components as a class
  else if (classExportDeclarations.paths.length > 0) {
    // extract name
    classExportDeclarations.forEach(
      p => exampleName = p.node.declaration.id.name
    )
    
    // extract class declaration
    classExportDeclarations.forEach(
      p => source = source.find(j.ExportNamedDeclaration).replaceWith(p.node.declaration).insertBefore(parsedAttachedWindowString)
    )
  }

  // add React Render footer
  const sourceWithFooter = source.toSource() + "\n" + 'ReactDOM.render(<'+ exampleName + '/>,document.getElementById("content"));';
  return sourceWithFooter;
}

module.exports = transform;
