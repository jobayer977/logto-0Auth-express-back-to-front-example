import { createHash, randomFillSync } from 'crypto';
import {
	createRequester,
	discoveryPath,
	fetchOidcConfig,
	fetchTokenByAuthorizationCode,
	fetchTokenByRefreshToken,
	generateSignInUri,
	verifyAndParseCodeFromCallbackUri,
	withReservedScopes,
} from '@logto/js';

import fetch from 'node-fetch';
import { fromUint8Array } from 'js-base64';

export const config = {
	endpoint: 'http://localhost:3001',
	appId: 'fm0futjc91zaaq1cr3aww',
	redirectUri: 'http://localhost:3000/callback',
	scopes: withReservedScopes().split(' '),
};

const requester = createRequester(fetch as any);

const generateRandomString = (length = 64) => {
	return fromUint8Array(randomFillSync(new Uint8Array(length)), true);
};

const generateCodeChallenge = async (codeVerifier) => {
	const encodedCodeVerifier = new TextEncoder().encode(codeVerifier);
	const hash = createHash('sha256');
	hash.update(encodedCodeVerifier);
	const codeChallenge = hash.digest();
	return fromUint8Array(codeChallenge, true);
};

const getOidcConfig = async () => {
	return fetchOidcConfig(
		new URL(discoveryPath, config.endpoint).toString(),
		requester
	);
};

export const getSignInUrl = async () => {
	const { authorizationEndpoint } = await getOidcConfig();
	const codeVerifier = generateRandomString();
	const codeChallenge = await generateCodeChallenge(codeVerifier);
	const state = generateRandomString();

	const { redirectUri, scopes, appId: clientId } = config;

	const signInUri = generateSignInUri({
		authorizationEndpoint,
		clientId,
		redirectUri: redirectUri,
		codeChallenge,
		state: 'state',
		scopes,
	});

	return { redirectUri, codeVerifier, state, signInUri };
};

export const handleSignIn = async (signInSession, callbackUri) => {
	console.log({
		signInSession,
		callbackUri,
	});
	const { redirectUri, state, codeVerifier } = signInSession;
	const code = verifyAndParseCodeFromCallbackUri(
		callbackUri,
		redirectUri,
		state
	);
	console.log('🚀 ~ file: logot.ts:71 ~ handleSignIn ~ code:', code);

	const { appId: clientId } = config;
	const { tokenEndpoint } = await getOidcConfig();
	const codeTokenResponse = await fetchTokenByAuthorizationCode(
		{
			clientId,
			tokenEndpoint,
			redirectUri,
			codeVerifier,
			code,
		},
		requester
	);

	return codeTokenResponse;
};

export const refreshTokens = async (refreshToken) => {
	const { appId: clientId, scopes } = config;
	const { tokenEndpoint } = await getOidcConfig();
	const tokenResponse = await fetchTokenByRefreshToken(
		{
			clientId,
			tokenEndpoint,
			refreshToken,
			scopes,
		},
		requester
	);

	return tokenResponse;
};
