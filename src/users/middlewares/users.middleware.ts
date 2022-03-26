import { Request, Response, NextFunction } from 'express';
import UsersService from '../services/users.service';
import debug from 'debug';
import { singleton } from 'tsyringe';

const log: debug.IDebugger = debug('app:users-controller');

@singleton()
class UsersMiddleware {
    constructor(private usersService: UsersService) { }

    validateRequiredUserBodyFields = async (req: Request, res: Response, next: NextFunction) => {
        if (req.body && req.body.email && req.body.password) {
            next();
        } else {
            res.status(400).send({
                error: `Missing required fields email and password`,
            });
        }
    }

    validateSameEmailDoesntExist = async (req: Request, res: Response, next: NextFunction) => {
        const user = await this.usersService.getUserByEmail(req.body.email);
        if (user) {
            res.status(400).send({ error: `User email already exists` });
        } else {
            next();
        }
    }

    async validateSameEmailBelongToSameUser(req: Request, res: Response, next: NextFunction) {
        const user = await this.usersService.getUserByEmail(req.body.email);
        if (user?._id === req.params.userId) {
            next();
        } else {
            res.status(400).send({ error: `Invalid email` });
        }
    }

    // Here we need to use an arrow function to bind `this` correctly
    validatePatchEmail = async (req: Request, res: Response, next: NextFunction) => {
        if (req.body.email) {
            log('Validating email', req.body.email);

            this.validateSameEmailBelongToSameUser(req, res, next);
        } else {
            next();
        }
    };

    validateUserExists = async (req: Request, res: Response, next: NextFunction) => {
        const user = await this.usersService.readById(req.params.userId);
        if (user) {
            res.locals.user = user;
            next();
        } else {
            res.status(404).send({
                error: `User ${req.params.userId} not found`,
            });
        }
    }

    async extractUserId(req: Request, res: Response, next: NextFunction, userId: string) {
        req.body.id = userId;
        next();
    }
}

export default UsersMiddleware;
