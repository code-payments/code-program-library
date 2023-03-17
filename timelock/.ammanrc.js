// @ts-check
'use strict';
const path = require('path');
const fs = require('fs');

// Run `yarn run build` to generate the `.js` file
const accountProviders = require("./client/typescript/dist/generated/accounts")

const localDeployDir = path.join(__dirname, 'target', 'deploy');
const PROGRAM_ADDRESS = require("./client/idl/timelock.json").metadata.address;

function localDeployPath(programName) {
    return path.join(localDeployDir, `${programName}.so`);
}

const programs = {
    timelock: {
        label: 'Timelock Program',
        programId: PROGRAM_ADDRESS,
        deployPath: localDeployPath('timelock')
    },
};

module.exports = {
    validator: {
        verifyFees: false,
        killRunningValidators: true,
        programs: [ programs.timelock ],
    },
    relay: {
        accountProviders,
    },
};