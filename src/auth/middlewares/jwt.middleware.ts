
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import UsersService from '../../users/services/users.service';
import { Jwt } from '../../common/types/jwt';
import { singleton } from 'tsyringe';

// @ts-expect-error
const jwtSecret: string = process.env.JWT_SECRET;

@singleton()
class JwtMiddleware {
    constructor(private usersService: UsersService) {}

    verifyRefreshBodyField(req: Request, res: Response, next: NextFunction) {
        if (req?.body.refreshToken) {
            next();
        } else {
            res.status(400).send({ error: 'Missing required field: refreshToken' });
        }
    }

    validJWTNeeded(req: Request, res: Response, next: NextFunction) {
        if (!req.headers['authorization']) {
            return res.status(401).send();
        }
        const [scheme, token] = req.headers['authorization'].split(' ');
        if (scheme !== 'Bearer') {
            return res.status(401).send();
        }
        try {
            res.locals.jwt = jwt.verify(token, jwtSecret) as Jwt;
            next();
        } catch (err) {
            return res.status(403).send();
        }
    }
    
    validRefreshNeeded = async (req: Request, res: Response, next: NextFunction) => {
        const user = await this.usersService.getUserByEmailWithPassword(res.locals.jwt.email);
        const salt = crypto.createSecretKey(
            Buffer.from(res.locals.jwt.refreshKey.data)
        );
        const hash = crypto
            .createHmac('sha512', salt)
            .update(res.locals.jwt.userId + jwtSecret)
            .digest('base64');
            
        if (hash === req.body.refreshToken) {
            req.body = {
                userId: user._id,
                email: user.email,
                permissionFlags: user.permissionFlags,
            };
            return next();
        } else {
            return res.status(400).send({ errors: ['Invalid refresh token'] });
        }
    }
}

export default JwtMiddleware;
