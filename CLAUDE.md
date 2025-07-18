# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**LLM Token Counter Summarizer DevBoy.pro** - это мощное расширение VS Code для подсчета и суммирования токенов LLM (Large Language Model) в файлах проекта. Расширение показывает количество токенов рядом с именами файлов в Explorer и поддерживает различные кодировки OpenAI. Использует js-tiktoken для быстрого и надежного подсчета. Разработано DevBoy.pro.

## Commands

### Development
- `pnpm run compile` - компиляция TypeScript с проверкой типов
- `pnpm run watch` - запуск в режиме разработки (watch mode)
- `pnpm run lint` - проверка кода через ESLint
- `pnpm run check-types` - проверка типов без компиляции

### Testing
- `pnpm run test` - запуск всех тестов через Mocha
- `pnpm run compile-tests` - компиляция тестов
- `pnpm run watch-tests` - компиляция тестов в watch режиме

### Build
- `pnpm run package` - создание production build (минификация, без source maps)
- `pnpm run vscode:prepublish` - автоматически вызывается перед публикацией

## Architecture

### Core Services

1. **TokenCountingService** (`src/services/tokenCountingService.ts`)
   - Сервис для подсчета токенов с использованием js-tiktoken
   - Поддержка различных кодировок: cl100k_base, o200k_base, p50k_base, r50k_base
   - Выбор кодировки через настройку `tokenCounter.encoding`

2. **CacheManager** (`src/services/cacheManager.ts`)
   - Кеширование результатов подсчета на основе SHA-256 хеша файла
   - Персистентность в `.vscode/token-cache.txt`
   - Автосохранение каждые 30 секунд

3. **TokenStatsManager** (`src/services/tokenStatsManager.ts`)
   - Координация сканирования workspace
   - Обработка изменений файлов (create/update/delete)
   - Подсчет суммарных токенов для папок
   - Обновление статуса в status bar

4. **TokenDecorationProvider** (`src/providers/tokenDecorationProvider.ts`)
   - Отображение badge'ей с количеством токенов в Explorer
   - Интеграция с VS Code TreeItem API

### Key Design Patterns

- **Асинхронная обработка**: Использование `AsyncQueue` для ограничения конкурентности
- **Кеширование**: Избежание повторных подсчетов через хеширование содержимого файлов
- **Event-driven**: Реагирование на изменения файлов через FileSystemWatcher
- **Lazy initialization**: Tokenizer'ы инициализируются только при первом использовании

## Configuration

Расширение поддерживает следующие настройки:
- `tokenCounter.encoding`: выбор кодировки для подсчета токенов:
  - `cl100k_base` (по умолчанию) - для GPT-4, GPT-3.5-turbo, text-embedding-ada-002
  - `o200k_base` - для GPT-4o моделей
  - `p50k_base` - для text-davinci-003, text-davinci-002, text-davinci-001
  - `r50k_base` - для GPT-3 davinci, curie, babbage, ada

## Badge Notation

Из-за ограничения VS Code в 2 символа для badge'ей, количество токенов отображается в компактной нотации:

| Диапазон токенов | Badge | Пример |
|------------------|-------|---------|
| 0 | `0` | 0 токенов |
| 1-999 | `.0` до `.9` | `.1` = ~100 токенов, `.5` = ~500 токенов |
| 1,000-99,999 | `1` до `99` | `2` = ~2,000 токенов, `15` = ~15,000 токенов |
| 100,000-999,999 | `^1` до `^9` | `^2` = ~200,000 токенов, `^5` = ~500,000 токенов |
| 1,000,000-9,999,999 | `*1` до `*9` | `*1` = ~1 млн токенов, `*3` = ~3 млн токенов |
| 10,000,000-99,999,999 | `1∞` до `9∞` | `1∞` = ~10 млн токенов, `5∞` = ~50 млн токенов |
| 100,000,000+ | `∞∞` | Более 100 млн токенов |

Специальные badge'и:

- `•` - Файл обрабатывается
- `⚠` - Ошибка при подсчете токенов
- `∞` - Файл слишком большой для обработки (>2MB)

## File Processing

Расширение обрабатывает все файлы в workspace со следующими ограничениями:
- Максимальный размер файла: 2MB
- Игнорируются файлы, указанные в `.gitignore`
- Обрабатываются файлы с любым расширением (включая бинарные файлы)

Примечание: хотя расширение обрабатывает все типы файлов, результаты подсчета токенов для бинарных файлов могут быть неточными, так как tokenizer'ы оптимизированы для текстового контента.

## Testing Strategy

При добавлении новой функциональности:
1. Создавайте unit тесты в `src/test/suite/`
2. Используйте структуру именования `*.test.ts`
3. Тесты запускаются в VS Code Extension Host environment

## Common Tasks

### Изменение логики кеширования
1. Основная логика в `src/services/cacheManager.ts`
2. При изменении формата кеша учитывайте обратную совместимость

### Отладка подсчета токенов
1. Проверьте выбранный tokenizer в настройках
2. Логи кеширования помогут понять, используется ли кеш
3. Status bar показывает прогресс обработки файлов