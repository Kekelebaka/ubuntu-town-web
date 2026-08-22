# Resend DNS — HUMAN GATE (do not apply without owner review)

Prepared: 2026-08-22T11:57Z
Zone: ubuntutown.co.za
DNS:Read is DENIED on the current Cloudflare token, so existing MX/SPF
cannot be proven from here. Review before write.

## Step 1 — domain claim (expires 2026-08-29 10:41:19 UTC)

Type: TXT
Name: ubuntutown.co.za   (apex)
Value: resend-domain-verification=c7f450041609ec9f2d3a428fffcb1feb
TTL: Auto

Claim id: ba1b1fb3-3706-4fd1-bd8a-c2b4b16cc56c
Domain id: 07fdc210-fbf3-4e28-b505-6ac4e688a8a1

After the TXT is live, verify the claim via Resend. Do not add Step 2
until that succeeds.

## Step 2 — sending records (executed for DKIM only on 2026-08-22T15:51Z)

1. Type: TXT
   Name: resend._domainkey
   Status: UPDATED — existing Cloudflare TXT record `5026e4f08b2c71f307b07a21d0ebc174` was replaced with the current Resend-required DKIM public key.
   Verification: Cloudflare API readback, Cloudflare DoH, Google DoH, and authoritative Cloudflare nameservers all returned the intended value.
   Resend status after extended poll: DKIM pending; domain pending. Do not modify unrelated DNS while this is pending.

2. Type: MX
   Name: send
   Priority: 10
   Value: feedback-smtp.us-east-1.amazonses.com
   Purpose: Resend bounce/feedback (subdomain send.ubuntutown.co.za)
   Status: pre-existing, not mutated; Resend reported verified in most polls.

3. Type: TXT
   Name: send
   Value: v=spf1 include:amazonses.com ~all
   Purpose: SPF for the send subdomain only
   Status: pre-existing, not mutated; Resend reported verified in most polls.

The MX and SPF are on the `send` subdomain, not the apex. They were not changed during the controlled DKIM replacement.

## Not done

No MX, SPF, DMARC, ownership TXT, CNAME, A, AAAA, routing, Pages, Workers, Supabase, GitHub main, merge, or production deploy mutation was performed.
