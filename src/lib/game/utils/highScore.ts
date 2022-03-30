/**
 * Gets high score
 * @returns High score
 */
export function getHighScore() {
	const hi = parseInt(localStorage.getItem('hi'));
	if (hi) {
		return hi;
	} else {
		localStorage.setItem('hi', '0');
		return 0;
	}
}

/**
 * Sets new high score
 * @param score - New high score
 * @returns New high score
 */
export function setHighScore(score: number) {
	localStorage.setItem('hi', `${score}`);
	return score;
}

/**
 * Checks if given score is new high score
 * @param score - Current score
 * @returns `true` if current score is new high score
 */
export function isNewHighScore(score: number) {
	const hi = getHighScore();
	return score > hi;
}
