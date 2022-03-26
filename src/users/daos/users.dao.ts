import { CreateUserDto } from "../dto/create.user.dto";
import { PatchUserDto } from '../dto/patch.user.dto';
import { PutUserDto } from '../dto/put.user.dto';
import { Schema } from 'mongoose';
import _ from 'lodash';
import { nanoid } from "nanoid";
import debug from "debug";
const log: debug.IDebugger = debug('app:in-memory-dao');
import mongooseService from "../../common/services/mongoose.service";
import { PermissionFlag } from "../../common/middleware/common.permissionflag.enum";
import { singleton } from "tsyringe";


@singleton()
class UsersDao {
    userSchema = new Schema({
        _id: String,
        email: String,
        password: { type: String, select: false },
        firstname: String,
        lastName: String,
        permissionFlags: Number,
    }, { id: false });
    User = mongooseService.getMongoose().model('Users', this.userSchema);

    constructor() {
        log('Created new instance of UsersDao');
    }

    async addUser(userFields: CreateUserDto) {
        const userId = nanoid(7);
        const user = new this.User({
            _id: userId,
            ...userFields,
            permissionFlags: PermissionFlag.FREE_PERMISSION,
        });
        await user.save();
        return userId;
    }

    async getUserByEmail(email: string) {
        return this.User.findOne({ email }).exec();
    }

    async getUserByEmailWithPassword(email: string) {
        return this.User.findOne({ email })
            .select('_id email permissionFlags +password')
            .exec();
    }

    async getUserById(_id: string) {
        return this.User.findOne({ _id }).exec();
    }

    async getUsers(limit = 25, page = 0) {
        return this.User.find()
            .limit(limit)
            .skip(limit * page)
            .exec();
    }

    async updateUserById(_id: string, userFields: PutUserDto | PatchUserDto) {
        const user = await this.User.findOneAndUpdate(
            { _id },
            { $set: userFields },
            { new: true }
        ).exec();

        return user;
    }
    
    async removeUserById(_id: string) {
        return this.User.deleteOne({ _id }).exec();
    }
}

export default UsersDao;
