const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
const accessToken = process.env.GOOGLE_DRIVE_ACCESS_TOKEN;
const driveId = process.env.GOOGLE_SHARED_DRIVE_ID;

if (!folderId) {
  throw new Error('GOOGLE_DRIVE_FOLDER_ID is required.');
}

if (!accessToken) {
  throw new Error('GOOGLE_DRIVE_ACCESS_TOKEN is required.');
}

const { googleDrive } = await import('../dist/index.js');

const source = googleDrive({
  rootFolderId: folderId,
  driveId: driveId || undefined,
  getAccessToken: () => accessToken,
  staleTime: 0,
});

const files = await source.files();
const pages = files.filter((file) => file.type === 'page');
const markdownPages = pages.filter(
  (file) => file.type === 'page' && file.data.contentKind === 'markdown',
);
const evidencePages = pages.filter(
  (file) => file.type === 'page' && file.data.contentKind === 'evidence',
);

if (markdownPages.length === 0) {
  throw new Error('Live smoke test found no Markdown-capable Drive page.');
}

if (evidencePages.length === 0) {
  throw new Error('Live smoke test found no Drive evidence page.');
}

const firstMarkdown = markdownPages[0];
if (firstMarkdown.type !== 'page') {
  throw new Error('Unexpected page type.');
}

const loaded = await firstMarkdown.data.load();

if (!loaded.content.trim()) {
  throw new Error('First Markdown-capable Drive page exported empty content.');
}

const summary = {
  pages: pages.length,
  markdownPages: markdownPages.length,
  evidencePages: evidencePages.length,
  firstMarkdown: {
    title: firstMarkdown.data.title,
    contentLength: loaded.content.length,
    mimeType: firstMarkdown.data.driveFile.mimeType,
    modifiedTime: firstMarkdown.data.driveFile.modifiedTime,
  },
  evidence: evidencePages.map((file) => ({
    title: file.type === 'page' ? file.data.title : undefined,
    mimeType: file.type === 'page' ? file.data.driveFile.mimeType : undefined,
  })),
};

console.log(JSON.stringify(summary, null, 2));
