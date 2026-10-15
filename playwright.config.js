import {defineConfig} from '@playwright/test';
import {readFileSync} from 'node:fs';
const app=JSON.parse(readFileSync('package.json','utf8'));
const path=app.name.includes('preview')?'/menu-clear-preview/':'/';
export default defineConfig({
  testDir:'./tests',
  timeout:30000,
  retries:process.env.CI?1:0,
  use:{baseURL:'http://127.0.0.1:4173'+path,headless:true,trace:'retain-on-failure',screenshot:'only-on-failure'},
  webServer:{command:'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',url:'http://127.0.0.1:4173'+path,reuseExistingServer:!process.env.CI,timeout:60000},
});
