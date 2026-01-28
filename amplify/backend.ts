import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

/**
 * AWS Amplify Backend Configuration
 * 
 * This defines the complete backend infrastructure:
 * - Cognito User Pool for authentication
 * - AppSync GraphQL API for data operations
 * - DynamoDB tables for Notes and Labels storage
 * 
 * Deploy with: npx ampx sandbox (for development)
 * Or: npx ampx pipeline-deploy (for production)
 * 
 * @see https://docs.amplify.aws/gen2/backend-api/define-backend
 */
const backend = defineBackend({
    auth,
    data,
});

// Export for potential custom CDK constructs
export { backend };
