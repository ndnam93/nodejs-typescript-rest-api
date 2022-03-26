import { singleton } from "tsyringe";
import { CRUD } from "../../common/interfaces/crud.interface";
import UsersDao from "../daos/users.dao";
import { CreateUserDto } from "../dto/create.user.dto";
import { PatchUserDto } from "../dto/patch.user.dto";
import { PutUserDto } from "../dto/put.user.dto";

@singleton()
class UsersService implements CRUD {
    constructor(private usersDao: UsersDao) {}

    async create(resource: CreateUserDto) {
        return this.usersDao.addUser(resource);
    }

    async deleteById(id: string) {
        return this.usersDao.removeUserById(id);
    }

    async list(limit: number, page: number) {
        return this.usersDao.getUsers(limit, page);
    }

    async patchById(id: string, resource: PatchUserDto) {
        return this.usersDao.updateUserById(id, resource);
    }

    async readById(id: string) {
        return this.usersDao.getUserById(id);
    }

    async putById(id: string, resource: PutUserDto) {
        return this.usersDao.updateUserById(id, resource);
    }

    async getUserByEmail(email: string) {
        return this.usersDao.getUserByEmail(email);
    }

    async getUserByEmailWithPassword(email: string) {
        return this.usersDao.getUserByEmailWithPassword(email);
    }
    
}

export default UsersService;
