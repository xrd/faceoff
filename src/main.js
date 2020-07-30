
// if (document) {
// 	if ((document.location.host !== 'localhost' &&
// 			-1 !== document.location.host.includes("10.0.0")) &&
// 		document.location.protocol !== 'https:') {
// 		document.location = `https://${document.location.host}/`;
// 	}
// }

// if (document) {
// 	if ((!document.location.host.includes('localhost') &&
// 		!document.location.host.includes("10.0.0")) &&
// 		document.location.protocol !== 'https:') {
// 		document.location = `https://${document.location.host}/`;
// 	} else {
// 		// console.log('No need, ignore it');
// 	}
// }

import App from './App.svelte';

const app = new App({
	target: document.body,
});

window.app = app;

export default app;