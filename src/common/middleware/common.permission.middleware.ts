import debug from "debug";
import { Request, Response, NextFunction } from 'express';
import { singleton } from "tsyringe";
import { PermissionFlag } from "./common.permissionflag.enum";


const log: debug.IDebugger = debug('app:common-permission-middleware');

@singleton()
class CommonPermissionMiddleware {
    permissionFlagRequired(requiredPermissionFlag: PermissionFlag) {
        return (req: Request, res: Response, next: NextFunction) => {
            try {
                const permissionFlag = parseInt(res.locals.jwt.permissionFlag);
                if (permissionFlag & requiredPermissionFlag) {
                    next();
                } else {
                    res.status(403).send();
                }
            } catch (err) {
                log(err);
            }
        }
    }

    onlySameUserOrAdminCanDoThisAction(req: Request, res: Response, next: NextFunction) {
        const permissionFlag = parseInt(res.locals.jwt.permissionFlag);
        if (req?.params?.userId == res.locals.jwt.userId
            || permissionFlag && permissionFlag & PermissionFlag.ADMIN_PERMISSION
        ) {
            next();
        } else {
            res.status(403).send();
        }
    }

    userCantChangePermission(req: Request, res: Response, next: NextFunction) {
        if ('permissionFlags' in req.body && req.body.permissionFlags != res.locals.user.permissionFlags) {
            res.status(403).send({ errors: ['User cannot change permission flags'] });
        } else {
            next();
        }
    }
}

export default CommonPermissionMiddleware;
