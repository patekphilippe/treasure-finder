import type { ViewBbox } from '@/shared/types/sources';
import type { BatchRequest } from './aiClient';
import type { PipelineModel } from './pricing';
import { MAP_SCHEMA, SYSTEM_PROMPT, TEXT_SCHEMA, mapInstruction, textInstruction } from './prompts';

/** Submission ids are 16 characters, file ids 12: custom_id = submission + 'f' + file, or + 't'. */
export const SUBMISSION_ID_LENGTH = 16;

export function parseCustomId(customId: string): { submissionId: string; fileId: string | null } {
  const submissionId = customId.slice(0, SUBMISSION_ID_LENGTH);
  const kind = customId[SUBMISSION_ID_LENGTH];
  return { submissionId, fileId: kind === 'f' ? customId.slice(SUBMISSION_ID_LENGTH + 1) : null };
}

// one cached prefix shared by every request: the system prompt never changes
const system = [
  { type: 'text' as const, text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' as const } },
];

export function mapRequest(
  submissionId: string,
  fileId: string,
  anthropicFileId: string,
  mime: string,
  view: ViewBbox | null,
  model: PipelineModel,
): BatchRequest {
  const source = { type: 'file' as const, file_id: anthropicFileId };
  return {
    custom_id: `${submissionId}f${fileId}`,
    params: {
      model,
      max_tokens: 16000,
      system,
      output_config: { format: { type: 'json_schema', schema: MAP_SCHEMA } },
      messages: [
        {
          role: 'user',
          content: [
            mime === 'application/pdf' ? { type: 'document', source } : { type: 'image', source },
            { type: 'text', text: mapInstruction(view) },
          ],
        },
      ],
    },
  };
}

export function textRequest(
  submissionId: string,
  text: string | null,
  link: string | null,
  model: PipelineModel,
): BatchRequest {
  return {
    custom_id: `${submissionId}t`,
    params: {
      model,
      max_tokens: 8000,
      system,
      output_config: { format: { type: 'json_schema', schema: TEXT_SCHEMA } },
      messages: [{ role: 'user', content: textInstruction(text, link) }],
    },
  };
}
