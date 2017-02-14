import {
  defaults,
  defaultsDeep
} from 'lodash';
import * as timing from 'response-time';
import * as compression from 'compression';
import * as cookies from 'cookie-parser';
import * as cors from 'cors';
import * as helmet from 'helmet';
// TODO: reimplement this
// import forceSSL from 'express-force-ssl';
import * as morgan from 'morgan';
import { json } from 'body-parser';
import { IncomingMessage, ServerResponse } from 'http';
import Router from '../lib/runtime/router';
import Application from '../lib/runtime/application';

/**
 * Denali ships with several base middleware included, each of which can be enabled/disabled
 * individually through config options.
 */
export default function baseMiddleware(router: Router, application: Application): void {

  let config = application.config;

  /**
   * Returns true if the given property either does not exist on the config object, or it does exist
   * and it's `enabled` property is not `false`. All the middleware here are opt out, so to disable
   * you must define set that middleware's root config property to `{ enabled: false }`
   */
  function isEnabled(prop: string): boolean {
    return !config[prop] || (config[prop] && config[prop].enabled !== false);
  }

  if (isEnabled('timing')) {
    router.use(timing());
  }

  if (isEnabled('logging')) {
    let defaultLoggingFormat = application.environment === 'production' ? 'combined' : 'dev';
    let defaultLoggingOptions = {
      // tslint:disable-next-line:completed-docs
      skip(): boolean {
        return application.environment === 'test';
      }
    };
    let format = (config.logging && config.logging.format) || defaultLoggingFormat;
    let options = defaults(config.logging || {}, defaultLoggingOptions);
    router.use(morgan(format, options));

    // Patch morgan to read from our non-express response
    morgan.token('res', (req: IncomingMessage, res: ServerResponse, field: string) => {
      let header = res.getHeader(field);
      return Array.isArray(header) ? header.join(', ') : header;
    });
  }

  if (isEnabled('compression')) {
    router.use(compression());
  }

  if (isEnabled('cookies')) {
    router.use(cookies(config.cookies));
  }

  if (isEnabled('cors')) {
    router.use(cors(config.cors));
  }

  if (isEnabled('csp')) {
    let cspConfig: any = defaultsDeep<{ [key: string]: any }, { [key: string]: any }>(config.csp, {
      directives: { reportUri: '/_report-csp-violations' },
      reportOnly: application.environment === 'development',
      disableAndroid: true
    });
    router.use(helmet.contentSecurityPolicy(cspConfig));
    if (config.csp && config.csp.useDummyReportingEndpoint) {
      // TODO create an action in the app/ dir to handle this (allows for user overrides then too)
      // router.post(cspConfig.directives.reportUri, (req: IncomingMessage, res: ServerResponse) => res.sendStatus(200));
    }
  }

  if (isEnabled('xssFilter')) {
    router.use(helmet.xssFilter());
  }

  if (isEnabled('frameguard')) {
    router.use(helmet.frameguard());
  }

  if (isEnabled('hidePoweredBy')) {
    router.use(helmet.hidePoweredBy());
  }

  if (isEnabled('ieNoOpen')) {
    router.use(helmet.ieNoOpen());
  }

  if (isEnabled('noSniff')) {
    router.use(helmet.noSniff());
  }

  if (config.server && config.server.ssl && config.server.ssl.required) {
    // TODO homeroll this? or figure out what support / patching is needed to work with non-express
    // router.use((req, res, next) => {
    //   res.locals = res.locals || {};
    //   res.locals.forceSSLOptions = { enable301Redirects: config.server.ssl.required === 'redirect' };
    //   forceSSL(req, res, next);
    // });
  }

  if (isEnabled('bodyParser')) {
    router.use(json({ type: (config.bodyParser && config.bodyParser.type) || 'application/json' }));
  }

}
