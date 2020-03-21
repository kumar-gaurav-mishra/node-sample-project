module.exports = function (config, id) {
	'use strict';
	const mongodb = require('mongodb');
	const MongoClient = mongodb.MongoClient;
	const ObjectId = require('mongodb').ObjectID;
	let client;
	return new Promise((resolve, reject) => {
		MongoClient.connect(`${config.dbPath}${config.db}`, (err, dbclient) => {
			if (err) {
				console.log(err);
				return reject(err);
			}
			return resolve(dbclient);
		});
	}).then((database) => {
		client = database;
		let db = client.db(config.db);
		return db.collection('tenants').findOne({
			_id: ObjectId(id)
		});
	}).then((data) => {
		if (client) client.close();
		if (!data || !data.orgId) {
			return Promise.reject({
				message: "Invalid tenantId"
			});
		} else {
			return Promise.resolve(data);
		}
	}).catch((err) => {
		console.log("err : ", err);
		if (client) client.close();
		return Promise.reject(err);
	});
}