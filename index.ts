import NodeClient from '@logto/node';
import express from 'express';
import session from 'express-session';

class ExpressStorage {
	request: any;
	constructor(request) {
		this.request = request;
	}
	async setItem(key, value) {
		this.request.session[key] = value;
	}
	async getItem(key) {
		const value = this.request.session[key];
		if (value === undefined) {
			return null;
		}
		return String(value);
	}
	async removeItem(key) {
		this.request.session[key] = undefined;
	}
}
const config = {
	appId: 'fm0futjc91zaaq1cr3aww', // Replace with your own appId
	appSecret: 'krv040n1k2z62fi7s3b2b', // Replace with your own appSecret
	endpoint: 'http://localhost:3001',
	baseUrl: 'http://localhost:3000',
};
const createNodeClient = (request, response, config) => {
	if (!request.session) {
		throw new Error(
			'Please configure `session` middleware in your express app before using Logto.'
		);
	}
	const storage = new ExpressStorage(request);
	return new NodeClient(config, {
		storage,
		navigate: (url) => {},
	});
};
const app = express();
const port = 3000;
app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 60000 } }));
app.get('/logto/sign-in', async (request, response) => {
	const nodeClient = createNodeClient(request, response, config);
	await nodeClient.signIn(`${config.baseUrl}/logto/sign-in-callback`);
});

app.get('/logto/sign-up', async (request, response) => {
	const nodeClient = createNodeClient(request, response, config);
	await nodeClient.signIn(`${config.baseUrl}/logto/sign-in-callback`, 'signUp');
});

app.get('/logto/sign-in-callback', async (request, response) => {
	const nodeClient = createNodeClient(request, response, config);
	if (request.url) {
		const res = await nodeClient.handleSignInCallback(
			`${config.baseUrl}${request.originalUrl}`
		);
		const token = await nodeClient.getAccessToken();
		const idToken = await nodeClient.getIdToken();
		const isSignInRedirected = await nodeClient.isSignInRedirected(
			`${config.baseUrl}${request.originalUrl}`
		);
		const userInfo = await nodeClient.fetchUserInfo();
		response.cookie('token', token, {
			maxAge: 14 * 24 * 60 * 60 * 1000,
			httpOnly: true,
		});
		response.redirect(config.baseUrl);
	}
});

app.get('/logto/sign-out', async (request, response) => {
	const nodeClient = createNodeClient(request, response, config);
	await nodeClient.signOut(config.baseUrl);
});

// Route for any other action
app.get('/logto/:action', (request, response) => {
	response.status(404).end();
});

app.get('/', (req, res) => {
	res.send('Hello, TypeScript with Express!');
});
app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
	console.log('http://localhost:3000/logto/sign-in');
});
