import { Request, Response } from 'express';
import UsersService from '../services/users.service';
import argon2 from 'argon2';
import debug from 'debug';
import { PatchUserDto } from '../dto/patch.user.dto';
import { singleton } from 'tsyringe';

const log: debug.IDebugger = debug('app:users-controller');

@singleton()
class UsersController {
    constructor(private usersService: UsersService) {}

    listUsers = async (req: Request, res: Response) => {
        const users = await this.usersService.list(100, 0);
        res.status(200).send(users);
    }

    getUserById = async (req: Request, res: Response) => {
        const user = await this.usersService.readById(req.body.id);
        res.status(200).send(user);
    }

    createUser = async (req: Request, res: Response) => {
        req.body.password = await argon2.hash(req.body.password);
        const userId = await this.usersService.create(req.body);
        res.status(201).send({ id: userId });
    }

    patch = async (req: Request, res: Response) => {
        if (req.body.password) {
            req.body.password = await argon2.hash(req.body.password);
        }
        log(await this.usersService.patchById(req.body.id, req.body));
        res.status(204).send();
    }

    put = async (req: Request, res: Response) => {
        req.body.password = await argon2.hash(req.body.password);
        log(await this.usersService.putById(req.body.id, req.body));
        res.status(204).send();
    }

    removeUser = async (req: Request, res: Response) => {
        log(await this.usersService.deleteById(req.body.id));
        res.status(204).send();
    }

    updatePermissionFlags = async (req: Request, res: Response) => {
        const patchUserDto: PatchUserDto = {
            permissionFlags: parseInt(req.params.permissionFlags),
        };
        log(await this.usersService.patchById(req.body.id, patchUserDto));
        res.status(204).send();
    }
}

export default UsersController;