import * as vscode from 'vscode';

export interface LocalizedStrings {
    processingTooltip: string;
    tokensTooltip: (count: string) => string;
    totalTokensTooltip: (count: string) => string;
    errorTooltip: string;
    fileTooLargeTooltip: string;
    extensionActivating: string;
    registeringFileDecorationProvider: string;
    fileDecorationProviderRegistered: string;
    treeDataProviderRegistered: string;
    startingScan: string;
    scanComplete: string;
    updatingTokenCounter: string;
    tokenCountUpdated: string;
    openFileForTesting: string;
    decorationFound: (badge: string, tooltip: string) => string;
    decorationNotFound: string;
    noWorkspaceFolder: string;
    checkingDecorations: string;
    updatingDecorations: string;
    filesInMap: string;
    foldersInMap: string;
    invalidating: string;
    processing: string;
    tokensCounted: (count: number, status: string) => string;
    inMap: string;
    cacheHit: (path: string, tokens: number) => string;
    counted: (path: string, tokens: number, cacheSize: number) => string;
    fileTooLarge: (path: string, size: number) => string;
    fileProcessingError: (path: string, error: any) => string;
    cacheLoadError: (path: string, error: any) => string;
    cacheSaveError: (path: string, error: any) => string;
    cacheLoaded: (path: string, size: number) => string;
    cacheSaved: (path: string, size: number) => string;
    countingTokens: string;
}

const strings: { [locale: string]: LocalizedStrings } = {
    en: {
        processingTooltip: 'Counting tokens...',
        tokensTooltip: (count: string) => `${count} tokens`,
        totalTokensTooltip: (count: string) => `Total tokens: ${count}`,
        errorTooltip: 'Error counting tokens',
        fileTooLargeTooltip: 'File too large to process',
        extensionActivating: 'DevBoy.pro Token Counter is activating...',
        registeringFileDecorationProvider: 'Registering FileDecorationProvider...',
        fileDecorationProviderRegistered: 'FileDecorationProvider registered',
        treeDataProviderRegistered: 'TreeDataProvider registered',
        startingScan: 'Starting workspace scan...',
        scanComplete: 'Scan complete, updating view',
        updatingTokenCounter: 'Updating token counter...',
        tokenCountUpdated: 'Token count updated',
        openFileForTesting: 'Open a file for testing',
        decorationFound: (badge: string, tooltip: string) => `Decoration: badge=${badge}, tooltip=${tooltip}`,
        decorationNotFound: 'Decoration not found',
        noWorkspaceFolder: 'No workspace folder open',
        checkingDecorations: 'Checking decorations:',
        updatingDecorations: 'TokenDecorationProvider: updating all decorations',
        filesInMap: 'Files in map:',
        foldersInMap: 'Folders in map:',
        invalidating: 'TokenDecorationProvider: invalidating',
        processing: 'TokenStatsManager: processed',
        tokensCounted: (count: number, status: string) => `  Tokens: ${count}, status: ${status}`,
        inMap: '  In map:',
        cacheHit: (path: string, tokens: number) => `Cache hit for ${path}: ${tokens} tokens`,
        counted: (path: string, tokens: number, cacheSize: number) => `Counted for ${path}: ${tokens} tokens, cache size: ${cacheSize}`,
        fileTooLarge: (path: string, size: number) => `File ${path} is too large (${size} bytes), skipping.`,
        fileProcessingError: (path: string, error: any) => `Error processing file ${path}: ${error}`,
        cacheLoadError: (path: string, error: any) => `Error loading cache from file ${path}: ${error}`,
        cacheSaveError: (path: string, error: any) => `Error saving cache to file ${path}: ${error}`,
        cacheLoaded: (path: string, size: number) => `Cache loaded from ${path}: ${size} entries`,
        cacheSaved: (path: string, size: number) => `Cache saved to ${path}: ${size} entries`,
        countingTokens: 'counting...'
    },
    ru: {
        processingTooltip: 'Подсчет токенов...',
        tokensTooltip: (count: string) => `${count} токенов`,
        totalTokensTooltip: (count: string) => `Всего токенов: ${count}`,
        errorTooltip: 'Ошибка при подсчете токенов',
        fileTooLargeTooltip: 'Файл слишком большой для обработки',
        extensionActivating: 'DevBoy.pro Token Counter активируется...',
        registeringFileDecorationProvider: 'Регистрируем FileDecorationProvider...',
        fileDecorationProviderRegistered: 'FileDecorationProvider зарегистрирован',
        treeDataProviderRegistered: 'TreeDataProvider зарегистрирован',
        startingScan: 'Начинаем сканирование workspace...',
        scanComplete: 'Сканирование завершено, обновляем представление',
        updatingTokenCounter: 'Обновляем token counter...',
        tokenCountUpdated: 'Token count обновлен',
        openFileForTesting: 'Откройте файл для тестирования',
        decorationFound: (badge: string, tooltip: string) => `Декорация: badge=${badge}, tooltip=${tooltip}`,
        decorationNotFound: 'Декорация не найдена',
        noWorkspaceFolder: 'No workspace folder open',
        checkingDecorations: 'Проверяем декорации:',
        updatingDecorations: 'TokenDecorationProvider: обновляем все декорации',
        filesInMap: 'Файлов в карте:',
        foldersInMap: 'Папок в карте:',
        invalidating: 'TokenDecorationProvider: инвалидируем',
        processing: 'TokenStatsManager: обработан',
        tokensCounted: (count: number, status: string) => `  Токенов: ${count}, статус: ${status}`,
        inMap: '  В карте:',
        cacheHit: (path: string, tokens: number) => `Кеш попадание для ${path}: ${tokens} токенов`,
        counted: (path: string, tokens: number, cacheSize: number) => `Подсчитано для ${path}: ${tokens} токенов, кеш размер: ${cacheSize}`,
        fileTooLarge: (path: string, size: number) => `Файл ${path} слишком большой (${size} байт), пропускаем.`,
        fileProcessingError: (path: string, error: any) => `Ошибка обработки файла ${path}: ${error}`,
        cacheLoadError: (path: string, error: any) => `Ошибка при загрузке кэша из файла ${path}: ${error}`,
        cacheSaveError: (path: string, error: any) => `Ошибка при сохранении кэша в файл ${path}: ${error}`,
        cacheLoaded: (path: string, size: number) => `Кеш загружен из ${path}: ${size} записей`,
        cacheSaved: (path: string, size: number) => `Кеш сохранен в ${path}: ${size} записей`,
        countingTokens: 'подсчет...'
    }
};

export function getLocalizedStrings(): LocalizedStrings {
    const locale = vscode.env.language;
    const lang = locale.split('-')[0]; // Get language without region (e.g., 'ru' from 'ru-RU')
    return strings[lang] || strings.en;
}

export function formatNumber(num: number): string {
    const locale = vscode.env.language || 'en-US';
    return num.toLocaleString(locale);
}