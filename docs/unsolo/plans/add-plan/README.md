# Add Plan frontend logic

These browser modules implement the verified `search-destinations`, `submit-plan`,
and `public-plans` contracts for the Plan Map Add Plan dialog. `add-plan-ui.mjs`
wires the isolated clients and state helpers into the reviewed page shell without
changing Google Maps consent or loading behavior.

`/taxonomy.json` at the published `docs/` root is the canonical 43-item activity
source.
The date module validates browser input but leaves lifecycle and expiry calculation
to the database. A submission intent owns one cryptographically random UUID and is
reused for retries of the same intended submission.

The optional email path uses immutable evidence identifiers
`plan-map-privacy-v1.1` and `launch-notification-consent-v1.0`. Its canonical
Privacy Notice must be published before this path is released to users.
