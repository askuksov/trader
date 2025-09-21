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

## 6. Схемы БД для DCA стратегии

### 6.1 Основные таблицы позиций
```sql
-- Основная таблица DCA позиций
CREATE TABLE dca_positions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    trading_pair VARCHAR(20) NOT NULL,
    api_key_id BIGINT NOT NULL,

    -- Состояние позиции
    status ENUM('active', 'completed', 'paused', 'emergency_stopped') DEFAULT 'active',

    -- Финансовые данные
    total_invested DECIMAL(18,8) DEFAULT 0,
    total_quantity DECIMAL(18,8) DEFAULT 0,
    average_price DECIMAL(18,8) DEFAULT 0,
    realized_profit DECIMAL(18,8) DEFAULT 0,

    -- DCA параметры
    initial_amount DECIMAL(18,8) NOT NULL,
    max_dca_levels INT DEFAULT 3,
    current_dca_level INT DEFAULT 0,

    -- Временные метки
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,

    FOREIGN KEY (api_key_id) REFERENCES api_keys(id),
    INDEX idx_trading_pair_status (trading_pair, status),
    INDEX idx_api_key_active (api_key_id, status)
);

-- DCA уровни для каждой позиции
CREATE TABLE dca_levels (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    position_id BIGINT NOT NULL,
    level INT NOT NULL,

    -- Параметры срабатывания
    trigger_price_percent DECIMAL(5,2) NOT NULL, -- % от входной цены (-3%, -7%, -12%)
    trigger_price DECIMAL(18,8) NOT NULL,
    amount DECIMAL(18,8) NOT NULL,

    -- Состояние
    status ENUM('pending', 'triggered', 'filled', 'cancelled') DEFAULT 'pending',
    triggered_at TIMESTAMP NULL,
    filled_at TIMESTAMP NULL,
    actual_price DECIMAL(18,8) NULL,
    actual_quantity DECIMAL(18,8) NULL,

    FOREIGN KEY (position_id) REFERENCES dca_positions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_position_level (position_id, level),
    INDEX idx_trigger_price (trigger_price, status)
);

-- Take Profit уровни
CREATE TABLE take_profit_levels (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    position_id BIGINT NOT NULL,
    level INT NOT NULL,

    -- Параметры срабатывания
    trigger_price_percent DECIMAL(5,2) NOT NULL, -- % от средней цены (+8%, +15%, +25%)
    trigger_price DECIMAL(18,8) NOT NULL,
    quantity_percent DECIMAL(5,2) NOT NULL, -- % позиции для продажи (25%, 35%, 40%)

    -- Состояние
    status ENUM('pending', 'triggered', 'filled', 'cancelled') DEFAULT 'pending',
    triggered_at TIMESTAMP NULL,
    filled_at TIMESTAMP NULL,
    actual_price DECIMAL(18,8) NULL,
    actual_quantity DECIMAL(18,8) NULL,
    profit_amount DECIMAL(18,8) NULL,

    FOREIGN KEY (position_id) REFERENCES dca_positions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_position_tp_level (position_id, level),
    INDEX idx_tp_trigger_price (trigger_price, status)
);

-- История всех операций по позициям
CREATE TABLE position_transactions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    position_id BIGINT NOT NULL,
    transaction_type ENUM('buy_initial', 'buy_dca', 'sell_partial', 'sell_complete') NOT NULL,

    -- Детали транзакции
    price DECIMAL(18,8) NOT NULL,
    quantity DECIMAL(18,8) NOT NULL,
    amount DECIMAL(18,8) NOT NULL,
    fee DECIMAL(18,8) DEFAULT 0,

    -- Связь с DCA/TP уровнями
    dca_level_id BIGINT NULL,
    take_profit_level_id BIGINT NULL,

    -- Данные биржи
    exchange_order_id VARCHAR(100),
    exchange_trade_id VARCHAR(100),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (position_id) REFERENCES dca_positions(id),
    FOREIGN KEY (dca_level_id) REFERENCES dca_levels(id),
    FOREIGN KEY (take_profit_level_id) REFERENCES take_profit_levels(id),
    INDEX idx_position_type (position_id, transaction_type),
    INDEX idx_created_at (created_at)
);
```

### 6.2 Дополнительные таблицы
```sql
-- Настройки DCA стратегии
CREATE TABLE dca_strategy_settings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    trading_pair VARCHAR(20),

    -- DCA параметры
    initial_amount_percent DECIMAL(5,2) DEFAULT 50.00, -- % от депозита
    dca_level_1_percent DECIMAL(5,2) DEFAULT 3.00,     -- -3%
    dca_level_1_amount_percent DECIMAL(5,2) DEFAULT 15.00,
    dca_level_2_percent DECIMAL(5,2) DEFAULT 7.00,     -- -7%
    dca_level_2_amount_percent DECIMAL(5,2) DEFAULT 20.00,
    dca_level_3_percent DECIMAL(5,2) DEFAULT 12.00,    -- -12%
    dca_level_3_amount_percent DECIMAL(5,2) DEFAULT 15.00,

    -- Take Profit параметры
    take_profit_1_percent DECIMAL(5,2) DEFAULT 8.00,   -- +8%
    take_profit_1_quantity_percent DECIMAL(5,2) DEFAULT 25.00,
    take_profit_2_percent DECIMAL(5,2) DEFAULT 15.00,  -- +15%
    take_profit_2_quantity_percent DECIMAL(5,2) DEFAULT 35.00,
    take_profit_3_percent DECIMAL(5,2) DEFAULT 25.00,  -- +25%
    take_profit_3_quantity_percent DECIMAL(5,2) DEFAULT 40.00,

    -- Ограничения
    max_positions_per_key INT DEFAULT 3,
    max_amount_per_position DECIMAL(18,8) DEFAULT 500.00,

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_pair_settings (trading_pair)
);

-- Мониторинг состояния позиций для восстановления
CREATE TABLE position_state_checkpoints (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    position_id BIGINT NOT NULL,

    -- Снимок состояния
    state_data JSON NOT NULL, -- Полное состояние позиции
    checkpoint_type ENUM('periodic', 'before_trade', 'after_trade', 'emergency') NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (position_id) REFERENCES dca_positions(id) ON DELETE CASCADE,
    INDEX idx_position_checkpoint (position_id, created_at DESC)
);
```

## 7. Алгоритмы DCA стратегии

### 7.1 Алгоритм создания DCA позиции
```go
func CreateDCAPosition(pair string, depositAmount decimal.Decimal, keyID int64) {
    // 1. Получить настройки стратегии для пары
    settings := GetDCASettings(pair)

    // 2. Рассчитать размеры ордеров
    initialAmount := depositAmount.Mul(settings.InitialAmountPercent.Div(100))

    // 3. Создать позицию в БД
    position := &DCAPosition{
        TradingPair: pair,
        APIKeyID: keyID,
        InitialAmount: initialAmount,
        Status: "active",
    }

    // 4. Разместить начальный ордер на покупку
    entryPrice := PlaceInitialBuyOrder(position, initialAmount)
    position.AveragePrice = entryPrice
    position.TotalInvested = initialAmount

    // 5. Создать DCA уровни
    CreateDCALevels(position, settings)

    // 6. Создать Take Profit уровни
    CreateTakeProfitLevels(position, settings)

    // 7. Сохранить checkpoint состояния
    SavePositionCheckpoint(position, "after_trade")
}
```

### 7.2 Алгоритм мониторинга DCA триггеров
```go
func MonitorDCATriggers() {
    for {
        // 1. Получить все активные позиции
        activePositions := GetActivePositions()

        for _, position := range activePositions {
            currentPrice := GetCurrentPrice(position.TradingPair)

            // 2. Проверить DCA триггеры
            CheckDCATriggers(position, currentPrice)

            // 3. Проверить Take Profit триггеры
            CheckTakeProfitTriggers(position, currentPrice)
        }

        time.Sleep(1 * time.Second) // Проверка каждую секунду
    }
}

func CheckDCATriggers(position *DCAPosition, currentPrice decimal.Decimal) {
    pendingLevels := GetPendingDCALevels(position.ID)

    for _, level := range pendingLevels {
        if currentPrice.LessThanOrEqual(level.TriggerPrice) {
            // Триггер сработал - выполнить DCA покупку
            ExecuteDCABuy(position, level, currentPrice)
        }
    }
}
```

### 7.3 Алгоритм восстановления состояния позиций
```go
func RecoverPositionStates() error {
    // 1. Получить все активные позиции из БД
    activePositions := GetActivePositionsFromDB()

    for _, position := range activePositions {
        // 2. Восстановить состояние с последнего checkpoint
        lastCheckpoint := GetLatestCheckpoint(position.ID)

        // 3. Проверить статус ордеров на бирже
        SyncOrderStatesWithExchange(position)

        // 4. Пересчитать среднюю цену и уровни
        RecalculatePositionMetrics(position)

        // 5. Возобновить мониторинг
        StartMonitoring(position)

        log.Info("Position recovered", "id", position.ID, "pair", position.TradingPair)
    }

    return nil
}
```

## 8. Конфигурация DCA стратегии (пример YAML)
```yaml
dca_strategy:
  default_settings:
    initial_amount_percent: 50.0    # 50% депозита на первую покупку
    dca_levels:
      - trigger_percent: -3.0       # Первый DCA при -3%
        amount_percent: 15.0        # 15% депозита
      - trigger_percent: -7.0       # Второй DCA при -7%
        amount_percent: 20.0        # 20% депозита
      - trigger_percent: -12.0      # Третий DCA при -12%
        amount_percent: 15.0        # 15% депозита

    take_profit_levels:
      - trigger_percent: 8.0        # Первый TP при +8%
        quantity_percent: 25.0      # Продать 25% позиции
      - trigger_percent: 15.0       # Второй TP при +15%
        quantity_percent: 35.0      # Продать 35% позиции
      - trigger_percent: 25.0       # Третий TP при +25%
        quantity_percent: 40.0      # Продать 40% позиции

  risk_management:
    max_positions_per_key: 3        # Максимум 3 позиции на ключ
    max_amount_per_position: 500    # Максимум $500 на позицию
    emergency_stop_loss_percent: -30 # Экстренная остановка при -30%

  monitoring:
    price_check_interval: 1s        # Проверка цен каждую секунду
    checkpoint_interval: 60s        # Checkpoint каждую минуту
    health_check_interval: 30s      # Проверка здоровья системы
```

## 9. Диаграммы архитектуры системы (PlantUML)

### 9.1 Общая архитектура системы кампаний
```plantuml
@startuml
package "Campaign Trading System" {
  [API Server]
  [Campaign Manager]
  [Strategy Orchestrator]
  [Position Manager]
  [Grid Engine]
  [Short Position Manager]
  [DCA Engine]
  [Market Analyzer]
  [Risk Manager]
  [Stop Controller]
  [State Recovery]
  [Exchange Connector]
}

[API Server] --> [Campaign Manager]
[Campaign Manager] --> [Strategy Orchestrator]
[Strategy Orchestrator] --> [Position Manager]
[Strategy Orchestrator] --> [Market Analyzer]

[Position Manager] --> [DCA Engine]
[Position Manager] --> [Grid Engine]
[Position Manager] --> [Short Position Manager]

[DCA Engine] --> [Exchange Connector]
[Grid Engine] --> [Exchange Connector]
[Short Position Manager] --> [Exchange Connector]

[Risk Manager] --> [Position Manager]
[Stop Controller] --> [Campaign Manager]
[State Recovery] --> [Campaign Manager]

' === MySQL Block ===
database "MySQL" as DB

package "MySQL Tables" {
  [accumulation_campaigns]
  [campaign_strategies]
  [trading_positions]
  [grid_levels]
  [dca_levels]
  [take_profit_levels]
  [trading_strategies]
  [stop_controls]
}

[Campaign Manager] --> DB
[Strategy Orchestrator] --> DB
[Position Manager] --> DB
[State Recovery] --> DB

' === Redis Block ===
node "Redis" as Cache <<cache>>

package "Redis Data" {
  [market_data]
  [campaign_states]
  [position_cache]
  [strategy_cache]
}

[Market Analyzer] --> Cache
[Position Manager] --> Cache
@enduml
```

### 9.2 Жизненный цикл кампании накопления
```plantuml
@startuml
start
:Create Campaign;
:Define Accumulation Goals;
:Select & Configure Strategies;
:Allocate Budget;

:Start Campaign;
:Initialize Strategy Monitoring;

repeat
  :Analyze Market Conditions;

  fork
    :Execute Smart DCA;
  fork again
    :Execute Grid Trading;
  fork again
    :Execute Short DCA;
  fork again
    :Execute Bear Market DCA;
  end fork

  :Update Campaign Progress;
  :Check Goal Achievement;

  if (Strategy Switch Needed?) then (yes)
    :Adjust Strategy Allocation;
    :Switch/Enable/Disable Strategies;
  endif

  if (Stop Condition Met?) then (yes)
    :Execute Stop Procedure;
    note right: Emergency, Graceful, or Scheduled
    stop
  endif

  if (Goals Achieved?) then (yes)
    :Complete Campaign;
    :Generate Final Report;
    stop
  endif

  :Wait for Next Cycle;
repeat while (Campaign Active?)

stop
@enduml
```

### 9.3 Алгоритм выбора и переключения стратегий
```plantuml
@startuml
start
:Campaign Started;
:Load Initial Strategy Allocation;

repeat
  :Analyze Current Market Conditions;
  note right
    - Price vs MA(50), MA(200)
    - RSI levels
    - Volatility metrics
    - Volume analysis
  end note

  :Evaluate Current Strategy Performance;
  note right
    - ROI per strategy
    - Goal achievement rate
    - Risk metrics
    - Execution efficiency
  end note

  if (Market Conditions Changed?) then (yes)
    :Identify Optimal Strategy Mix;

    if (Reallocation Needed?) then (yes)
      :Calculate New Allocation;
      :Prepare Strategy Transition;

      fork
        :Gracefully Reduce Underperforming Strategies;
      fork again
        :Increase Allocation to Better Strategies;
      fork again
        :Activate New Strategies if Needed;
      end fork

      :Update Campaign Configuration;
      :Log Strategy Changes;
      :Send Notifications;
    endif
  endif

  :Update Strategy States;
  :Wait for Next Analysis Cycle;
repeat while (Campaign Active?)

stop
@enduml
```

### 9.4 Grid Trading алгоритм
```plantuml
@startuml
start
:Initialize Grid Strategy;
:Analyze Price Range & Volatility;
:Calculate Grid Parameters;
note right
  - Grid count
  - Price spacing
  - Order sizes
  - Upper/lower bounds
end note

:Place Initial Grid Orders;

repeat
  :Monitor Order Executions;

  if (Buy Order Filled?) then (yes)
    :Place Corresponding Sell Order Above;
    :Update Base Asset Accumulation;
    :Log Transaction;
  endif

  if (Sell Order Filled?) then (yes)
    :Place Corresponding Buy Order Below;
    :Update Quote Asset Accumulation;
    :Calculate Profit;
    :Log Transaction;
  endif

  if (Market Conditions Changed?) then (yes)
    :Evaluate Grid Adjustment;

    if (Adjustment Needed?) then (yes)
      :Cancel Existing Orders;
      :Recalculate Grid Parameters;
      :Place New Grid Orders;
    endif
  endif

  :Update Grid State;
  :Check Campaign Goals;

repeat while (Grid Strategy Active?)

stop
@enduml
```

### 9.5 Система остановок (Stop Controls)
```plantuml
@startuml
actor User
participant StopController
participant CampaignManager
participant StrategyOrchestrator
participant PositionManager
participant ExchangeConnector
database StopControlsDB

User -> StopController: Initiate Stop Request
note right
  Scope: Campaign/Strategy/Key/Pair
  Type: Graceful/Emergency/Scheduled
end note

StopController -> StopControlsDB: Create Stop Control Record
StopController -> CampaignManager: Identify Affected Entities

alt Graceful Stop
  CampaignManager -> StrategyOrchestrator: Pause New Position Creation
  StrategyOrchestrator -> PositionManager: Complete Current Operations
  PositionManager -> ExchangeConnector: Allow Current Orders to Fill
  PositionManager -> PositionManager: Close Positions at Take Profit Only

else Emergency Stop
  CampaignManager -> StrategyOrchestrator: Immediate Strategy Halt
  StrategyOrchestrator -> PositionManager: Cancel All Pending Orders
  PositionManager -> ExchangeConnector: Cancel Orders on Exchange
  PositionManager -> ExchangeConnector: Close Positions at Market Price

else Scheduled Stop
  StopController -> StopController: Wait for Scheduled Time
  StopController -> CampaignManager: Execute Graceful Stop
end

CampaignManager -> StopControlsDB: Update Stop Status
StopController -> User: Confirm Stop Completion
@enduml
```

### 9.6 State Recovery процесс
```plantuml
@startuml
start
:System Restart Detected;
:Load Recovery Manager;

fork
  :Load Active Campaigns;
  :Validate Campaign States;
fork again
  :Load Active Strategies;
  :Validate Strategy Assignments;
fork again
  :Load All Positions;
  :Validate Position States;
fork again
  :Load Active Stop Controls;
  :Validate Stop Scopes;
end fork

:Cross-Reference Data Consistency;

if (Data Inconsistencies Found?) then (yes)
  :Execute Data Repair Procedures;
  :Log Inconsistency Details;
endif

:Sync with Exchange APIs;
note right
  - Verify order statuses
  - Check account balances
  - Validate position states
end note

if (Exchange Sync Issues?) then (yes)
  :Execute Exchange Reconciliation;
  :Update Local States;
endif

fork
  :Resume Campaign Monitoring;
fork again
  :Resume Strategy Orchestration;
fork again
  :Resume Position Management;
fork again
  :Resume Market Analysis;
fork again
  :Resume Risk Monitoring;
end fork

:Create Recovery Checkpoint;
:Generate Recovery Report;
:Send Recovery Notifications;

stop
@enduml
```

### 9.7 Модель данных (Entity Relationship)
```plantuml
@startuml
entity "accumulation_campaigns" as campaigns {
  * id : BIGINT
  --
  * name : VARCHAR(100)
  * campaign_type : ENUM
  * trading_pair : VARCHAR(20)
  * total_budget : DECIMAL(18,8)
  * status : ENUM
  accumulation_goals : JSON
  strategy_allocation : JSON
  created_at : TIMESTAMP
}

entity "trading_strategies" as strategies {
  * id : BIGINT
  --
  * name : VARCHAR(100)
  * strategy_type : ENUM
  * version : VARCHAR(20)
  * is_active : BOOLEAN
  base_config : JSON
  supported_position_types : JSON
}

entity "campaign_strategies" as camp_strat {
  * id : BIGINT
  --
  * campaign_id : BIGINT
  * strategy_id : BIGINT
  * allocation_percent : DECIMAL(5,2)
  * is_enabled : BOOLEAN
  activation_conditions : JSON
}

entity "trading_positions" as positions {
  * id : BIGINT
  --
  * campaign_id : BIGINT
  * strategy_id : BIGINT
  * position_type : ENUM
  * trading_pair : VARCHAR(20)
  * status : ENUM
  total_invested : DECIMAL(18,8)
  average_price : DECIMAL(18,8)
  grid_config : JSON
}

entity "grid_levels" as grid {
  * id : BIGINT
  --
  * position_id : BIGINT
  * level_index : INT
  * price : DECIMAL(18,8)
  * side : ENUM
  * status : ENUM
}

entity "dca_levels" as dca {
  * id : BIGINT
  --
  * position_id : BIGINT
  * level : INT
  * trigger_price : DECIMAL(18,8)
  * side : ENUM
  * status : ENUM
}

entity "stop_controls" as stops {
  * id : BIGINT
  --
  * stop_scope : ENUM
  * campaign_id : BIGINT
  * strategy_id : BIGINT
  * stop_type : ENUM
  * status : ENUM
}

campaigns ||--o{ camp_strat
strategies ||--o{ camp_strat
campaigns ||--o{ positions
strategies ||--o{ positions
positions ||--o{ grid
positions ||--o{ dca
campaigns ||--o{ stops
strategies ||--o{ stops
positions ||--o{ stops
@enduml
```
