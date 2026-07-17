# Utility Migration Evidence

This directory preserves validation logs produced by Templum's 2025
utility-consolidation workflow. Evidence previously spread across repository
and project `logs/`, `tmp/`, and `artifacts/` directories has been normalized
here because it is historical migration evidence rather than runtime data.

The canonical layout is:

`pattern-<id>/stage<id>/[lane<id>/]<name>.log`

`unclassified/` is reserved for legacy evidence whose owner cannot be proven
from its filename, registry entry, or activity-log reference. It is not an
accepted destination for new wrapper output.

Supporting Markdown records are kept outside the log corpus under
`../records/`, preserving their document format without weakening the log
path contract.

New consolidation runs must write directly to the canonical layout. The
general-purpose `run-with-timeout.mjs` wrapper requires an `archive/` directory
within the monorepo; the consolidation workflow and its CLI guidance own this
more specific evidence layout.
