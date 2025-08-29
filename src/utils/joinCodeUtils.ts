/**
 * Utility functions for joinCode validation and normalization
 */

/**
 * Shared constants for join codes
 */
export const JOIN_CODE_LENGTH = 6;
export const JOIN_CODE_PLACEHOLDER = "Enter invite code";

/**
 * Normalizes and validates a joinCode to match backend expectations.
 * 
 * Process:
 * 1. Apply NFKC normalization (handles homoglyphs and fullwidth characters)
 * 2. Convert to uppercase
 * 3. Remove any characters not in A-Z or 0-9
 * 4. Validate length is exactly 6 characters
 * 
 * @param input - Raw joinCode input from user
 * @returns Normalized 6-character A-Z/0-9 code, or null if invalid
 */
export function normalizeJoinCode(input: string | null): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  // Step 1: Apply NFKC normalization to handle Unicode variations
  const nfkcNormalized = input.normalize('NFKC');
  
  // Step 2: Convert to uppercase
  const uppercase = nfkcNormalized.toUpperCase();
  
  // Step 3: Remove any characters not in A-Z or 0-9
  const alphanumericOnly = uppercase.replace(/[^A-Z0-9]/g, '');
  
  // Step 4: Validate length is exactly 6 characters
  if (alphanumericOnly.length !== JOIN_CODE_LENGTH) {
    return null;
  }
  
  return alphanumericOnly;
}

/**
 * Validates if a string is a properly formatted joinCode
 * (6 characters, uppercase A-Z and 0-9 only)
 */
export function isValidJoinCode(code: string | null): boolean {
  if (!code || typeof code !== 'string') {
    return false;
  }
  
  return new RegExp(`^[A-Z0-9]{${JOIN_CODE_LENGTH}}$`).test(code);
}

/**
 * Formats user input for join codes in real-time
 * Converts to uppercase, removes non-alphanumeric chars, enforces max length
 */
export function formatJoinCodeInput(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, JOIN_CODE_LENGTH);
}