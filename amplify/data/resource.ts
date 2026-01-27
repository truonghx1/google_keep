import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. https://docs.amplify.aws/gen2/build-a-backend/data/model-based-data-schema/
=========================================================================*/
const schema = a.schema({
    Note: a.model({
        // We use string ID for cloud compatibility. Client needs to handle mapping or migration.
        noteTitle: a.string().required(),
        noteBody: a.string(),
        pinned: a.boolean().default(false),
        bgColor: a.string(),
        bgImage: a.string(),
        checkBoxes: a.json(), // Array of CheckboxI
        isCbox: a.boolean(),
        labels: a.json(), // Array of LabelI
        archived: a.boolean(),
        trashed: a.boolean(),
        images: a.json(), // Array of ImageI
    }).authorization(allow => [allow.owner()]),

    Label: a.model({
        name: a.string().required(),
        color: a.string(),
    }).authorization(allow => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
    schema,
    authorizationModes: {
        defaultAuthorizationMode: 'userPool',
    },
});
