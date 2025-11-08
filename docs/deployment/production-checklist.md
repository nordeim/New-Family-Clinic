# Production Deployment Checklist

This checklist must be completed for every production launch.

## 1. Pre-Deployment Phase

- [ ] All feature branches have been merged into `main`.
- [ ] All pull requests have been reviewed and approved.
- [ ] All automated tests (unit, integration, E2E) are passing on the `main` branch CI pipeline.
- [ ] A final security scan (`npx snyk test`) has been run with no new critical vulnerabilities.
- [ ] The `main` branch has been successfully deployed and verified on the **Staging** environment.
- [ ] All necessary environment variables have been added and verified in the Vercel Production environment settings.
- [ ] The on-call engineer has been notified of the pending deployment.

## 2. Deployment Phase

- [ ] A manual backup of the production database has been triggered via the Supabase dashboard.
- [ ] The `main` branch is pushed, triggering the production deployment workflow in GitHub Actions.
- [ ] Monitor the deployment workflow for successful completion of all steps (test, build, deploy).
- [ ] Verify that the Vercel deployment has completed successfully and is live.

## 3. Post-Deployment Phase

- [ ] Clear any relevant caches if necessary (e.g., CDN).
- [ ] Run the production smoke test script: `npm run test:smoke:prod`.
- [ ] **Manual Verification (5-10 minutes):**
    - [ ] Open the live URL and verify the homepage loads correctly.
    - [ ] Log in as a pre-configured test patient.
    - [ ] Log in as a pre-configured test doctor.
    - [ ] Check the `/api/health` endpoint to ensure all services are "healthy".
- [ ] **Monitoring:**
    - [ ] Check Sentry for any new, high-priority error spikes.
    - [ ] Check Vercel Analytics to ensure traffic is being served correctly.
    - [ ] Monitor the on-call channel for any automated alerts.
- [ ] If all checks pass, notify stakeholders that the deployment is complete and stable.

## Rollback Procedure

- In case of a critical failure during or after deployment, use the Vercel dashboard to instantly roll back to the previous production deployment.
- Post a message in the on-call channel detailing the issue and the rollback action.
- Create a post-mortem incident report.
