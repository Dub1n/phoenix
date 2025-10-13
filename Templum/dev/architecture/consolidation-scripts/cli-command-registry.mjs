/**
 * Command metadata registry for the consolidation CLI.
 * Each descriptor captures positional arguments, supported flags,
 * usage examples, and parsing hints that the shared parser will leverage.
 */

/**
 * @typedef {'string'|'number'|'boolean'} CommandValueType
 */

/**
 * @typedef {Object} CommandPositionalDefinition
 * @property {string} name
 * @property {CommandValueType} [type]
 * @property {boolean} [required]
 * @property {string} [description]
 */

/**
 * @typedef {Object} CommandFlagDefinition
 * @property {string} name
 * @property {string[]} [aliases]
 * @property {CommandValueType|'csv'} [type]
 * @property {boolean} [required]
 * @property {boolean} [multiple]
 * @property {boolean} [allowCommaSeparated]
 * @property {string} [description]
 * @property {string} [target]
 * @property {boolean} [negates]
 * @property {boolean} [appendNewline]
 * @property {(value: string) => any} [coerce]
 * @property {(value: any, state: import('./cli-shared-parser').ParserState) => void} [apply]
 * @property {(state: import('./cli-shared-parser').ParserState) => void} [onMissing]
 */

/**
 * @typedef {Object} CommandDescriptor
 * @property {string} name
 * @property {string} summary
 * @property {string} usage
 * @property {string} [description]
 * @property {string[]} [aliases]
 * @property {string[]} [examples]
 * @property {CommandPositionalDefinition[]} [positionals]
 * @property {CommandFlagDefinition[]} [flags]
 * @property {() => any} [createOptions]
 * @property {(state: import('./cli-shared-parser').ParserState) => void} [postParse]
 */

/**
 * @type {Map<string, CommandDescriptor>}
 */
export const commandDescriptorMap = new Map();

/**
 * @param {CommandDescriptor} descriptor
 */
function register(descriptor) {
  commandDescriptorMap.set(descriptor.name, descriptor);
  if (descriptor.aliases && descriptor.aliases.length) {
    descriptor.aliases.forEach((alias) => {
      commandDescriptorMap.set(alias, { ...descriptor, aliasOf: descriptor.name });
    });
  }
}

register({
  name: 'guide',
  summary: 'Show targeted guidance for a pattern including stage, lane, and note highlights.',
  usage: 'guide <patternId> [--stage <id>] [--lane <laneId>] [--lanes] [--recent] [--next|-n]',
  positionals: [
    { name: 'patternId', type: 'number', required: true, description: 'Registry pattern identifier.' }
  ],
  flags: [
    {
      name: 'stage',
      type: 'string',
      target: 'stage',
      description: 'Stage id (1-7, or 5a) to scope the guide.',
      coerce: (value) => value.toString().toLowerCase()
    },
    {
      name: 'lane',
      type: 'string',
      target: 'lane',
      description: 'Lane id (e.g., 4a, 6b) to scope the guide.',
      coerce: (value) => value.toLowerCase()
    },
    { name: 'lanes', type: 'boolean', target: 'showLanes', description: 'Display lane overview for the selected stage.' },
    { name: 'recent', type: 'boolean', target: 'showRecent', description: 'Include recent activity summary.' },
    { name: 'next', aliases: ['-n'], type: 'boolean', target: 'focusNext', description: 'Highlight the next actionable stage or lane.' }
  ],
  examples: [
    'guide 104 --stage 5',
    'guide 208 --lane 6b --recent',
    'guide 312 --next'
  ]
});

register({
  name: 'claim',
  summary: 'Claim a stage or lane for active work and optionally capture plan metadata.',
  usage: 'claim <patternId> --stage <id>|--lane <laneId> [--summary text] [--note text] [--plan-files paths]',
  positionals: [
    { name: 'patternId', type: 'number', required: true, description: 'Registry pattern identifier.' }
  ],
  createOptions: () => ({
    planFiles: []
  }),
  flags: [
    { name: 'stage', type: 'string', target: 'stage', description: 'Stage id to claim (1-7).' },
    {
      name: 'lane',
      type: 'string',
      target: 'lane',
      description: 'Lane id to claim (4a, 6b, etc.).',
      coerce: (value) => value.toLowerCase()
    },
    { name: 'summary', type: 'string', target: 'summary', description: 'Short activity summary recorded in history.' },
    { name: 'note', type: 'string', target: 'note', description: 'Optional note recorded on the stage or lane.' },
    {
      name: 'plan-files',
      type: 'csv',
      target: 'planFiles',
      multiple: true,
      description: 'Comma separated list of planned files; may repeat.'
    },
    { name: 'clear-plan-files', type: 'boolean', target: 'clearPlanFiles', description: 'Clear any recorded planned files.' }
  ],
  examples: [
    'claim 210 --stage 4 --summary "Pick up Stage 4 QA" --plan-files qa/checklist.md',
    'claim 312 --lane 6b --note "Coordinating with orchestration"',
    'claim 119 --stage 5 --plan-files web/app.ts,web/app.test.ts --plan-files docs/spec.md'
  ]
});

register({
  name: 'update-stage',
  summary: 'Update a stage gate status, planned files, dependencies, and related metadata.',
  usage:
    'update-stage <patternId> <stageId> [--status <value>] [--notes text|--clear-notes] [--plan-files paths] [--search-terms terms] [--clear-search-terms] [--files paths] [--add-dependency ref] [--remove-dependency ref] [--clear-dependencies] [--completed-at iso] [--force]',
  positionals: [
    { name: 'patternId', type: 'number', required: true, description: 'Registry pattern identifier.' },
    { name: 'stageId', type: 'string', required: true, description: 'Stage id (1-7).' }
  ],
  createOptions: () => ({
    files: [],
    planFiles: [],
    addDependencies: [],
    removeDependencies: [],
    clearPlanFiles: false,
    searchTerms: [],
    clearSearchTerms: false,
    clearDependencies: false,
    notesProvided: false,
    completedAtProvided: false,
    force: false,
    statusProvided: false
  }),
  flags: [
    {
      name: 'status',
      type: 'string',
      description: 'New stage status (pending|in_progress|blocked|complete).',
      apply: (value, ctx) => {
        ctx.options.status = value;
        ctx.options.statusProvided = true;
      }
    },
    {
      name: 'notes',
      type: 'string',
      target: 'notes',
      description: 'Stage notes to persist.',
      apply: (value, ctx) => {
        ctx.options.notes = value;
        ctx.options.notesProvided = true;
      }
    },
    {
      name: 'clear-notes',
      type: 'boolean',
      description: 'Remove any stage notes.',
      apply: (_, ctx) => {
        ctx.options.notes = '';
        ctx.options.notesProvided = true;
      }
    },
    { name: 'agent', type: 'string', target: 'agent', description: 'Agent or assignee for the update.' },
    { name: 'summary', type: 'string', target: 'summary', description: 'Activity log summary for the change.' },
    {
      name: 'completed-at',
      type: 'string',
      description: 'ISO timestamp marking completion.',
      apply: (value, ctx) => {
        ctx.options.completedAt = value;
        ctx.options.completedAtProvided = true;
      }
    },
    {
      name: 'files',
      type: 'csv',
      target: 'files',
      multiple: true,
      description: 'Comma separated list of files touched (may repeat).'
    },
    {
      name: 'plan-files',
      type: 'csv',
      target: 'planFiles',
      multiple: true,
      description: 'Comma separated list of planned files (may repeat).'
    },
    {
      name: 'search-terms',
      type: 'csv',
      target: 'searchTerms',
      multiple: true,
      description: 'Comma separated list of search terms to validate against planned files (may repeat).'
    },
    {
      name: 'clear-search-terms',
      type: 'boolean',
      target: 'clearSearchTerms',
      description: 'Remove recorded search terms for the stage.'
    },
    {
      name: 'add-dependency',
      type: 'csv',
      target: 'addDependencies',
      multiple: true,
      description: 'Dependencies to add (patternId:gate).'
    },
    {
      name: 'remove-dependency',
      type: 'csv',
      target: 'removeDependencies',
      multiple: true,
      description: 'Dependencies to remove (patternId:gate).'
    },
    { name: 'clear-dependencies', type: 'boolean', target: 'clearDependencies', description: 'Remove all dependencies for the stage.' },
    { name: 'clear-plan-files', type: 'boolean', target: 'clearPlanFiles', description: 'Remove tracked plan files for the stage.' },
    { name: 'force', type: 'boolean', target: 'force', description: 'Bypass the planned file search guard (prints any matches).' }
  ],
  examples: [
    'update-stage 210 4 --status complete --summary "Ready for handoff"',
    'update-stage 119 5 --status blocked --notes "Waiting on asset review" --plan-files assets/review.md',
    'update-stage 104 6 --status in_progress --files ui/panel.ts,ui/panel.css'
  ]
});

register({
  name: 'pattern-cohort',
  summary: 'Manage the cohorts associated with a pattern.',
  usage: 'pattern-cohort <patternId> [--add id] [--remove id] [--clear] [--list] [--name text] [--description text] [--note text]',
  positionals: [
    { name: 'patternId', type: 'number', required: true }
  ],
  createOptions: () => ({
    add: [],
    remove: []
  }),
  flags: [
    { name: 'add', type: 'string', multiple: true, description: 'Add cohort id to the pattern.' },
    { name: 'remove', type: 'string', multiple: true, description: 'Remove cohort id from the pattern.' },
    { name: 'clear', type: 'boolean', description: 'Clear all cohorts from the pattern.' },
    { name: 'list', type: 'boolean', description: 'List cohorts without mutating the registry.' },
    { name: 'name', type: 'string', description: 'Set or update the cohort display name.' },
    { name: 'description', type: 'string', description: 'Set the cohort description.' },
    { name: 'note', type: 'string', description: 'Add a note for cohort changes.' }
  ],
  examples: [
    'pattern-cohort 208 --add stage-6-alpha',
    'pattern-cohort 119 --remove stage-5-beta',
    'pattern-cohort 345 --list'
  ]
});

register({
  name: 'cohort-stage',
  summary: 'Update cohort stage readiness, notes, and plan files.',
  usage: 'cohort-stage <cohortId> --segment <segmentId> --status <value> [--notes text] [--plan-files paths] [--clear-plan-files] [--started-at iso] [--completed-at iso]',
  positionals: [
    { name: 'cohortId', type: 'string', required: true, description: 'Cohort identifier.' }
  ],
  createOptions: () => ({
    planFiles: []
  }),
  flags: [
    { name: 'segment', type: 'string', required: true, description: 'Segment/stage identifier (e.g., 5a).' },
    { name: 'status', type: 'string', required: true, description: 'New status for the cohort segment.' },
    { name: 'notes', type: 'string', description: 'Notes to attach to the segment.' },
    { name: 'plan-files', type: 'csv', description: 'Comma separated planned files (may repeat).' },
    { name: 'clear-plan-files', type: 'boolean', description: 'Remove recorded plan files.' },
    { name: 'started-at', type: 'string', description: 'ISO timestamp for work start.' },
    { name: 'completed-at', type: 'string', description: 'ISO timestamp for work completion.' }
  ],
  examples: [
    'cohort-stage stage-6-alpha --segment 6b --status in_progress --plan-files docs/alpha.md',
    'cohort-stage stage-5-beta --segment 5a --status blocked --notes "Awaiting dependency alignment"'
  ]
});

register({
  name: 'schedule',
  summary: 'Generate or inspect conflict-aware schedules for patterns and cohorts.',
  usage: 'schedule [--patterns "[1,2]"] [--cohort id] [--format json|markdown] [--output path] [--no-save|--save]',
  createOptions: () => ({
    format: 'markdown',
    save: true,
    cohorts: []
  }),
  flags: [
    { name: 'patterns', type: 'string', target: 'patternsInput', description: 'JSON or comma separated list of pattern ids.' },
    { name: 'cohort', type: 'string', multiple: true, target: 'cohorts', description: 'Limit schedule generation to the specified cohort id.' },
    { name: 'format', type: 'string', target: 'format', description: 'Output format (markdown|json).' },
    { name: 'output', type: 'string', target: 'output', description: 'Override the output path.' },
    { name: 'no-save', type: 'boolean', target: 'save', negates: true, description: 'Skip writing output files and print only to stdout.' },
    { name: 'save', type: 'boolean', target: 'save', description: 'Force writing output artifacts.' }
  ],
  examples: [
    'schedule --patterns "[101,205]"',
    'schedule --cohort stage-6-alpha --format json --output ./tmp/schedule.json',
    'schedule --no-save'
  ]
});

register({
  name: 'stage-note',
  summary: 'Attach a note scoped to a specific stage.',
  usage: 'stage-note <patternId> <stageId> --body "text" [--agent name] [--id custom-id]',
  positionals: [
    { name: 'patternId', type: 'number', required: true },
    { name: 'stageId', type: 'string', required: true }
  ],
  flags: [
    { name: 'body', type: 'string', target: 'body', required: true, description: 'Note body text.' },
    { name: 'agent', aliases: ['author'], type: 'string', target: 'agent', description: 'Author to record for the note.' },
    { name: 'id', type: 'string', target: 'id', description: 'Optional stable id for the note.' }
  ],
  examples: [
    'stage-note 208 6 --body "Blocker cleared" --agent "Gabri"',
    'stage-note 104 4 --body "Waiting on QA"'
  ]
});

register({
  name: 'create-lane',
  summary: 'Define a new stage 4/6 lane with scope, commands, dependencies, and plan files.',
  usage:
    'create-lane <patternId> <laneId> --scope "description" --command "command" [--command "command"] [--status status] [--depends pattern:gate] [--note text] [--summary text] [--agent name] [--plan-files paths] [--search-terms terms]',
  positionals: [
    { name: 'patternId', type: 'number', required: true },
    { name: 'laneId', type: 'string', required: true }
  ],
  createOptions: () => ({
    commands: [],
    dependencyRefs: [],
    planFiles: [],
    searchTerms: []
  }),
  flags: [
    { name: 'scope', type: 'string', target: 'scope', required: true, description: 'Human readable scope for the lane.' },
    { name: 'command', type: 'string', target: 'commands', multiple: true, description: 'Command(s) to execute for the lane.' },
    { name: 'status', type: 'string', target: 'status', description: 'Initial lane status.' },
    { name: 'depends', type: 'csv', target: 'dependencyRefs', multiple: true, description: 'Dependencies in patternId:gate form.' },
    { name: 'note', type: 'string', target: 'note', description: 'Lane note to capture on creation.' },
    { name: 'agent', type: 'string', target: 'agent', description: 'Agent recorded for lane creation.' },
    { name: 'summary', type: 'string', target: 'summary', description: 'Activity summary entry.' },
    { name: 'plan-files', type: 'csv', target: 'planFiles', multiple: true, description: 'Comma separated planned files (may repeat).' },
    { name: 'search-terms', type: 'csv', target: 'searchTerms', multiple: true, description: 'Comma separated search terms used for cleanup checks (may repeat).' }
  ],
  examples: [
    'create-lane 210 6b --scope "Roll out UI polish" --command "npm run lint"',
    'create-lane 119 4a --scope "Docs alignment" --plan-files docs/* --depends 116:stage-4'
  ]
});

register({
  name: 'remove-lane',
  summary: 'Remove an existing stage 4/6 lane and clean up associated metadata.',
  usage: 'remove-lane <patternId> <laneId> [--summary text] [--agent name] [--drop-notes] [--force]',
  positionals: [
    { name: 'patternId', type: 'number', required: true },
    { name: 'laneId', type: 'string', required: true }
  ],
  flags: [
    { name: 'summary', type: 'string', target: 'summary', description: 'Activity log summary; defaults to "Removed lane <laneId>".' },
    { name: 'agent', type: 'string', target: 'agent', description: 'Agent recorded for the removal.' },
    { name: 'drop-notes', type: 'boolean', target: 'dropNotes', description: 'Remove lane-scoped notes while retiring the lane.' },
    { name: 'force', type: 'boolean', target: 'force', description: 'Bypass dependency/in-progress guardrails and auto-clear references.' }
  ],
  examples: [
    'remove-lane 210 6z --summary "Retire experimental sweep lane"',
    'remove-lane 119 4c --drop-notes --force'
  ]
});

register({
  name: 'update-handoff',
  summary: 'Maintain guardrails, shared files, and acknowledgements for the pattern handoff record.',
  usage:
    'update-handoff <patternId> [--add-guardrail text] [--remove-guardrail index] [--clear-guardrails] [--add-file path] [--remove-file index] [--clear-files] [--add-ack agent] [--ack-note text] [--ack-timestamp iso] [--remove-ack index] [--remove-ack-agent name] [--clear-acks] [--list]',
  positionals: [
    { name: 'patternId', type: 'number', required: true }
  ],
  createOptions: () => ({
    addGuardrails: [],
    removeGuardrails: [],
    addFiles: [],
    removeFiles: [],
    addAcks: [],
    removeAcks: [],
    removeAckAgents: []
  }),
  flags: [
    { name: 'add-guardrail', type: 'string', target: 'addGuardrails', multiple: true, description: 'Append a guardrail entry.' },
    { name: 'remove-guardrail', type: 'number', target: 'removeGuardrails', multiple: true, description: 'Remove guardrail by 1-based index.' },
    { name: 'clear-guardrails', type: 'boolean', target: 'clearGuardrails', description: 'Remove all guardrails.' },
    { name: 'add-file', type: 'string', target: 'addFiles', multiple: true, description: 'Record a shared file path.' },
    { name: 'remove-file', type: 'number', target: 'removeFiles', multiple: true, description: 'Remove shared file by 1-based index.' },
    { name: 'clear-files', type: 'boolean', target: 'clearFiles', description: 'Remove all shared files.' },
    {
      name: 'add-ack',
      type: 'string',
      description: 'Record acknowledgement agent (pair with note/timestamp).',
      apply: (value, ctx) => {
        if (!ctx.options.addAcks) {
          ctx.options.addAcks = [];
        }
        const ack = { agent: value };
        ctx.options.addAcks.push(ack);
        ctx.state.pendingAck = ack;
      }
    },
    {
      name: 'ack-note',
      type: 'string',
      description: 'Attach note to the most recent --add-ack.',
      apply: (value, ctx) => {
        const pending = ctx.state.pendingAck;
        if (!pending) {
          ctx.state.usageError = 'update-handoff: --ack-note must follow --add-ack';
          return;
        }
        pending.note = value;
      }
    },
    {
      name: 'ack-timestamp',
      type: 'string',
      description: 'Attach timestamp to the most recent --add-ack.',
      apply: (value, ctx) => {
        const pending = ctx.state.pendingAck;
        if (!pending) {
          ctx.state.usageError = 'update-handoff: --ack-timestamp must follow --add-ack';
          return;
        }
        pending.timestamp = value;
      }
    },
    {
      name: 'remove-ack',
      type: 'number',
      target: 'removeAcks',
      multiple: true,
      description: 'Remove acknowledgement by 1-based index.'
    },
    {
      name: 'remove-ack-agent',
      type: 'string',
      target: 'removeAckAgents',
      multiple: true,
      description: 'Remove acknowledgement by matching agent id.'
    },
    { name: 'clear-acks', type: 'boolean', target: 'clearAcks', description: 'Remove all acknowledgements.' },
    { name: 'list', type: 'boolean', target: 'listOnly', description: 'Show current handoff summary without mutating.' }
  ],
  examples: [
    'update-handoff 210 --add-guardrail "Coordinate with Docs"',
    'update-handoff 119 --add-file handoff/checklist.md --add-ack "QA" --ack-note "Confirmed"',
    'update-handoff 312 --remove-ack 2'
  ]
});

register({
  name: 'append-activity',
  summary: 'Attach an activity log entry without changing lane or stage status.',
  usage:
    'append-activity <patternId> --scope stage-6|lane-6b --summary "text" [--agent name] [--files paths] [--timestamp iso]',
  positionals: [
    { name: 'patternId', type: 'number', required: true }
  ],
  createOptions: () => ({
    files: []
  }),
  flags: [
    { name: 'scope', type: 'string', target: 'scope', description: 'Stage or lane scope (stage-6 or lane-6b).' },
    { name: 'stage', type: 'string', target: 'stage', description: 'Stage id (alias for --scope stage-<id>).' },
    { name: 'lane', type: 'string', target: 'lane', description: 'Lane id (alias for --scope lane-<id>).' },
    { name: 'summary', type: 'string', target: 'summary', required: true, description: 'Summary text for the entry.' },
    { name: 'agent', type: 'string', target: 'agent', description: 'Agent attribution.' },
    { name: 'files', type: 'csv', target: 'files', multiple: true, description: 'Comma separated list of related files.' },
    { name: 'timestamp', type: 'string', target: 'timestamp', description: 'ISO timestamp override.' }
  ],
  examples: [
    'append-activity 208 --scope stage-6 --summary "Synced with QA" --files docs/qc.md',
    'append-activity 119 --lane 6b --summary "Handed off to Release"',
    'append-activity 312 --stage 5 --summary "Validated upgrade" --timestamp 2025-10-10T12:00:00Z'
  ]
});

register({
  name: 'update-lane',
  summary: 'Update lane status, plan files, dependencies, and activity log entries.',
  usage:
    'update-lane <patternId> <laneId> [--status <value>] [--note text] [--summary text] [--agent name] [--plan-files paths] [--search-terms terms] [--clear-search-terms] [--files paths] [--block ids] [--queue ids] [--add-dependency ref] [--remove-dependency ref] [--clear-dependencies] [--clear-plan-files] [--no-prompt] [--force]',
  positionals: [
    { name: 'patternId', type: 'number', required: true },
    { name: 'laneId', type: 'string', required: true }
  ],
  createOptions: () => ({
    block: [],
    queue: [],
    files: [],
    planFiles: [],
    addDependencyRefs: [],
    removeDependencyRefs: [],
    searchTerms: [],
    clearSearchTerms: false,
    force: false,
    statusProvided: false
  }),
  flags: [
    {
      name: 'status',
      type: 'string',
      description: 'Lane status (pending|blocked|in_progress|complete).',
      apply: (value, ctx) => {
        ctx.options.status = value;
        ctx.options.statusProvided = true;
      }
    },
    { name: 'note', type: 'string', target: 'notes', multiple: true, description: 'Note content appended to the lane.' },
    { name: 'agent', type: 'string', target: 'agent', description: 'Agent attribution for the update.' },
    { name: 'summary', type: 'string', target: 'summary', description: 'Activity summary describing the change.' },
    { name: 'block', type: 'csv', target: 'block', multiple: true, description: 'Comma separated list of dependent lanes to block.' },
    { name: 'queue', type: 'csv', target: 'queue', multiple: true, description: 'Comma separated list of dependent lanes to queue.' },
    { name: 'files', type: 'csv', target: 'files', multiple: true, description: 'Comma separated list of files touched (may repeat).' },
    { name: 'plan-files', type: 'csv', target: 'planFiles', multiple: true, description: 'Comma separated list of planned files (may repeat).' },
    { name: 'search-terms', type: 'csv', target: 'searchTerms', multiple: true, description: 'Comma separated list of search terms to validate against planned files (may repeat).' },
    { name: 'clear-search-terms', type: 'boolean', target: 'clearSearchTerms', description: 'Remove recorded search terms for the lane.' },
    { name: 'add-dependency', type: 'csv', target: 'addDependencyRefs', multiple: true, description: 'Dependencies to add (patternId:gate).' },
    { name: 'remove-dependency', type: 'csv', target: 'removeDependencyRefs', multiple: true, description: 'Dependencies to remove (patternId:gate).' },
    { name: 'clear-dependencies', type: 'boolean', target: 'clearDependencies', description: 'Clear all lane dependencies.' },
    { name: 'clear-plan-files', type: 'boolean', target: 'clearPlanFiles', description: 'Clear tracked planned files.' },
    { name: 'no-prompt', type: 'boolean', target: 'skipPrompt', description: 'Skip interactive propagation prompts.' },
    { name: 'force', type: 'boolean', target: 'force', description: 'Bypass the planned file search guard (prints any matches).' }
  ],
  examples: [
    'update-lane 210 6b --status complete --summary "Validated release"',
    'update-lane 119 4a --status blocked --note "Waiting on assets" --block 4b,6a',
    'update-lane 312 6c --plan-files docs/plan.md --files src/index.ts'
  ]
});

register({
  name: 'sweep',
  summary: 'Run cleanup guard sweeps for a stage or lane.',
  usage: 'sweep <patternId> (--stage <id> | --lane <laneId>) [--list]',
  positionals: [
    { name: 'patternId', type: 'number', required: true, description: 'Registry pattern identifier.' }
  ],
  flags: [
    {
      name: 'stage',
      type: 'string',
      target: 'stage',
      description: 'Stage id (1-7) to evaluate.'
    },
    {
      name: 'lane',
      type: 'string',
      target: 'lane',
      description: 'Lane id (e.g., 4a, 6b) to evaluate.',
      coerce: (value) => value.toLowerCase()
    },
    { name: 'list', type: 'boolean', target: 'list', description: 'List available cleanup guard scopes for the pattern.' }
  ],
  examples: [
    'sweep 3 --stage 7',
    'sweep 3 --lane 6e',
    'sweep 3 --list'
  ]
});

register({
  name: 'status',
  summary: 'Print consolidated registry status for a pattern.',
  usage: 'status <patternId> [--notes]',
  positionals: [
    { name: 'patternId', type: 'number', required: true }
  ],
  flags: [
    { name: 'notes', type: 'boolean', description: 'Append note list to the summary.' }
  ],
  examples: ['status 210', 'status 119 --notes']
});

register({
  name: 'notes',
  summary: 'List notes recorded for a pattern.',
  usage: 'notes <patternId>',
  positionals: [
    { name: 'patternId', type: 'number', required: true }
  ],
  flags: [],
  examples: ['notes 210']
});

register({
  name: 'add-note',
  summary: 'Add a free-form note to a pattern with optional scope and author.',
  usage: 'add-note <patternId> --body "text" [--scope scope-id] [--author name] [--id custom-id]',
  positionals: [
    { name: 'patternId', type: 'number', required: true }
  ],
  createOptions: () => ({
    scope: []
  }),
  flags: [
    { name: 'body', type: 'string', target: 'body', required: true, description: 'Note body text.' },
    { name: 'scope', type: 'string', target: 'scope', multiple: true, description: 'Scope identifiers applied to the note.' },
    { name: 'author', type: 'string', target: 'author', description: 'Author attribution.' },
    { name: 'id', type: 'string', target: 'id', description: 'Optional stable id for the note.' }
  ],
  examples: [
    'add-note 210 --body "Kickoff complete"',
    'add-note 119 --body "Docs review scheduled" --scope stage-5 --author Gabri'
  ]
});

register({
  name: 'remove-note',
  summary: 'Remove a note from a pattern by id.',
  usage: 'remove-note <patternId> <noteId>',
  positionals: [
    { name: 'patternId', type: 'number', required: true },
    { name: 'noteId', type: 'string', required: true }
  ],
  flags: [],
  examples: ['remove-note 210 note-20250101T120000']
});

register({
  name: 'regen',
  summary: 'Regenerate derived markdown artifacts and schedules.',
  usage:
    'regen [--check] [--all|--force-all] [--pattern id|--patterns "[1,2]"] [--cohort id|--cohorts ids] [--no-global|--global] [--silent|--verbose]',
  flags: [
    { name: 'check', type: 'boolean', description: 'Only report if artifacts would change.' },
    { name: 'all', aliases: ['force-all'], type: 'boolean', description: 'Regenerate all patterns regardless of pending marks.' },
    { name: 'pattern', type: 'number', multiple: true, description: 'Regenerate for a specific pattern id.' },
    { name: 'patterns', type: 'string', description: 'JSON or comma separated list of pattern ids.' },
    { name: 'cohort', type: 'string', multiple: true, description: 'Regenerate for a specific cohort id.' },
    { name: 'cohorts', type: 'string', description: 'Comma separated list of cohort ids.' },
    { name: 'no-global', type: 'boolean', description: 'Skip generating the global schedule.' },
    { name: 'global', type: 'boolean', description: 'Force generation of the global schedule.' },
    { name: 'silent', type: 'boolean', description: 'Suppress regeneration summary output.' },
    { name: 'verbose', type: 'boolean', description: 'Force verbose output.' }
  ],
  examples: [
    'regen --check',
    'regen --pattern 104 --pattern 210',
    'regen --cohorts stage-6-alpha,stage-5-beta --no-global'
  ]
});

register({
  name: 'help',
  aliases: ['--help', '-h'],
  summary: 'Show global CLI usage and command summaries.',
  usage: 'help [command]',
  positionals: [
    { name: 'command', type: 'string', required: false, description: 'Optional command to describe.' }
  ],
  flags: [],
  examples: ['help', 'help claim']
});

/**
 * Resolve the canonical descriptor for a command name or alias.
 * @param {string} command
 * @returns {CommandDescriptor|null}
 */
export function getCommandDescriptor(command) {
  if (!command) {
    return null;
  }
  const descriptor = commandDescriptorMap.get(command);
  if (!descriptor) {
    return null;
  }
  if (descriptor.aliasOf) {
    return commandDescriptorMap.get(descriptor.aliasOf) || null;
  }
  return descriptor;
}

/**
 * @returns {CommandDescriptor[]}
 */
export function listCommandDescriptors() {
  const seen = new Set();
  const entries = [];
  for (const descriptor of commandDescriptorMap.values()) {
    if (descriptor.aliasOf) {
      continue;
    }
    if (seen.has(descriptor.name)) {
      continue;
    }
    seen.add(descriptor.name);
    entries.push(descriptor);
  }
  return entries.sort((a, b) => a.name.localeCompare(b.name));
}
