import { useMembership } from '@/shared/store/useMembership';
import { communityApi } from './communityApi';

/** Checks the invitation code with the backend and remembers it; returns the member's name. */
export async function joinCommunity(code: string): Promise<string> {
  const { name } = await communityApi.me(code.trim());
  useMembership.getState().join(code.trim(), name);
  return name;
}
