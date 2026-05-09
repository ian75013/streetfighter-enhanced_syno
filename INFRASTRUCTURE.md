# INFRASTRUCTURE

## Purpose
streetfighter-enhanced_syno serves a browser-based game built on Cocos2d HTML5.

## Main Components
- Entry page: index.html
- Runtime script: main.js
- Game sources in src/ and resources in res/
- Optional container packaging via Dockerfile

## Local Run
1. Serve files with a local static server (or container).
2. Open index.html through the server endpoint.

## Deployment
- Build static/container artifact and deploy behind a web server.
- Ensure static asset caching rules are correct.

## Operations and Validation
- Check browser console for runtime errors.
- Validate key game flows after asset updates.

## Rollback
- Restore previous static build artifact and redeploy.
