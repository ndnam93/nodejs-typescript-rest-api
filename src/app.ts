import dotenv from 'dotenv';
const dotenvResult = dotenv.config();
if (dotenvResult.error) { throw dotenvResult.error }

import "reflect-metadata";
import { container } from 'tsyringe';
import express, { Application } from 'express';
import * as winston from 'winston';
import * as expressWinston from 'express-winston';
import cors from 'cors';
import helmet from 'helmet';
import CommonRoutesConfig from './common/common.routes.config';
import UsersRoutes from './users/users.routes.config';
import debug from 'debug';
import AuthRoutes from './auth/auth.routes.config';

const app: Application = express();
container.register('Application', { useValue: app });

const routes: CommonRoutesConfig[] = [];
const debugLog: debug.IDebugger = debug('app');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());

const loggerOptions: expressWinston.LoggerOptions = {
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
        winston.format.json(),
        winston.format.prettyPrint(),
        winston.format.colorize({ all: true }),
    ),
    meta: Boolean(process.env.DEBUG), // when not debugging, make terse
    level: typeof global.it === 'function' ? 'http' : 'info',
};
app.use(expressWinston.logger(loggerOptions));

routes.push(container.resolve(UsersRoutes));
routes.push(container.resolve(AuthRoutes));

export const server = app.listen(3000, () => {
    routes.forEach((route: CommonRoutesConfig) => {
        debugLog(`Routes configurated for ${route.name}`);
    });
    debugLog('listening on port 3000');
});

export default app;
