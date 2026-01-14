/**
 * Spam detection utilities for identifying suspicious contact form submissions
 * based on name entropy and pronounceability heuristics.
 */

/**
 * Calculate Shannon entropy of a string (measure of randomness)
 * Higher entropy = more random/unpredictable
 */
function calculateShannonEntropy(str: string): number {
	const len = str.length;
	const frequencies = new Map<string, number>();

	for (const char of str.toLowerCase()) {
		frequencies.set(char, (frequencies.get(char) || 0) + 1);
	}

	let entropy = 0;
	for (const count of frequencies.values()) {
		const probability = count / len;
		entropy -= probability * Math.log2(probability);
	}

	return entropy;
}

/**
 * Calculate spam score for a name (0-10 scale)
 *
 * Score interpretation:
 * - 0-5: Legitimate name (allow submission)
 * - 6+: Highly likely spam (block submission)
 *
 * Detection heuristics:
 * 1. Entropy (randomness) - random strings have high entropy
 * 2. Vowel ratio (pronounceability) - human names have balanced vowels
 * 3. Consecutive consonants - excessive consonants are unpronounceable
 * 4. Mixed case randomness - bots often use random casing
 * 5. Length extremes - very long names are suspicious
 * 6. Multiple uppercase in a row - unnatural patterns
 */
export function calculateNameSpamScore(name: string): number {
	if (!name || name.trim().length === 0) {
		return 10;
	}

	const trimmedName = name.trim();
	let score = 0;

	// 1. Entropy check (randomness detection)
	const entropy = calculateShannonEntropy(trimmedName);
	if (entropy > 3.8) {
		score += 4;
	} else if (entropy > 3.4) {
		score += 3;
	} else if (entropy > 3.0) {
		score += 2;
	}

	// 2. Vowel ratio (pronounceability)
	const vowelCount = (trimmedName.match(/[aeiouAEIOU]/g) || []).length;
	const vowelRatio = vowelCount / trimmedName.length;

	if (vowelRatio < 0.2 || vowelRatio > 0.6) {
		score += 3;
	} else if (vowelRatio < 0.25 || vowelRatio > 0.55) {
		score += 2;
	}

	// 3. Consecutive consonants
	if (/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]{4,}/.test(trimmedName)) {
		score += 3;
	} else if (
		/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]{3}/.test(trimmedName)
	) {
		score += 1;
	}

	// 4. Mixed case randomness
	const caseChanges = (trimmedName.match(/[a-z][A-Z]|[A-Z][a-z]/g) || [])
		.length;

	if (caseChanges > 3) {
		score += 3;
	} else if (caseChanges > 2) {
		score += 2;
	}

	// 5. Multiple consecutive uppercase letters (not at start)
	if (/[A-Z]{3,}/.test(trimmedName.slice(1))) {
		score += 2;
	}

	// 6. Length extremes
	if (trimmedName.length > 20) {
		score += 3;
	} else if (trimmedName.length > 15) {
		score += 2;
	}

	// 7. Digit-heavy names
	const digitCount = (trimmedName.match(/\d/g) || []).length;
	const digitRatio = digitCount / trimmedName.length;

	if (digitRatio > 0.3) {
		score += 3;
	} else if (digitRatio > 0.2) {
		score += 2;
	}

	return Math.min(score, 10);
}

/**
 * Determine if a name should be blocked from submission
 */
export function shouldBlockSubmission(name: string): boolean {
	return calculateNameSpamScore(name) >= 6;
}
