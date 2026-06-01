# Change Log

## [2.0.9] - 2026-06-01
### Исправлено (Performance Hotfix)
- **Критическая проблема №1**: Устранён `createClient()` на каждый рендер в `EmployeeLoginPage.jsx` — клиент Supabase теперь импортируется из `services/supabaseClient`
- **Критическая проблема №2**: Убран Realtime-канал `warehouse_stock_changes` из `AdminDashboard.jsx`, который вызывал двойной запрос `loadWarehouseStock` при каждом клике на +/- склада МЦ
- **Критическая проблема №3**: Оптимизирована цепочка из 3-х `useEffect` в `StaffDashboard.jsx` — объединены в один эффект, убрана загрузка `loadAnnouncement` до установки `resolvedPointId`
- **Оптимизация**: Добавлен `useCallback` для `loadPoints`, `loadSentMessages`, `loadWarehouseStock`, `loadStaffList` в `AdminDashboard.jsx` — предотвращено пересоздание функций при каждом рендере
- **Декомпозиция**: `AdminDashboard.jsx` (было 903 строк) разбит на 6 компонентов в `src/components/admin/`:
  - `AdminHeader.jsx`
  - `PointSelector.jsx`
  - `AdminMyPoints.jsx`
  - `AdminStaffAttach.jsx`
  - `AdminAnnouncements.jsx`
  - `WarehouseStock.jsx`

## [2.0.8] - 2026-06-01
### Добавлено
- **Этап 6.1: Модуль «Контроль остатков на Складе МЦ»**
  - Создан SQL-скрипт `src/utils/setup_warehouse_stock.sql` для таблицы `warehouse_stock` (point_id, tape_count, paper_count, bag_count)
  - Карточка "Списание МЦ" на `StaffDashboard.jsx` стала кликабельной — открывает модальное окно
  - Модальное окно списания материалов с тремя полями: пакеты (шт), скотч (шт), бумага (рулоны)
  - Логика вычитания остатков: чтение текущих значений → вычисление новых (с защитой от ухода в минус) → UPDATE в Supabase
  - Автосоздание записи в `warehouse_stock` для ПВЗ при первом списании


## [2.0.7] - 2026-05-19
### Исправлено
- Кнопка "Назад" на первом экране входа руководителя (`ManagerLoginPage`): добавлен жёсткий редирект `navigate('/')` в функцию `goToRoleSelection` хука `useAdminAuth`.

## Шаг 4: Замена маски телефона на react-number-format (v2.0.6)

### Изменения

- Удален `src/utils/phoneMask.js`
- Установлен `react-number-format`
- Создан `src/utils/formatPhone.js` для форматирования телефонов при отображении
- Обновлен `src/components/employeeLogin/NewEmployeeStep.jsx` — заменен на `PatternFormat` с маской `+7 (###) ###-##-##`
- Обновлен `src/components/employeeLogin/CacheStep.jsx` — использует `formatPhone` вместо `formatFullPhone`
- Обновлен `src/components/employeeLogin/PinStep.jsx` — использует `formatPhone` вместо `formatFullPhone`
- Обновлен `src/components/employeeLogin/SetPinStep.jsx` — использует `formatPhone` вместо `formatFullPhone`
- Обновлен `src/pages/StaffDashboard.jsx` — использует `formatPhone` вместо `formatFullPhone`

### Проверка

- Сборка проходит успешно
- Маска `+7 (###) ###-##-##` работает корректно
- Лишние цифры не вводятся (ограничение 10 цифр после +7)

---

## Шаг 4: Маска телефона и рефакторинг (v2.0.4)

### Созданные файлы

#### 1. src/utils/phoneMask.js
Утилиты для работы с маской телефона `+7 (XXX) XXX-XX-XX`:
- `formatPhoneWithMask(digits)` — форматирует цифры в маску
- `formatFullPhone(fullPhone)` — форматирует полный номер для отображения
- `isPhoneComplete(digits)` — проверяет заполнение 10 цифр
- `getFullPhoneForDB(digits)` — возвращает номер для БД (79991234567)

#### 2. src/components/employeeLogin/CacheStep.jsx
Компонент выбора сотрудника из кеша. Использует `formatFullPhone` для отображения телефона.

#### 3. src/components/employeeLogin/PinStep.jsx
Компонент ввода ПИН-кода. Отображает телефон в формате `+7 (XXX) XXX-XX-XX`.

#### 4. src/components/employeeLogin/NewEmployeeStep.jsx
Компонент поиска нового сотрудника с маской телефона:
- Поле ввода с маской `+7 (___) ___-__-__`
- Ввод только цифр, префикс `+7` не удаляется
- Кнопка активна при вводе 10 цифр после `+7`

#### 5. src/components/employeeLogin/SetPinStep.jsx
Компонент установки нового ПИН-кода. Отображает телефон в формате с маской.

### Обновленные файлы

#### src/pages/EmployeeLoginPage.jsx
Рефакторинг (было 386 строк, стало ~100 строк):
- Вынос подкомпонентов в `src/components/employeeLogin/`
- Использование утилиты `phoneMask.js` для форматирования
- Соблюдение лимита 200 строк на файл

### Валидация
- Маска: `+7 (___) ___-__-__` — пользователь вводит только цифры
- Кнопка "Поиск сотрудника" активна при `phoneDigits.length === 10 && point_id.trim() !== ''`

---

## Шаг 4: Полное обновление визуального стиля (v2.0.5)

### Новая дизайн-система

#### 1. src/index.css
Полностью обновленные стили:
- Градиентный фон: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- Стеклянный эффект: `backdrop-filter: blur()`, `rgba(255, 255, 255, 0.95)`
- Новые классы: `.card-standard`, `.btn-primary`, `.input-standard`
- Адаптивность и современные тени

#### 2. src/pages/RoleSelectionPage.jsx
Новый дизайн с карточками:
- Градиентные иконки для каждой роли
- Эффект увеличения при наведении
- Улучшенная типографика

#### 3. src/pages/EmployeeLoginPage.jsx
Обновленный интерфейс входа:
- Стеклянные карточки
- Улучшенные формы ввода
- Анимированные кнопки

#### 4. src/pages/StaffDashboard.jsx
Панель сотрудника с новым дизайном:
- Приветственный баннер
- Сетка быстрых действий (4 карточки)
- Информационные блоки

#### 5. src/pages/AdminDashboard.jsx
Панель руководителя:
- Аналогичный дизайн
- Карточки управления
- Статистика и уведомления

### Компоненты входа (employeeLogin/)
Все компоненты обновлены под новую дизайн-систему:
- CacheStep, PinStep, NewEmployeeStep, SetPinStep
- Единые стили для полей ввода и кнопок
- Улучшенная типографика и отступы

---

## Шаг 3: Система аутентификации (v2.0.3)

### Созданные файлы

#### 1. src/services/supabaseClient.js
Клиент Supabase для работы с БД и Auth.

#### 2. src/services/employeeService.js
Сервисные функции для сотрудников:
- `findEmployeeByPhoneAndPoint(phone, pointId)`
- `verifyEmployeePin(employeeId, pin)`
- `updateEmployeePin(employeeId, pin)`

#### 3. src/hooks/useLocalStorage.js
Хук для работы с localStorage (кеш сотрудников).

#### 4. src/hooks/useEmployeeAuth.js
Централизованный хук аутентификации сотрудников.

#### 5. src/pages/EmployeeLoginPage.jsx
Страница входа сотрудника с пошаговым интерфейсом.

### Обновленные файлы

#### src/App.jsx
Добавлены маршруты для `/login/employee` и `/staff`.

---

## Шаг 2: Базовая структура (v2.0.2)

### Созданные файлы
- index.html
- package.json
- vite.config.js
- src/main.jsx
- src/App.jsx
- src/index.css

### Установленные зависимости
- react, react-dom
- react-router-dom
- supabase
- vite, @vitejs/plugin-react

---

## Привязка руководителя к ПВЗ (point_id) — 2026-05-19

### Изменения

- **Форма регистрации руководителя**: добавлено обязательное поле "ID пункта (ПВЗ)" с валидацией только цифр
- **Сохранение в БД**: `point_id` передаётся в колонку `point_id` таблицы `profiles` при регистрации
- **Интерфейс админки**: на `AdminDashboard` добавлена плашка "ПВЗ №{point_id}" рядом с именем руководителя
- **Кеш и сессия**: `point_id` сохраняется в `localStorage` (`addAdminToCache`) и `sessionStorage` при авторизации, подтягивается при быстром входе из кеша
- **CacheStep**: на карточке кешированного руководителя отображается номер ПВЗ
