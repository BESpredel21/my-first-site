# Инструкции для разработки PointMaster 2.0

## Системные установки:
1. Принцип лаконичности: Сначала готовый код, затем краткий Change Log. Без лишней теории.
2. Модульность: Один файл = одна ответственность. Максимальный размер файла — 200 строк.
3. Стек: React/Next.js, Supabase (DB & Auth), Tailwind CSS.

## Правила именования:
- Компоненты: PascalCase (InventoryManager.jsx)
- Функции/Переменные: camelCase (getCurrentShift)
- Таблицы БД: snake_case (inventory_logs)