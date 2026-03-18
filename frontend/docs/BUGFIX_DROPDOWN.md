# Bug Fix: Profile Dropdown Menu

## 🐛 Проблема

Выпадающее меню профиля не закрывалось при:
- Клике вне области меню
- Нажатии клавиши Escape

Это создавало плохой UX, так как меню оставалось открытым и могло закрывать контент.

---

## ✅ Решение

Добавлены обработчики событий для автоматического закрытия меню.

### Изменения в `src/components/Header.tsx`:

#### 1. Добавлены импорты
```typescript
import { useState, useEffect, useRef } from 'react'
```
- `useEffect` - для добавления/удаления слушателей событий
- `useRef` - для отслеживания DOM-элемента меню

#### 2. Добавлен ref для меню
```typescript
const menuRef = useRef<HTMLDivElement>(null)
```

#### 3. Добавлен useEffect с обработчиками
```typescript
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setProfileMenuOpen(false)
    }
  }

  const handleEscapeKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setProfileMenuOpen(false)
    }
  }

  if (profileMenuOpen) {
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscapeKey)
  }

  return () => {
    document.removeEventListener('mousedown', handleClickOutside)
    document.removeEventListener('keydown', handleEscapeKey)
  }
}, [profileMenuOpen])
```

**Логика:**
- `handleClickOutside` - закрывает меню при клике вне его области
- `handleEscapeKey` - закрывает меню при нажатии Escape
- Слушатели добавляются только когда меню открыто
- Cleanup функция удаляет слушатели при размонтировании

#### 4. Добавлен ref к контейнеру меню
```typescript
<div className="relative" ref={menuRef}>
```

---

## 🎯 Результат

Теперь меню закрывается:
- ✅ При клике на кнопку профиля (toggle)
- ✅ При клике на "Настройки"
- ✅ При клике на "Выйти"
- ✅ При клике в любом месте вне меню
- ✅ При нажатии клавиши Escape

---

## 🧪 Как протестировать

1. Авторизуйтесь в приложении
2. Кликните на имя пользователя - меню откроется
3. Кликните в любом месте страницы вне меню - меню закроется
4. Откройте меню снова
5. Нажмите Escape - меню закроется

---

## 📝 Технические детали

- **Тип события для клика:** `mousedown` (срабатывает раньше `click`)
- **Проверка клика вне области:** `!menuRef.current.contains(event.target)`
- **Очистка слушателей:** через return в useEffect
- **Зависимости useEffect:** `[profileMenuOpen]` - пересоздает слушатели при изменении состояния

---

## ✨ Улучшения UX

- Интуитивное поведение меню (как в большинстве веб-приложений)
- Не нужно искать кнопку закрытия
- Быстрое закрытие через Escape
- Меню не мешает взаимодействию с остальной страницей
