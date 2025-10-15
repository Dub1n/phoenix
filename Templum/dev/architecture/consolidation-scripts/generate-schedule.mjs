#!/usr/bin/env node
import process from 'process';
import {
  parseCliArgs,
  loadRegistry,
  generateScheduleArtifacts
} from './schedule-tools.mjs';
import { resolveRepoPath } from './modules/environment.mjs';

async function runCli() {
  const options = parseCliArgs(process.argv);
  if (options.help) {
    console.log('Usage:');
    console.log('  node generate-schedule.mjs [--patterns "[1,2]"] [--format json|markdown] [--output path] [--no-save]');
    console.log('Options:');
    console.log('  --patterns    Comma list or JSON array of pattern ids to include (default: all)');
    console.log('  --format      Output format (json or markdown, default markdown)');
    console.log('  --output      Optional file path to write the schedule output (default: schedules directory)');
    console.log('  --no-save     Skip writing an output file; always prints to stdout');
    console.log('  --registry    Optional override path for consolidation-state.json');
    return;
  }
  const registryOverride = resolveRepoPath(options.registry) || undefined;
  const registry = await loadRegistry(registryOverride);
  const artifactOptions = { ...options };
  delete artifactOptions.registry;
  if (artifactOptions.cohorts && artifactOptions.cohorts.length) {
    artifactOptions.cohorts = artifactOptions.cohorts.map((value) => value.trim()).filter(Boolean);
  }
  const artifacts = await generateScheduleArtifacts(registry, artifactOptions);
  if (artifacts.outputPath) {
    console.log(`Schedule written to ${artifacts.outputPath}`);
  }
  if (!artifacts.saved || !artifacts.outputPath || options.format === 'json' || options.save === false) {
    console.log(artifacts.rendered);
  }
}

runCli().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
