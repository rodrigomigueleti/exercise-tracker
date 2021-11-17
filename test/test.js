var assert = require('assert');
const fetch = require('node-fetch');

describe('teste 1', function() {
	it('testar cadastro de exercicio', async function() {
		const url = 'http://127.0.0.1:3000';
		console.log(url);
		const res = await fetch(url + '/api/users', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: `username=fcc_test_${Date.now()}`.substr(0, 29)
			});
		if (res.ok) {
			console.log('Res.OK');
			const { _id, username } = await res.json();
			const expected = {
				username,
				description: 'test',
				duration: 60,
				_id,
				date: new Date().toDateString()
			};
			console.log(url + `/api/users/${_id}/exercises`);
			const addRes = await fetch(url + `/api/users/${_id}/exercises`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: `description=${expected.description}&duration=${expected.duration}`
			});
			if (addRes.ok) {
				console.log("addRes.ok");
				const logRes = await fetch(url + `/api/users/${_id}/logs`);
				assert.isTrue(logRes.ok);
				if(!logRes.ok) {
					throw new Error(`${logRes.status} ${logRes.statusText}`)
				};
			} else {
				throw new Error(`${addRes.status} ${addRes.statusText}`);
			}
		} else {
			console.log('erro');
			throw new Error(`${res.status} ${res.statusText}`);
		}
	})
});