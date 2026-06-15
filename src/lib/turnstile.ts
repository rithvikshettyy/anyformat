/**
 * Validates a Cloudflare Turnstile token server-side by sending a POST request
 * to the Turnstile verification API endpoint.
 * 
 * @param token The Turnstile client response token.
 * @returns Promise<boolean> True if verification is successful, false otherwise.
 */
export async function validateTurnstileToken(token: string | null): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  
  if (!secretKey) {
    console.warn('TURNSTILE_SECRET_KEY is not configured. Allowing request for local development.');
    return true;
  }

  if (!token) {
    console.warn('Turnstile token was missing in request.');
    return false;
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
      }),
    });

    const data = await response.json();
    return !!data.success;
  } catch (error) {
    console.error('Error verifying Cloudflare Turnstile token:', error);
    return false;
  }
}
