export const ALLOWED_FILE_TYPES = {
    IMAGES: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'image/bmp',
        'image/tiff'
    ],
    DOCUMENTS: [
        'application/pdf',
        // Microsoft Word
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        // Microsoft PowerPoint
        'application/vnd.ms-powerpoint', // .ppt
        'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
        // Text files
        'text/plain',
        'text/markdown',
        'text/html'
    ],
    SPREADSHEETS: [
        'text/csv',
        'application/vnd.ms-excel', // .xls
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
    ],
    DATA: [
        'application/json',
        'application/xml',
        'text/csv'
    ],
    VIDEO: [
        'video/mp4',
        'video/webm',
        'video/ogg',
        'video/quicktime', // .mov
        'video/x-msvideo', // .avi
        'video/x-matroska', // .mkv
        'video/mpeg'
    ],
    AUDIO: [
        'audio/mpeg', // .mp3
        'audio/wav',
        'audio/ogg',
        'audio/webm',
        'audio/aac',
        'audio/x-m4a',
        'audio/flac'
    ],
    ARCHIVES: [
        'application/zip',
        'application/x-zip-compressed',
        'application/x-rar-compressed',
        'application/x-7z-compressed'
    ]
};

export const FILE_SIZE_LIMITS = {
    AVATAR: 10 * 1024 * 1024, // 10MB
    PROJECT_FILE: 25 * 1024 * 1024 // 25MB
};

/**
 * Get all allowed MIME types for project files
 */
export const getAllowedMimeTypes = (): string[] => {
    return [
        ...ALLOWED_FILE_TYPES.IMAGES,
        ...ALLOWED_FILE_TYPES.DOCUMENTS,
        ...ALLOWED_FILE_TYPES.SPREADSHEETS,
        ...ALLOWED_FILE_TYPES.DATA,
        ...ALLOWED_FILE_TYPES.VIDEO,
        ...ALLOWED_FILE_TYPES.AUDIO,
        ...ALLOWED_FILE_TYPES.ARCHIVES
    ];
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
};

/**
 * Check if file type is valid
 */
export const isValidFileType = (mimetype: string, allowedTypes: string[]): boolean => {
    return allowedTypes.includes(mimetype);
};

/**
 * Check if file is an image
 */
export const isImage = (mimetype: string): boolean => {
    return ALLOWED_FILE_TYPES.IMAGES.includes(mimetype);
};

/**
 * Check if file is a document that can be previewed
 */
export const isPreviewable = (mimetype: string): boolean => {
    const previewableTypes = [
        ...ALLOWED_FILE_TYPES.IMAGES,
        'application/pdf',
        'text/plain',
        'text/markdown',
        'text/html',
        'application/json',
        'text/csv'
    ];
    return previewableTypes.includes(mimetype);
};

/**
 * Get human-readable file type category
 */
export const getFileCategory = (mimetype: string): string => {
    if (ALLOWED_FILE_TYPES.IMAGES.includes(mimetype)) return 'Image';
    if (ALLOWED_FILE_TYPES.DOCUMENTS.includes(mimetype)) return 'Document';
    if (ALLOWED_FILE_TYPES.SPREADSHEETS.includes(mimetype)) return 'Spreadsheet';
    if (ALLOWED_FILE_TYPES.DATA.includes(mimetype)) return 'Data';
    if (ALLOWED_FILE_TYPES.VIDEO.includes(mimetype)) return 'Video';
    if (ALLOWED_FILE_TYPES.AUDIO.includes(mimetype)) return 'Audio';
    if (ALLOWED_FILE_TYPES.ARCHIVES.includes(mimetype)) return 'Archive';
    return 'Unknown';
};

/**
 * Format file size to human-readable format
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
