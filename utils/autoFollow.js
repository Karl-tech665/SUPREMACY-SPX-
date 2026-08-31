async function autoFollowChannels(sock, channelJids = []) {
  const results = [];

  const channels = [
    ...new Set(
      channelJids.filter(
        jid => typeof jid === 'string' && jid.endsWith('@newsletter')
      )
    )
  ];

  async function isFollowing(channelJid) {
    try {
      const metadata = await sock.newsletterMetadata('jid', channelJid);
      const role = metadata?.viewer_metadata?.role || metadata?.viewerMeta?.role || metadata?.role || null;

      return {
        following: Boolean(role && role !== 'GUEST'),
        role: role || 'UNKNOWN'
      };
    } catch (error) {
      return { following: false, role: 'UNKNOWN', error: error.message };
    }
  }

  for (const channelJid of channels) {
    try {
      const before = await isFollowing(channelJid);

      if (before.following) {
        results.push({ channel: channelJid, status: 'already_following', role: before.role });
        continue;
      }

      try {
        await sock.newsletterFollow(channelJid);
      } catch {
        // Some WhatsApp versions throw even when follow succeeds.
      }

      const after = await isFollowing(channelJid);

      if (after.following) {
        results.push({ channel: channelJid, status: 'followed', role: after.role });
      } else {
        results.push({ channel: channelJid, status: 'not_followed', role: after.role });
      }
    } catch (error) {
      results.push({ channel: channelJid, status: 'failed', error: error.message });
    }
  }

  return results;
}

module.exports = { autoFollowChannels };
