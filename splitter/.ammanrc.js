// @ts-check
'use strict';
const path = require('path');
const fs = require('fs');

// Run `yarn run build` to generate the `.js` file

const localDeployDir = path.join(__dirname, 'target', 'deploy');
const PROGRAM_ADDRESS_SPLITTER = require("./client/idl/splitter.json").metadata.address;

function localDeployPath(programName) {
    return path.join(localDeployDir, `${programName}.so`);
}

const programs = {
    splitter: {
        label: 'Splitter Program',
        programId: PROGRAM_ADDRESS_SPLITTER,
        deployPath: localDeployPath('splitter')
    },
};

module.exports = {
    validator: {
        verifyFees: false,
        killRunningValidators: true,
        programs: [ programs.splitter ],
    },
    /*
    relay: {
        accountProviders,
    },
    */
};

