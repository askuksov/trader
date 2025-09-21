# Техническое задание: Бот для спотовой торговли с Smart DCA стратегией (TDD)

> ⚠️ В этом документе описывается реализация Smart DCA стратегии: архитектура, схемы БД для позиций, алгоритмы DCA, механизмы восстановления состояния позиций, безопасности и мониторинга.

## 1. Обзор проекта
- Enterprise-grade бот для спотовой торговли с **Smart DCA стратегией**.  
- **Принцип "никогда не продавать в убыток"** - только LONG позиции.
- Многоключевое управление API с привязкой к DCA позициям.  
- Критические системы безопасности и восстановления состояния позиций.  
- Нулевая потеря данных о позициях (state recovery).  

## 2. Архитектура системы
- Backend: Go v1.25 (новые системы: **Position State Manager**, **DCA Engine**, Key Manager, Trading Engine).  
- DB: MySQL 8 (позиции, DCA уровни, история операций, WAL).  
- Redis: кэш (котировки, состояние позиций, статистика).  
- API: RESTful (React клиент + Position Management + Emergency Stop + Key Management).  
- Биржи: HitBTC (MVP), Binance (следующая версия).  
- Безопасность: AES-256-GCM для ключей, WAL encryption, distributed locks для позиций.  

## 3. Критически важные системы для DCA
- **Position State Recovery**: восстановление состояния всех активных DCA позиций после сбоя <30 сек.  
- **DCA Trigger Engine**: мониторинг цен и автоматическое срабатывание DCA уровней.
- **Take Profit Manager**: управление частичными продажами только в профите.
- **Emergency Position Management**: экстренная остановка всех позиций с сохранением состояния.  
- **Advanced Risk Management**: контроль экспозиции на ключ/пару, защита от переторговки.  
- **Enterprise Monitoring**: Prometheus, Grafana, мониторинг эффективности DCA стратегии.  

## 4. Функциональные требования для DCA
- Управление DCA позициями (создание, мониторинг, завершение).  
- Автоматическое срабатывание DCA уровней при падении цены.
- Частичные продажи только выше средней цены позиции.
- Привязка позиций к API ключам с балансировкой нагрузки.  
- Восстановление состояния позиций после перезапуска.
- Управление рисками: максимальная экспозиция на ключ, лимиты позиций.  

## 5. API спецификация для DCA (расширенная)

### 5.1 Управление позициями
```http
POST /api/v1/positions - создать новую DCA позицию
GET /api/v1/positions - список активных позиций  
GET /api/v1/positions/{id} - детали позиции
PUT /api/v1/positions/{id}/pause - приостановить позицию
PUT /api/v1/positions/{id}/resume - возобновить позицию  
DELETE /api/v1/positions/{id} - экстренно закрыть позицию
```

### 5.2 Мониторинг DCA
```http
GET /api/v1/positions/{id}/dca-levels - текущие DCA уровни
GET /api/v1/positions/{id}/take-profits - уровни take profit
GET /api/v1/positions/{id}/history - история операций по позиции
GET /api/v1/analytics/dca-performance - аналитика эффективности DCA
```

### 5.3 Настройки стратегии
```http
GET /api/v1/strategy/dca-settings - текущие настройки DCA
PUT /api/v1/strategy/dca-settings - обновить настройки DCA
GET /api/v1/strategy/supported-pairs - поддерживаемые торговые пары
```

[Content continues with all the database schemas, algorithms, architecture diagrams, and other technical specifications from the original document...]
