import { supabase } from '../lib/supabaseClient';

export async function createReport({ contentType, contentId = null, reportedUserId, reason, details = null }) {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    reported_user_id: reportedUserId,
    content_type: contentType,
    content_id: contentId,
    reason,
    details,
  });

  if (error) throw error;
}
