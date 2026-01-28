import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/**
 * Google Keep Notes Schema for AWS DynamoDB
 * - Notes and Labels are stored per-user (owner-based authorization)
 * - Data syncs automatically across all devices
 */
const schema = a.schema({
    Note: a.model({
        noteTitle: a.string().required(),
        noteBody: a.string(),
        pinned: a.boolean().default(false),
        bgColor: a.string().default('#ffffff'),
        bgImage: a.string().default(''),
        checkBoxes: a.json(), // Array of CheckboxI objects
        isCbox: a.boolean().default(false),
        labels: a.json(), // Array of LabelI objects
        archived: a.boolean().default(false),
        trashed: a.boolean().default(false),
        images: a.json(), // Array of ImageI objects (base64 encoded)
        // Note: createdAt and updatedAt are auto-managed by Amplify Gen 2
    }).authorization((allow) => [allow.owner()]),

    Label: a.model({
        name: a.string().required(),
        color: a.string().default('#5f6368'),
    }).authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
    schema,
    authorizationModes: {
        defaultAuthorizationMode: 'userPool',
        // API key for public access (optional, not used by default)
        apiKeyAuthorizationMode: {
            expiresInDays: 365,
        },
    },
});
