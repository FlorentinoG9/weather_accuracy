# Troubleshooting 500 Errors on Cloudflare Pages

## Current Issue: 500 Internal Server Error on `/api/location`

### Steps to Debug

1. **Check Cloudflare Pages Logs**:
   - Go to your Cloudflare Pages project dashboard
   - Click on **Real-time Logs** or **Logs** tab
   - Look for error messages when you make a POST request to `/api/location`
   - The logs will show the actual error message

2. **Verify Environment Variables**:
   - Go to **Settings** → **Environment variables**
   - Ensure these are set (case-sensitive):
     - `TURSO_DATABASE_URL`
     - `TURSO_AUTH_TOKEN`
     - `OPENWEATHER_API_KEY`
     - `WEATHERAPI_KEY`
   - **Important**: After adding/changing environment variables, you must **redeploy** for changes to take effect

3. **Check Database Connectivity**:
   - Verify your Turso database is active and not paused
   - Check if Turso allows connections from Cloudflare IPs
   - Test the database connection with your credentials locally

4. **Common Issues**:

   **Issue**: `@libsql/client` compatibility with Cloudflare Workers
   - The `@libsql/client` package might not be fully compatible with Cloudflare Workers runtime
   - Check if there are any Node.js-specific dependencies that don't work in Workers

   **Issue**: Module initialization errors
   - If the database client fails to initialize at module load time, it will cause 500 errors
   - The current code uses lazy initialization to avoid this

   **Issue**: Environment variables not accessible
   - In Cloudflare Workers, `process.env` should work, but verify they're actually set
   - Check the Cloudflare dashboard to confirm variables are set for the correct environment (Production/Preview)

5. **Test Locally with Wrangler**:
   ```bash
   # Install Wrangler if not already installed
   npm install -g wrangler
   
   # Login to Cloudflare
   wrangler login
   
   # Test locally with Cloudflare environment
   wrangler pages dev dist
   ```

6. **Check for Node.js Compatibility Issues**:
   - Some packages might use Node.js APIs not available in Cloudflare Workers
   - Check build warnings about externalized modules
   - The `nodejs_compat` flag is enabled in `wrangler.jsonc`, but some modules still might not work

## Next Steps

1. **Check the actual error in Cloudflare logs** - this will tell us exactly what's failing
2. **Verify environment variables are set correctly**
3. **Test if the database connection works** - the error might be a database connectivity issue
4. **Consider using Cloudflare D1** instead of Turso if compatibility issues persist

## Alternative: Use Cloudflare D1

If `@libsql/client` doesn't work in Cloudflare Workers, consider migrating to Cloudflare D1 (SQLite database):
- Native Cloudflare integration
- No compatibility issues
- Similar API to Turso/libSQL

