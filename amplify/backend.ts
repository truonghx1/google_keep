import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

/**
 * @see https://docs.amplify.aws/gen2/backend-api/define-backend
 */
defineBackend({
    auth,
    data,
});
