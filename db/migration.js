const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const collections = ["admin", "tenants", "users"];
module.exports = (config) => {
	let db, client;
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
		db = client.db(config.db)
		let i = 0;
		return new Promise((resolve, reject) => {
			collections.forEach((col) => {
				db.createCollection(col, {}).then(() => {
					i++;
					if (i >= collections.length) {
						resolve(client);
					}
				}).catch((err) => {
					console.log("Error: ", err);
					reject(err);
				});
			});
		});
	}).then((client) => {
		client.close();
		console.log("Migration completed");
	}).catch((err) => {
		console.log(err);
	});
}