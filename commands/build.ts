import { ui, spinner, Command, Project } from 'denali-cli';
import unwrap from '../lib/utils/unwrap';
import * as createDebug from 'debug';

const debug = createDebug('denali:commands:build');

/**
 * Compile your app
 */
export default class BuildCommand extends Command {

  /* tslint:disable:completed-docs typedef */
  public static commandName = 'build';
  public static description = 'Compile your app';
  public static longDescription = unwrap`
    Compiles your app based on your denali-build.js file, as well as any build-related addons.
  `;

  public static flags = {
    environment: {
      description: 'The target environment to build for.',
      defaultValue: 'development',
      type: <any>'string'
    },
    output: {
      description: 'The directory to build into',
      defaultValue: 'dist',
      type: <any>'string'
    },
    watch: {
      description: 'Continuously watch the source files and rebuild on changes',
      defaultValue: false,
      type: <any>'boolean'
    },
    printSlowTrees: {
      description: 'Print out an analysis of the build process, showing the slowest nodes.',
      defaultValue: false,
      type: <any>'boolean'
    }
  };

  public runsInApp = true;

  public async run(argv: any) {
    let project = new Project({
      environment: argv.environment,
      printSlowTrees: argv.printSlowTrees,
      lint: argv.environment !== 'production'
    });

    if (argv.watch) {
      project.watch({
        outputDir: <string>argv.output
      });
    } else {
      try {
        await project.build(argv.output);
      } catch (error) {
        spinner.fail('Build failed');
        ui.error(error.stack);
      }
    }
  }

}
