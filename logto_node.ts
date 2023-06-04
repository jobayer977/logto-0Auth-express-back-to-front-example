import { config, getSignInUrl, handleSignIn } from './logot';
import { decodeIdToken, verifyAndParseCodeFromCallbackUri } from '@logto/js';

import express from 'express';
import session from 'express-session';

const app = express();
const port = 3000;
app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 60000 } }));

app.get('/callback', async (req, res) => {
	if (!req.session.signIn) {
		res.send('Bad request.');
		return;
	}

	console.log(req.session);
	const response = await handleSignIn(
		req.session.signIn,
		`${req.protocol}://${req.get('host')}${req.originalUrl}`
	);
	const varification = verifyAndParseCodeFromCallbackUri(
		req.url,
		req.session.signIn.redirectUri,
		req.session.signIn.state
	);
	console.log('🚀 ~ file: index.ts:23 ~ app.get ~ varification:', varification);
	req.session.tokens = {
		// ...response,
		expiresAt: 'response.expiresIn + Date.now()',
		idToken: 'decodeIdToken(response.idToken)',
	};
	req.session.signIn = null;

	res.redirect('http://127.0.0.1:5174');
});

app.get('/sign-in', async (req, res) => {
	const { redirectUri, codeVerifier, state, signInUri } = await getSignInUrl();
	console.log(req.session, 'fuckkkkkk');
	req.session.signIn = { codeVerifier, state, redirectUri };
	res.redirect(signInUri);
});

app.get('/', (req, res) => {
	res.send('Hello, TypeScript with Express!');
});

app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
	console.log('http://localhost:3000/sign-in');
});
