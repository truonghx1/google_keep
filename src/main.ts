import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Amplify } from 'aws-amplify';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

// Load Amplify configuration
async function loadAmplifyConfig() {
  try {
    // @ts-ignore
    const outputs = await import('../amplify_outputs.json');
    
    // Check if config has valid values (not placeholders)
    const config = outputs.default || outputs;
    
    const isValidConfig = 
      config.auth?.user_pool_id && 
      !config.auth.user_pool_id.includes('dummy') &&
      !config.auth.user_pool_id.includes('PLACEHOLDER') &&
      config.data?.url &&
      !config.data.url.includes('dummy');
    
    if (isValidConfig) {
      Amplify.configure(config);
      console.log('AWS Amplify configured successfully');
    } else {
      console.log('Amplify config has placeholder values - running in local mode');
      // Configure with minimal settings to prevent errors
      Amplify.configure({} as any);
    }
  } catch (error) {
    console.log('Could not load Amplify config, running in local mode:', error);
    Amplify.configure({} as any);
  }
}

if (environment.production) {
  enableProdMode();
}

// Initialize Amplify then bootstrap Angular
loadAmplifyConfig().then(() => {
  platformBrowserDynamic().bootstrapModule(AppModule)
    .catch(err => console.error('Bootstrap error:', err));
});
