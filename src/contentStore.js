export const STORAGE_KEY = 'expo-admin-content-v1';

export const defaultContent = {
  photos: [
    {
      id: 'photo-hero',
      title: 'Homepage hero image',
      url: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1200&q=80',
      alt: 'Business consulting meeting',
      status: 'Published',
    },
  ],
  videos: [
    {
      id: 'video-intro',
      title: 'Company introduction',
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      status: 'Draft',
    },
  ],
  messages: [
    {
      id: 'msg-sample',
      name: 'Website visitor',
      email: 'visitor@example.com',
      subject: 'Consulting request',
      message: 'Sample contact form message. Future database integration can replace this local inbox.',
      receivedAt: '2026-07-16 09:00 UTC',
      read: false,
    },
  ],
  textBlocks: [
    {
      id: 'text-hero-title',
      label: 'Homepage hero title',
      value: 'Strategic Expo Consulting for Online Trading and Fintech',
      location: 'Homepage / Hero',
    },
    {
      id: 'text-cta',
      label: 'Primary call to action',
      value: 'Request a consultation',
      location: 'Homepage / CTA button',
    },
  ],
};

export function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function loadContent(storage = globalThis.localStorage) {
  if (!storage) return defaultContent;

  try {
    const stored = storage.getItem(STORAGE_KEY);
    if (!stored) return defaultContent;
    return { ...defaultContent, ...JSON.parse(stored) };
  } catch {
    return defaultContent;
  }
}

export function saveContent(content, storage = globalThis.localStorage) {
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(content));
}

export function upsertItem(content, section, item) {
  const existing = content[section] ?? [];
  const index = existing.findIndex((entry) => entry.id === item.id);
  const nextItems = index >= 0 ? existing.map((entry) => (entry.id === item.id ? item : entry)) : [item, ...existing];
  return { ...content, [section]: nextItems };
}

export function deleteItem(content, section, id) {
  return {
    ...content,
    [section]: (content[section] ?? []).filter((entry) => entry.id !== id),
  };
}
