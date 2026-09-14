import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'tests',testMatch:'**/*.spec.ts',use:{baseURL:process.env.TEST_URL || 'http://127.0.0.1:4173',headless:true},reporter:'list',webServer:process.env.TEST_URL ? undefined : {command:'npm run build && PORT=4173 npm start',url:'http://127.0.0.1:4173',reuseExistingServer:true},timeout:20000});
