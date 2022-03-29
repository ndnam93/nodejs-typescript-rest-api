import { expect } from "chai";
import supertest from "supertest";
import app, { server } from '../../src/app';
import mongooseService from '../../src/common/services/mongoose.service';
import { nanoid } from 'nanoid';


let firstUserId = '', accessToken = '', refreshToken = '';
const firstUserBody = {
    email: `ndn+${nanoid(7)}@gmail.com`,
    password: '123123123',
};
const newFirstName = 'Jose';
const newFirstName2 = 'Paulo';
const newLastName2 = 'Faraco';

describe('users and auth endpoints', function () {
    let request: supertest.SuperAgentTest;
    before(function () {
        request = supertest.agent(app);
    });
    after(function (done) {
        server.close(function() {
            mongooseService.getMongoose().connection.close(done);
        })
    });

    it('should allow a POST to /users', async function() {
        const res = await request.post('/users').send(firstUserBody);
        expect(res.status).to.be.equal(201);
        expect(res.body).not.to.be.empty;
        expect(res.body).to.be.an('object');
        expect(res.body.id).to.be.a.string;
        firstUserId = res.body.id;
    });
    
    it('should allow a POST to /auth', async function() {
        const res = await request.post('/auth').send(firstUserBody);
        expect(res.status).to.be.equal(201);
        expect(res.body).not.to.be.empty;
        expect(res.body).to.be.an('object');
        expect(res.body.accessToken).to.be.a.string;
        accessToken = res.body.accessToken;
        refreshToken = res.body.refreshToken;
    });

    it('should allow a GET to /users/:userId with access token', async function () {
        const res = await request.get(`/users/${firstUserId}`)
            .set({Authorization: `Bearer ${accessToken}`})
            .send();
        expect(res.status).to.equal(200);
        expect(res.body).not.to.be.empty;
        expect(res.body).to.be.an('object');
        expect(res.body._id).to.be.a('string');
        expect(res.body._id).to.equal(firstUserId);
        expect(res.body.email).to.equal(firstUserBody.email);
    });

    describe('with a valid access token', function () {
        it('should disallow GET access to /users', async () => {
            const res = await request
                .get(`/users`)
                .set({ Authorization: `Bearer ${accessToken}` })
                .send();
            expect(res.status).to.equal(403);
        });
        
        it('should disallow a PATCH to /users/:userId', async function () {
            const res = await request
                .patch(`/users/${firstUserId}`)
                .set({ Authorization: `Bearer ${accessToken}` })
                .send({
                    firstName: newFirstName,
                });
            expect(res.status).to.equal(403);
        });

        it('should disallow a PUT to /users/:userId with an nonexistent ID', async function () {
            const res = await request
                .put(`/users/i-do-not-exist`)
                .set({ Authorization: `Bearer ${accessToken}` })
                .send({
                    email: firstUserBody.email,
                    password: firstUserBody.password,
                    firstName: 'Nam',
                    lastName: 'Nguyen',
                    permissionFlags: 256,
                });
            expect(res.status).to.equal(404);
        });

        it('should disallow a PUT to /users/:userId trying to change the permission flags', async function () {
            const res = await request
                .put(`/users/${firstUserId}`)
                .set({ Authorization: `Bearer ${accessToken}` })
                .send({
                    email: firstUserBody.email,
                    password: firstUserBody.password,
                    firstName: 'Nam',
                    lastName: 'Nguyen',
                    permissionFlags: 256,
                });
            expect(res.status).to.equal(403);
            expect(res.body.errors).to.be.an('array');
            expect(res.body.errors).to.have.length(1);
            expect(res.body.errors[0]).to.equal(
                'User cannot change permission flags'
            );
        });

        it('should disallow a PUT to /users/:userId/permissionFlags/2 for testing', async function () {
            const res = await request
                .put(`/users/${firstUserId}/permissionFlags/2`)
                .set({ Authorization: `Bearer ${accessToken}` })
                .send({});
                console.log(res.body)
            expect(res.status).to.equal(403);
        });

        describe('with a new set of permission flags', function () {
            it('should allow a POST to /auth/refresh-token', async function () {
                const res = await request
                    .post('/auth/refresh-token')
                    .set({ Authorization: `Bearer ${accessToken}` })
                    .send({ refreshToken });
                expect(res.status).to.equal(201);
                expect(res.body).not.to.be.empty;
                expect(res.body).to.be.an('object');
                expect(res.body.accessToken).to.be.a('string');
                accessToken = res.body.accessToken;
                refreshToken = res.body.refreshToken;
            });

            it('should allow a PUT to /users/:userId to change first and last names', async function () {
                const res = await request
                    .put(`/users/${firstUserId}`)
                    .set({ Authorization: `Bearer ${accessToken}` })
                    .send({
                        email: firstUserBody.email,
                        password: firstUserBody.password,
                        firstName: newFirstName2,
                        lastName: newLastName2,
                        permissionFlags: 1,
                    });
                expect(res.status).to.equal(204);
            });

            it('should allow a GET from /users/:userId and should have a new full name', async function () {
                const res = await request
                    .get(`/users/${firstUserId}`)
                    .set({ Authorization: `Bearer ${accessToken}` })
                    .send();
                expect(res.status).to.equal(200);
                expect(res.body).not.to.be.empty;
                expect(res.body).to.be.an('object');
                expect(res.body._id).to.be.a('string');
                expect(res.body.firstName).to.equal(newFirstName2);
                expect(res.body.lastName).to.equal(newLastName2);
                expect(res.body.email).to.equal(firstUserBody.email);
                expect(res.body._id).to.equal(firstUserId);
            });

            it('should allow a DELETE from /users/:userId', async function () {
                const res = await request
                    .delete(`/users/${firstUserId}`)
                    .set({ Authorization: `Bearer ${accessToken}` })
                    .send();
                expect(res.status).to.equal(204);
            });
        });
    });

})