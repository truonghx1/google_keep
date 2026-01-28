import { defineAuth } from '@aws-amplify/backend';

/**
 * AWS Cognito Authentication Configuration
 * Enables email-based login with password requirements
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
    loginWith: {
        email: {
            verificationEmailStyle: 'CODE',
            verificationEmailSubject: 'Your Google Keep Clone verification code',
            verificationEmailBody: (createCode) => 
                `Your verification code is: ${createCode()}`,
        },
    },
    // Password policy for user accounts
    userAttributes: {
        email: {
            required: true,
            mutable: true,
        },
    },
    // Account recovery via email
    accountRecovery: 'EMAIL_ONLY',
    // Multi-factor authentication (optional - can enable later)
    multifactor: {
        mode: 'OPTIONAL',
        totp: true,
    },
});
