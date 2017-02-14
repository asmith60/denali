import {
  startCase
} from 'lodash';
import * as Bluebird from 'bluebird';
import { exec, ExecOptions } from 'child_process';
import * as cmdExists from 'command-exists';
import { Blueprint, ui, spinner } from 'denali-cli';
import pkg = require('../../package.json');
import unwrap from '../../lib/utils/unwrap';

const run = Bluebird.promisify<[ string, string ], string, ExecOptions>(exec);
const commandExists = Bluebird.promisify<boolean, string>(cmdExists);
const ONE_KB = 1024;
const maxBuffer = 400 * ONE_KB;

/**
 * Creates a new app, initializes git and installs dependencies.
 */
export default class AppBlueprint extends Blueprint {

  /* tslint:disable:completed-docs typedef */
  public static blueprintName = 'app';
  public static description = 'Creates a new app, initializes git and installs dependencies';
  public static longDescription = unwrap`
    Usage: denali generate app <name> [options]

    Scaffolds a new app. Sets up the correct directory structure, initializes a git repo, and
    installs the necessary dependencies.

    Guides: http://denali.js.org/master/guides/overview/app-structure/
  `;

  public static params = '<name>';

  public static flags = {
    skipDeps: {
      description: 'Do not install dependencies on new app',
      defaultValue: false,
      type: <any>'boolean'
    },
    useNpm: {
      description: 'Use npm to install dependencies, even if yarn is available',
      defaultValue: false,
      type: <any>'boolean'
    }
  };

  public locals(argv: any) {
    let name = argv.name;
    return {
      name,
      className: startCase(name).replace(/\s/g, ''),
      humanizedName: startCase(name),
      denaliVersion: (<any>pkg).version
    };
  }

  public async postInstall(argv: any) {
    let name = argv.name;
    spinner.start('Installing dependencies');
    if (!argv.skipDeps) {
      try {
        let yarnExists = await commandExists('yarn');
        if (yarnExists && !argv.useNpm) {
          await run('yarn install --mutex network', { cwd: name });
        } else {
          await run('npm install --loglevel=error', { cwd: name });
        }
        spinner.succeed();
      } catch (error) {
        ui.error('Denali encountered a problem while trying to install the dependencies for your new app:');
        ui.error(error.stack || error.message || error);
      }
    }
    spinner.start('Setting up git repo');
    await run('git init', { cwd: name, maxBuffer });
    await run('git add .', { cwd: name, maxBuffer });
    await run('git commit -am "Initial denali project scaffold"', { cwd: name, maxBuffer });
    spinner.succeed();
    spinner.finish('✨', ` ${ name } created`);
    ui.info('');
    ui.info('To launch your application, just run:');
    ui.info('');
    ui.info(`  $ cd ${ name } && denali server`);
    ui.info('');
  }

}
