import { Application } from "express";
import { body } from 'express-validator';
import { inject, injectable } from "tsyringe";
import CommonRoutesConfig from "../common/common.routes.config";
import BodyValidationMiddleware from '../common/middleware/body.validation.middleware';
import AuthController from './controllers/auth.controller';
import AuthMiddleware from './middlewares/auth.middleware';
import JwtMiddleware from './middlewares/jwt.middleware';

@injectable()
export default class AuthRoutes extends CommonRoutesConfig {
    constructor(
        @inject('Application') app: Application, 
        private authMiddleware: AuthMiddleware,
        private jwtMiddleware: JwtMiddleware,
        private authController: AuthController,
        private bodyValidationMiddleware: BodyValidationMiddleware,
    ) {
        super(app, 'AuthRoutes');
        this.configureRoutes();
    }

    configureRoutes(): Application {
        this._app.post('/auth', [
            body('email').isEmail().optional(),
            body('password').isString(),
            this.bodyValidationMiddleware.verifyBodyFieldsErrors,
            this.authMiddleware.verifyUserPassword,
            this.authController.createJWT,
        ]);
        this._app.post('/auth/refresh-token', [
            this.jwtMiddleware.validJWTNeeded,
            this.jwtMiddleware.verifyRefreshBodyField,
            this.jwtMiddleware.validRefreshNeeded,
            this.authController.createJWT,
        ]);

        return this._app;
    }
}
