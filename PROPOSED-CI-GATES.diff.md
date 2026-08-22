# Proposed CI Quality Gates — deploy-web.yml

## CURRENT STATE

The deploy-web.yml workflow runs:
  checkout → setup-node → cp .env.local.uto → npm ci → npm run build:edge → deploy

Missing gates: lint, typecheck, test

## PROPOSED DIFF

```diff
--- a/.github/workflows/deploy-web.yml
+++ b/.github/workflows/deploy-web.yml
@@ -36,6 +36,18 @@
       - name: Install
         run: npm ci

+      - name: Lint
+        run: npm run lint
+
+      - name: Typecheck
+        run: npm run typecheck
+
+      - name: Test
+        run: npm run test
+
       - name: Build (next + next-on-pages edge)
         run: npm run build:edge
```

## EFFECT

Adds three gates before the build step:
  INSTALL → LINT → TYPECHECK → TEST → BUILD → DEPLOY

A failed lint, typecheck, or test will block the build and deployment.

## RISK

- LOW: all three commands already pass locally (exit 0)
- Lint produces 35 warnings but exits 0 — will not block
- Typecheck exits 0 — will not block
- Tests: 49/49 pass — will not block
- If future changes introduce failures, CI will correctly block deployment

## ROLLBACK

Revert the workflow file to remove the three steps.
No infrastructure changes required.

## STATUS

PROPOSED — not applied. Awaiting human approval.
