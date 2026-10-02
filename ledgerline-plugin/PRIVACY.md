# Ledgerline Privacy Policy

_Last updated: October 2, 2026_

Ledgerline is a read-only financial research plugin created by Emit Rice.

## Data processed

Ledgerline can receive the text and structured arguments that ChatGPT sends to its tools when a user invokes the plugin. For public-market research, Ledgerline retrieves public information from sources such as the U.S. Securities and Exchange Commission (SEC) and Federal Reserve Economic Data (FRED).

Ledgerline does not require a Ledgerline user account in version 0.1 and does not request banking credentials, brokerage credentials, payment-card information, Social Security numbers, passwords, or API keys from users.

## Data storage

The version 0.1 server is designed to operate without a persistent user database. It may temporarily cache public SEC and FRED responses in server memory to reduce repeated requests. Those in-memory caches expire and are not designed to identify users.

Hosting and infrastructure providers may retain standard service logs such as timestamps, IP addresses, request metadata, and error information according to their own policies.

## Financial data from a conversation

The `render_financial_view` and calculation tools can receive financial values already supplied in the ChatGPT conversation, including values returned by other services the user has chosen to connect. Ledgerline uses those values only to perform the requested calculation or rendering. Ledgerline does not independently access another ChatGPT plugin or account.

## Sharing

Ledgerline does not sell user data. Data may be processed by infrastructure providers as necessary to operate the service or when required by law.

## Security

Ledgerline uses HTTPS when deployed publicly and exposes read-only research and calculation tools. No trade execution or account-write capability is included.

## Contact

Questions about this policy can be filed at:
https://github.com/Epple3k/portfolio/issues
