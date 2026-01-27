# AWS Deployment Guide for Google Keep Clone

This guide provides step-by-step instructions for deploying the Google Keep clone application to AWS Amplify with cloud storage.

## Prerequisites

Before you begin, ensure you have:

1. **AWS Account** - [Sign up here](https://aws.amazon.com/)
2. **Node.js** - Version 14 or higher ([Download](https://nodejs.org/))
3. **Git** - For version control
4. **Angular CLI** - Install globally: `npm install -g @angular/cli`

---

## Part 1: Local Setup

### 1. Install Dependencies

```bash
cd e:\GIT\google_keep
npm install
```

### 2. Test Locally

```bash
npm run start
```

Visit `http://localhost:4200` to verify the application works with the new image paste feature.

**Test the image paste:**
1. Take a screenshot (Windows: Win+Shift+S)
2. Click "Take a note..."
3. Press Ctrl+V in the note
4. Verify the image appears

---

## Part 2: Install AWS Amplify

### 1. Install AWS Amplify Packages

```bash
npm install aws-amplify @aws-amplify/ui-angular
```

### 2. Install Amplify CLI

```bash
npm install -g @aws-amplify/cli
```

### 3. Configure AWS Amplify CLI

```bash
amplify configure
```

This will:
- Open AWS Console in your browser
- Ask you to create an IAM user
- Provide access keys for CLI access

Follow the prompts carefully and save your access keys securely.

---

## Part 3: Initialize Amplify Backend

### 1. Initialize Amplify in Your Project

```bash
cd e:\GIT\google_keep
amplify init
```

Answer the prompts:
```
? Enter a name for the project: googlekeepclone
? Initialize the project with the above configuration? No
? Enter a name for the environment: dev
? Choose your default editor: Visual Studio Code
? Choose the type of app that you're building: javascript
? What javascript framework are you using: angular
? Source Directory Path: src
? Distribution Directory Path: dist/keep
? Build Command: npm run build
? Start Command: ng serve
? Do you want to use an AWS profile? Yes
? Please choose the profile you want to use: default
```

This creates an `amplify` folder in your project.

### 2. Add Authentication

```bash
amplify add auth
```

Choose:
```
? Do you want to use the default authentication and security configuration? Default configuration
? How do you want users to be able to sign in? Email
? Do you want to configure advanced settings? No, I am done.
```

### 3. Add API (GraphQL)

```bash
amplify add api
```

Choose:
```
? Select from one of the below mentioned services: GraphQL
? Here is the GraphQL API that we will create. Select a setting to edit or continue: Continue
? Choose a schema template: Blank Schema
```

This creates `amplify/backend/api/` folder.

### 4. Define GraphQL Schema

Open `amplify/backend/api/googlekeepclone/schema.graphql` and replace with:

```graphql
type Note @model @auth(rules: [{allow: owner}]) {
  id: ID!
  noteTitle: String!
  noteBody: String
  pinned: Boolean!
  bgColor: String
  bgImage: String
  images: AWSJSON
  checkBoxes: AWSJSON
  isCbox: Boolean!
  archived: Boolean!
  trashed: Boolean!
  labels: [Label] @manyToMany(relationName: "NoteLabels")
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}

type Label @model @auth(rules: [{allow: owner}]) {
  id: ID!
  name: String!
  notes: [Note] @manyToMany(relationName: "NoteLabels")
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}
```

**Note:** We're using `AWSJSON` type for images and checkBoxes to store complex JSON data.

### 5. Deploy Backend to AWS

```bash
amplify push
```

Choose:
```
? Are you sure you want to continue? Yes
? Do you want to generate code for your newly created GraphQL API? Yes
? Choose the code generation language target: angular
? Enter the file name pattern of graphql queries, mutations and subscriptions: src/graphql/**/*.graphql
? Do you want to generate/update all possible GraphQL operations? Yes
? Enter maximum statement depth: 2
? Enter the file name for the generated code: src/app/API.service.ts
```

This will:
- Create DynamoDB tables
- Set up AppSync GraphQL API
- Configure Cognito User Pool
- Generate TypeScript types and API service

**This step takes 5-10 minutes.**

---

## Part 4: Integrate Amplify in Angular App

### 1. Configure Amplify in `main.ts`

Edit `src/main.ts`:

```typescript
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { Amplify } from 'aws-amplify';
import awsconfig from './aws-exports';

Amplify.configure(awsconfig);

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
```

### 2. Update `tsconfig.json`

Add to `compilerOptions`:

```json
{
  "compilerOptions": {
    //... existing options
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true
  }
}
```

### 3. Update `.gitignore`

Add:
```
# Amplify
amplify/\#current-cloud-backend
amplify/.config/local-*
amplify/logs
amplify/mock-data
amplify/mock-api-resources
amplify/backend/amplify-meta.json
amplify/backend/.temp
build/
dist/
node_modules/
aws-exports.js
awsconfiguration.json
amplifyconfiguration.json
amplifyconfiguration.dart
amplify-build-config.json
amplify-gradle-config.json
amplifytools.xcconfig
.secret-*
**.sample
#amplify-do-not-edit-begin
amplify/backend/auth/googlekeepclonexxx/cli-inputs.json
#amplify-do-not-edit-end
```

---

## Part 5: Update Services to Use AWS Amplify

### 1. Create Auth Service

Create `src/app/services/auth.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { Auth } from 'aws-amplify';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public isAuthenticated$ = new BehaviorSubject<boolean>(false);
  public currentUser$ = new BehaviorSubject<any>(null);

  constructor() {
    this.checkAuthStatus();
  }

  async checkAuthStatus() {
    try {
      const user = await Auth.currentAuthenticatedUser();
      this.isAuthenticated$.next(true);
      this.currentUser$.next(user);
    } catch {
      this.isAuthenticated$.next(false);
      this.currentUser$.next(null);
    }
  }

  async signUp(email: string, password: string) {
    try {
      const { user } = await Auth.signUp({
        username: email,
        password,
        attributes: { email }
      });
      return { success: true, user };
    } catch (error:any) {
      return { success: false, error: error.message };
    }
  }

  async signIn(email: string, password: string) {
    try {
      const user = await Auth.signIn(email, password);
      this.isAuthenticated$.next(true);
      this.currentUser$.next(user);
      return { success: true, user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async signOut() {
    try {
      await Auth.signOut();
      this.isAuthenticated$.next(false);
      this.currentUser$.next(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  async confirmSignUp(email: string, code: string) {
    try {
      await Auth.confirmSignUp(email, code);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
```

### 2. Update Notes Service

Replace Dexie calls in `src/app/services/notes.service.ts` with Amplify API calls:

```typescript
import { Injectable } from '@angular/core';
import { API, graphqlOperation } from 'aws-amplify';
import { GraphQLResult } from '@aws-amplify/api-graphql';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { NoteI } from '../interfaces/notes';

const listNotes = /* GraphQL */ `
  query ListNotes {
    listNotes {
      items {
        id
        noteTitle
        noteBody
        pinned
        bgColor
        bgImage
        images
        checkBoxes
        isCbox
        archived
        trashed
        createdAt
        updatedAt
      }
    }
  }
`;

const createNote = /* GraphQL */ `
  mutation CreateNote($input: CreateNoteInput!) {
    createNote(input: $input) {
      id
      noteTitle
      noteBody
      pinned
      bgColor
      bgImage
      images
      checkBoxes
      isCbox
      archived
      trashed
    }
  }
`;

const updateNote = /* GraphQL */ `
  mutation UpdateNote($input: UpdateNoteInput!) {
    updateNote(input: $input) {
      id
      noteTitle
      noteBody
      pinned
      bgColor
      bgImage
      images
      checkBoxes
      isCbox
      archived
      trashed
    }
  }
`;

const deleteNote = /* GraphQL */ `
  mutation DeleteNote($input: DeleteNoteInput!) {
    deleteNote(input: $input) {
      id
    }
  }
`;

@Injectable({
  providedIn: 'root'
})
export class NotesService {
  
  async add(noteObj: NoteI) {
    try {
      const input = {
        ...noteObj,
        images: JSON.stringify(noteObj.images || []),
        checkBoxes: JSON.stringify(noteObj.checkBoxes || [])
      };
      const result: any = await API.graphql(graphqlOperation(createNote, { input }));
      return result.data.createNote.id;
    } catch (error) {
      console.error('Error creating note:', error);
      return -1;
    }
  }

  async update(object: NoteI, id: number) {
    try {
      const input = {
        id: id.toString(),
        ...object,
        images: JSON.stringify(object.images || []),
        checkBoxes: JSON.stringify(object.checkBoxes || [])
      };
      await API.graphql(graphqlOperation(updateNote, { input }));
    } catch (error) {
      console.error('Error updating note:', error);
    }
  }

  async delete(id: number) {
    try {
      await API.graphql(graphqlOperation(deleteNote, { input: { id: id.toString() } }));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  }

  async getAll(): Promise<NoteI[]> {
    try {
      const result: any = await API.graphql(graphqlOperation(listNotes));
      const notes = result.data.listNotes.items.map((note: any) => ({
        ...note,
        id: parseInt(note.id),
        images: JSON.parse(note.images || '[]'),
        checkBoxes: JSON.parse(note.checkBoxes || '[]')
      }));
      return notes;
    } catch (error) {
      console.error('Error fetching notes:', error);
      return [];
    }
  }
}
```

---

## Part 6: Deploy to AWS Amplify Hosting

### 1. Add Hosting

```bash
amplify add hosting
```

Choose:
```
? Select the plugin module to execute: Hosting with Amplify Console
? Choose a type: Manual deployment
```

### 2. Publish

```bash
amplify publish
```

This will:
1. Build your Angular app
2. Upload to AWS Amplify
3. Deploy to CloudFront CDN
4. Provide a URL like: `https://dev.xxxxx.amplifyapp.com`

---

## Part 7: Alternative - Deploy via GitHub

### 1. Push to GitHub

```bash
git add .
git commit -m "Added image paste and AWS Amplify integration"
git push origin main
```

### 2. Connect to Amplify Console

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click "New app" → "Host web app"
3. Choose GitHub and authorize
4. Select your repository
5. Choose the branch (main)
6. Amplify auto-detects Angular settings
7. Click "Save and deploy"

Amplify will:
- Build on every git push
- Auto-deploy to staging/production
- Provide preview URLs for PRs

---

## Troubleshooting

### Build Fails

Check `amplify.yml` build settings:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist/keep
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

### Authentication Errors

Verify Cognito User Pool is created:
```bash
amplify status
```

### API Errors

Check AppSync API endpoint:
```bash
amplify console api
```

### Images Not Storing

Images are stored as base64 in DynamoDB. For production, consider:
1. Limit image size (compress before saving)
2. Or migrate to S3 with signed URLs

---

## Cost Estimate

For personal use with AWS Free Tier:

- **Amplify Hosting**: $0.01/build minute, ~$0.15/GB served
- **DynamoDB**: Free for 25GB storage, 200M requests/month
- **AppSync**: Free for 250K queries/month
- **Cognito**: Free for 50,000 MAUs

**Estimated cost**: $0-5/month for personal use

---

## Next Steps

1. **Custom Domain**: Add your domain in Amplify Console
2. **S3 for Images**: Migrate to S3 for better performance
3. **Offline Support**: Add Amplify DataStore for offline-first
4. **CI/CD**: Set up automated tests in build pipeline

---

## Support

- [AWS Amplify Docs](https://docs.amplify.aws/)
- [AppSync GraphQL Guide](https://docs.aws.amazon.com/appsync/)
- [Angular Amplify Guide](https://docs.amplify.aws/start/q/integration/angular/)
