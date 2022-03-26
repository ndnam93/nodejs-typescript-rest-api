import { Request, Response, NextFunction } from 'express';
import argon2 from 'argon2';
import UsersService from '../../users/services/users.service';
import { singleton } from 'tsyringe';

@singleton()
class AuthMiddleware {
    constructor(private usersService: UsersService) {}

    verifyUserPassword = async (req: Request, res: Response, next: NextFunction) => {
        const user = await this.usersService.getUserByEmailWithPassword(req.body.email);
        if (user) {
            if (await argon2.verify(user.password, req.body.password)) {
                req.body = {
                    userId: user._id,
                    email: user.email,
                    permissionFlags: user.permissionFlags,
                }
                return next();
            }
        }
        res.status(400).send({errors: 'Invalid email/password'});
    }
}

export default AuthMiddleware;
