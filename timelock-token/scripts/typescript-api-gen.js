const { PROGRAM_ID, PROGRAM_NAME, } = require('./const');

const path = require('path');
const sourceIdlDir = path.join(__dirname, '..', 'target', 'idl');
const generatedIdlDir = path.join(__dirname, '..', 'client', 'idl');
const generatedSDKDir = path.join(__dirname, '..', 'client', 'typescript', 'src', 'generated');

const { Solita } = require('@metaplex-foundation/solita');
const { writeFile } = require('fs/promises');

async function generateTypeScriptSDK() {
  const sourceIdlPath = path.join(sourceIdlDir, `${PROGRAM_NAME}.json`);
  const generatedIdlPath = path.join(generatedIdlDir, `${PROGRAM_NAME}.json`);

  console.log('Reading IDL from %s', sourceIdlPath);
  const idl = require(sourceIdlPath);
  if (idl.metadata?.address == null) {
    idl.metadata = { ...idl.metadata, address: PROGRAM_ID };
  }

  console.log('Writing IDL to %s', generatedIdlPath);
  await writeFile(generatedIdlPath, JSON.stringify(idl, null, 2));

  console.log('Generating TypeScript SDK to %s', generatedSDKDir);
  const gen = new Solita(idl, { formatCode: true });
  await gen.renderAndWriteTo(generatedSDKDir);

  console.error('Success!');

  process.exit(0);
}

generateTypeScriptSDK();