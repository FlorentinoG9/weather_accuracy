# Cloudflare Pages Deployment Guide

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **GitHub/GitLab Repository**: Your code should be in a Git repository
3. **Environment Variables**: Prepare your API keys and database credentials

## Deployment Steps

### 1. Build Configuration

The project is already configured for Cloudflare Pages:
- ✅ Using `@astrojs/cloudflare` adapter
- ✅ Server-side rendering enabled
- ✅ Build output configured

### 2. Create KV Namespace for Sessions

The Cloudflare adapter requires a SESSION KV namespace. Create it in the Cloudflare dashboard:

1. Go to **Workers & Pages** → **KV** in your Cloudflare dashboard
2. Click **Create a namespace**
3. Name it `SESSION` (or any name, but must match the binding)
4. Copy the **Namespace ID**

### 3. Deploy to Cloudflare Pages

#### Option A: Via Cloudflare Dashboard (Recommended)

1. Go to **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. Select your repository
3. Configure build settings:
   - **Framework preset**: Astro
   - **Build command**: `pnpm build` (or `npm run build`)
   - **Build output directory**: `dist`
   - **Root directory**: `/` (or leave empty)

4. **Add Environment Variables**:
   - Go to **Settings** → **Environment variables**
   - Add the following:
     ```
     TURSO_DATABASE_URL=libsql://your-database-url.turso.io
     TURSO_AUTH_TOKEN=your-auth-token
     OPENWEATHER_API_KEY=your-openweather-api-key
     WEATHERAPI_KEY=your-weatherapi-key
     NODE_VERSION=18
     ```

5. **Add KV Namespace Binding**:
   - Go to **Settings** → **Functions** → **KV Namespace Bindings**
   - Click **Add binding**
   - **Variable name**: `SESSION`
   - **KV namespace**: Select the `SESSION` namespace you created
   - **Save**

6. **Deploy**: Click **Save and Deploy**

#### Option B: Via Wrangler CLI

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create KV namespace
wrangler kv:namespace create "SESSION"
wrangler kv:namespace create "SESSION" --preview

# Update wrangler.jsonc with the namespace IDs from above

# Deploy
wrangler pages deploy dist
```

### 4. Verify Deployment

After deployment:
1. Your site will be available at `https://weather-accuracy.pages.dev`
2. Check the deployment logs for any errors
3. Test the API endpoints:
   - `POST /api/location`
   - `GET /api/weather/compare?lat={lat}&lon={lon}`
   - `GET /api/accuracy/:locationId`

## Troubleshooting

### Error: "Invalid binding `SESSION`"

**Solution**: Make sure you've:
1. Created the KV namespace in Cloudflare dashboard
2. Added the KV namespace binding in Pages settings
3. The binding name matches exactly: `SESSION`

### Error: Environment variables not found

**Solution**: 
1. Go to **Settings** → **Environment variables** in Cloudflare Pages
2. Add all required environment variables
3. Redeploy after adding variables

### Error: Database connection failed

**Solution**:
1. Verify `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are set correctly
2. Check that your Turso database allows connections from Cloudflare IPs
3. Ensure the database is accessible (not paused)

### Build fails with module errors

**Solution**:
1. Make sure `nodejs_compat` flag is enabled (already in wrangler.jsonc)
2. Check that all dependencies are compatible with Cloudflare Workers runtime
3. Some Node.js modules may not work - check Cloudflare Workers compatibility

## Local Development

For local development, use:
```bash
pnpm dev
```

**Note**: `pnpm preview` doesn't work with Cloudflare adapter. Use `pnpm dev` for local testing.

## Production Checklist

- [ ] KV namespace created and bound
- [ ] All environment variables set in Cloudflare Pages
- [ ] Build completes successfully
- [ ] Site is accessible at your Pages domain
- [ ] API endpoints are working
- [ ] Database connections are working
- [ ] CORS is configured correctly (if needed)

## Additional Resources

- [Astro Cloudflare Adapter Docs](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Cloudflare KV Docs](https://developers.cloudflare.com/kv/)

