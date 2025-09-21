# Beauty Platform — Codex Guide

- Основная память: `/root/beauty-platform/Codex.md` (синхронизирована с CLAUDE.md и MCP).
- Для свежего контекста используй MCP ресурсы (`beauty://memory/codex`, `beauty://docs/smart-memory`, `beauty://ui/overview`).
- Проверить доступность ресурсов: `codex mcp list` → убедись, что `beauty-codex` активен. При необходимости `pnpm start` в `services/codex-mcp`.
- HTTP MCP (`services/mcp-server`, порт 6025) должен быть онлайн для данных секций и агентных контекстов.
- Любые новые правила / грабли фиксируй в `Codex.md`, мост заберёт обновления автоматически.
