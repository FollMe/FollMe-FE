import { request } from './request';

const API = 'comment-svc/api/reactions';

// Reactions are stored per "post key" so blogs and stories never collide.
export const blogPostKey = (slug) => `blog:${slug}`;
export const storyPostKey = (slug) => `story:${slug}`;

export const reactionApi = {
  /** @returns {Promise<Record<string, number>>} */
  counts: async (postKeys) => {
    if (postKeys.length === 0) {
      return {};
    }
    const res = await request.post(`${API}/count`, { postSlugs: postKeys });
    return res?.counts ?? {};
  },
  status: (postKey) => request.get(`${API}/me/${encodeURIComponent(postKey)}`),
  react: (postKey) => request.put(`${API}/me/${encodeURIComponent(postKey)}`),
  unreact: (postKey) => request.del(`${API}/me/${encodeURIComponent(postKey)}`),
};
