import { body } from 'express-validator';
import { Application } from 'express';
import UsersController from './controllers/users.controller';
import UsersMiddleware from './middlewares/users.middleware';
import BodyValidationMiddleware from '../common/middleware/body.validation.middleware';
import CommonRoutesConfig from '../common/common.routes.config';
import { PermissionFlag } from "../common/middleware/common.permissionflag.enum";
import PermissionMiddleware from "../common/middleware/common.permission.middleware";
import JwtMiddleware from '../auth/middlewares/jwt.middleware';
import { inject, injectable } from 'tsyringe';

@injectable()
export default class UsersRoutes extends CommonRoutesConfig {
    constructor(
        @inject('Application') app: Application,
        private usersMiddleware: UsersMiddleware,
        private permissionMiddleware: PermissionMiddleware,
        private jwtMiddleware: JwtMiddleware,
        private bodyValidationMiddleware: BodyValidationMiddleware,
        private usersController: UsersController,
    ) {
        super(app, 'UsersRoutes');
        this.configureRoutes();
    }

    configureRoutes(): Application {
        this._app.route('/users')
            .get(
                this.jwtMiddleware.validJWTNeeded,
                this.permissionMiddleware.permissionFlagRequired(PermissionFlag.ADMIN_PERMISSION),
                this.usersController.listUsers
            )
            .post(
                body('email').isEmail(),
                body('password')
                    .isLength({ min: 5 })
                    .withMessage('Must include password (5+ characters)'),
                this.bodyValidationMiddleware.verifyBodyFieldsErrors,
                this.usersMiddleware.validateSameEmailDoesntExist,
                this.usersController.createUser
            );
        this._app.param(`userId`, this.usersMiddleware.extractUserId);
        this._app
            .route(`/users/:userId`)
            .all(
                this.usersMiddleware.validateUserExists,
                this.jwtMiddleware.validJWTNeeded,
                this.permissionMiddleware.onlySameUserOrAdminCanDoThisAction,
            )
            .get(this.usersController.getUserById)
            .delete(this.usersController.removeUser)
            .put([
                body('email').isEmail(),
                body('password')
                    .isLength({ min: 5 })
                    .withMessage('Must include password (5+ characters)'),
                body('firstName').isString(),
                body('lastName').isString(),
                body('permissionFlags').isInt(),
                this.bodyValidationMiddleware.verifyBodyFieldsErrors,
                this.usersMiddleware.validateSameEmailBelongToSameUser,
                this.permissionMiddleware.userCantChangePermission,
                this.usersController.put,
            ])
            .patch([
                this.jwtMiddleware.validJWTNeeded,
                this.permissionMiddleware.permissionFlagRequired(PermissionFlag.PAID_PERMISSION),
                body('email').isEmail().optional(),
                body('password')
                    .isLength({ min: 5 })
                    .withMessage('Must include password (5+ characters)')
                    .optional(),
                body('firstName').isString().optional(),
                body('lastName').isString().optional(),
                body('permissionFlags').isInt().optional(),
                this.bodyValidationMiddleware.verifyBodyFieldsErrors,
                this.usersMiddleware.validatePatchEmail,
                this.permissionMiddleware.userCantChangePermission,
                this.usersController.patch,
            ]);
        this._app.put(`/users/:userId/permissionFlags/:permissionFlags`, [
            this.jwtMiddleware.validJWTNeeded,
            this.permissionMiddleware.onlySameUserOrAdminCanDoThisAction,
            this.permissionMiddleware.permissionFlagRequired(PermissionFlag.FREE_PERMISSION),
            this.usersController.updatePermissionFlags,
        ]);

        return this._app;
    }
}
