export function getHighScore() {
	const hi = parseInt(localStorage.getItem('hi'));
	if (hi) {
		return hi;
	} else {
		localStorage.setItem('hi', '0');
		return 0;
	}
}

export function setHighScore(score: number) {
	localStorage.setItem('hi', `${score}`);
	return score;
}

export function isNewHighScore(score: number) {
	const hi = getHighScore();
	return score > hi;
}
