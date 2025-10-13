import { parseCommandInvocation, resolveDescriptor } from '../../../dev/architecture/cli-shared-parser.mjs';
import { getCommandDescriptor } from '../../../dev/architecture/cli-command-registry.mjs';

const [, , mode, payload] = process.argv;

function emit(data) {
  process.stdout.write(`${JSON.stringify(data)}\n`);
}

try {
  switch (mode) {
    case 'plan-files': {
      const tokens = JSON.parse(payload);
      const descriptor = getCommandDescriptor('claim');
      const { options } = parseCommandInvocation(descriptor, tokens);
      emit({ planFiles: options.planFiles });
      break;
    }
    case 'ack-sequence': {
      const tokens = JSON.parse(payload);
      const descriptor = getCommandDescriptor('update-handoff');
      const { options } = parseCommandInvocation(descriptor, tokens);
      emit({ addAcks: options.addAcks });
      break;
    }
    case 'ack-sequence-error': {
      const tokens = JSON.parse(payload);
      const descriptor = getCommandDescriptor('update-handoff');
      try {
        parseCommandInvocation(descriptor, tokens);
        emit({ error: null });
      } catch (error) {
        emit({ error: error.message || String(error) });
      }
      break;
    }
    case 'help-alias': {
      const descriptor = resolveDescriptor('--help');
      const { positionals } = parseCommandInvocation(descriptor, JSON.parse(payload));
      emit({ name: descriptor?.name, command: positionals.command });
      break;
    }
    default:
      throw new Error(`Unknown probe mode: ${mode}`);
  }
} catch (error) {
  emit({ error: error.message || String(error) });
  process.exitCode = 1;
}
