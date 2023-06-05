import NodeClient from '@logto/node';
import cookie from 'cookie';
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

const ENV = {
	OAUTH_LOGTO_APP_ID: 'xxxxxx',
	OAUTH_LOGTO_DOMAIN: 'https://xxxx.com',
	OAUTH_LOGTO_ENDPOINT: 'https://xxx.com',
	OAUTH_LOGTO_CALLBACK_URL: 'http://xxxx/sign-in-callback',
	OAUTH_LOGTO_REDIRECT_URL: 'https://xxxx.com',
};

const createNodeClient = (request, response) => {
	if (!request.session) {
		throw new Error(
			'Please configure `session` middleware in your express app before using Logto.'
		);
	}
	const storage = new ExpressStorage(request);
	return new NodeClient(
		{
			appId: ENV.OAUTH_LOGTO_APP_ID,
			endpoint: ENV.OAUTH_LOGTO_ENDPOINT,
		},
		{
			storage,
			navigate: (url) => {
				response.redirect(url);
			},
		}
	);
};
const app = express();
const port = 3000;
app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 60000 } }));
app.get('/logto/sign-in', async (request, response) => {
	const nodeClient = createNodeClient(request, response);
	await nodeClient.signIn(ENV.OAUTH_LOGTO_CALLBACK_URL);
});

app.get('/logto/sign-up', async (request, response) => {
	const nodeClient = createNodeClient(request, response);
	await nodeClient.signIn(ENV.OAUTH_LOGTO_CALLBACK_URL, 'signUp');
});

app.get('/logto/sign-in-callback', async (request, response) => {
	const nodeClient = createNodeClient(request, response);
	if (request.url) {
		const res = await nodeClient.handleSignInCallback(
			`http://localhost:3000${request.originalUrl}`
		);
		const token = await nodeClient.getAccessToken();
		// const idToken = await nodeClient.getIdToken();
		// const isSignInRedirected = await nodeClient.isSignInRedirected(
		// 	`${config.baseUrl}${request.originalUrl}`
		// );
		// const userInfo = await nodeClient.fetchUserInfo();
		const redirectParams = new URLSearchParams({
			access_token: token,
		});
		response.redirect(
			`${ENV.OAUTH_LOGTO_REDIRECT_URL}/?${redirectParams.toString()}`
		);
	}
});

app.get('/logto/sign-out', async (request, response) => {
	const nodeClient = createNodeClient(request, response);
	await nodeClient.signOut(ENV.OAUTH_LOGTO_REDIRECT_URL);
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
