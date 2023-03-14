const neo4j = require("neo4j-driver");
const driver = neo4j.driver(
	process.env.NEO4J_URI,
	neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASS),
	{disableLosslessIntegers: true}
);

//unique user id constraint
// constraint = ograniczenie

const session = driver.session();
session
	.run(
		`
    CREATE CONSTRAINT IF NOT EXISTS FOR (user:User) REQUIRE user.id IS UNIQUE
`
	)
	.then(() => {
		console.log("User id constraint created");
		session.close();
	});

const session2 = driver.session();
session2
	.run(
		`
    CREATE CONSTRAINT IF NOT EXISTS FOR (p:PhotoPost) REQUIRE p.id IS UNIQUE
`
	)
	.then(() => {
		console.log("Photo Post id constraint created");
		session2.close();
	});

const session3 = driver.session();

session3
	.run(
		`
    CREATE CONSTRAINT IF NOT EXISTS FOR (s:Status) REQUIRE s.id IS UNIQUE
`
	)
	.then(() => {
		console.log("Status id constraint created");
		session3.close();
	});

module.exports = driver;
