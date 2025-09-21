# Product Requirements Document (PRD)

## 1. Goals and Scope (MVP)

**Must have (mandatory):**  
- Spot trading bot with **Smart DCA strategy** (entry → DCA averaging → partial sales → completion).  
- **"Never sell at a loss" principle** - only LONG positions with partial sales above average price.
- Support for **multiple API keys** for exchanges with binding to strategies and trading pairs.  
- REST API for bot management and integration with React client.  
- Priority on **reliability, risk management and crash recovery**.  
- **HitBTC** exchange support (MVP).  
- **$200-500 deposit per pair**, trading coins from top-100 by market cap.

**Should have (desirable):**  
- Real-time market condition detection for automatic strategy switching.
- Key status and load monitoring capabilities.  
- Telegram notifications for key events (position entry, DCA triggers, take profit, strategy changes).  
- Automatic coin selection from top-100 based on volatility and liquidity.
- **Stop management dashboard** with breakdown by keys and pairs.

**Could have (can be added later):**  
- Minimal ML service integration (price direction and volatility prediction via HTTP API).  
- Multi-exchange support (Binance as first after MVP).  
- Advanced analytical reports (P&L, key efficiency, portfolio metrics).  
- Dynamic DCA level adjustment based on market conditions.

**Won't have (not included in MVP):**  
- Complex machine learning pipelines and automated trading based on them.  
- Futures or margin trading.  
- SHORT positions and selling at a loss.
- Advanced visualization (except basic dashboard).  

---

## 2. Trading Strategy: Smart DCA

### 2.1 Core Principles
- **LONG positions only** - never sell at a loss
- **Adaptive averaging** - increase volumes during large drawdowns
- **Partial sales** - gradually lock in profits
- **Liquidity reserve** - always keep funds for extreme drops

### 2.2 Strategy Parameters (for $300 deposit)
```
Initial purchase: $150 (50% of deposit)

DCA levels from entry price:
├─ -3%: +$45 (15% of deposit) 
├─ -7%: +$60 (20% of deposit)
├─ -12%: +$45 (15% of deposit)
└─ Reserve: $30 (10% of deposit) - for extreme drops

Take Profit from position average price:
├─ +8%: sell 25% of position
├─ +15%: sell 35% of position  
└─ +25%: sell 40% of position
```

### 2.3 Trading Pair Selection Criteria
- **Market Cap**: top-100 coins by market capitalization
- **Liquidity**: minimum daily trading volume $10M
- **Volatility**: 3-15% daily volatility (optimal for DCA)
- **Exclusions**: stablecoins, collapsing projects

---

## 3. Reference Architecture (business level)

**Must have:**  
- Backend in Go with modular structure.  
- MySQL for data storage (positions, DCA levels, history) and Redis for cache.  
- REST API for client and key management.  
- WebSocket for streaming data (price monitoring for DCA triggers).  
- Basic emergency stop system and position state recovery.
- **Position State Manager** - module for tracking DCA position states.

**Should have:**  
- Docker for containerization.  
- Kubernetes readiness.  
- Service healthchecks.  
- Prometheus + Grafana for basic monitoring.  

**Could have:**  
- Advanced alerts (multi-channel notifications).  
- Extended metrics (DCA strategy efficiency, average position holding times).  

**Won't have:**  
- Full microservice decomposition for MVP.  
- Enterprise-grade observability in first phase.  

---

## 4. Core Domain Logic

**Must have:**  
- **Accumulation campaign cycle**: creation → strategy selection → launch → market monitoring → strategy switching → goal achievement → completion.
- **Strategy management**: create, edit, duplicate, activate/deactivate strategies through UI.
- **Dynamic strategy application**: parameter changes apply to new campaigns, current campaigns complete with old settings.
- **Strategy combination** within one campaign (e.g., Grid + DCA simultaneously).
- **LONG and SHORT position management** with corresponding risk management algorithms.
- Order size calculation considering current position average prices and accumulation goals.  
- Campaign and position state management during system restarts.
- Risk management: limits by keys, campaigns, strategies, timeouts, overtrading protection.  
- Key assignment for campaigns and strategies.  

**Should have:**  
- **Strategy versioning** with change history and rollback capability.
- **Campaign and strategy import/export** in JSON format for backup and migration.
- Analytics on campaign and strategy efficiency.  
- Reports on accumulation goal achievement and campaign ROI.  
- **Balance optimization** between strategies within campaigns.

**Could have:**  
- ML forecasting service for optimizing entry points and strategy switching.  
- Dynamic strategy parameter adjustment based on volatility and market conditions.  
- **Campaign optimization recommendations** based on historical data.
- **Social copying** of successful campaigns from other users.  

---

## 5. API (general description)

**Must have:**  
- API key management (CRUD).  
- Trading pair and DCA strategy settings management.  
- Position management (start/stop/pause).  
- Position and transaction history.  
- Real-time active position monitoring.

**Should have:**  
- Analytics by keys and pairs.  
- Notification settings for DCA events.
- Service endpoints (status, logs).  

**Could have:**  
- ML endpoints for strategy optimization.  
- Data export for analysis.

---

## 6. Acceptance Criteria (Definition of Done)

- Architectural RFC agreed upon considering DCA strategy.  
- Database deploys from scratch with tables for positions and DCA levels.  
- Docker-compose works.  
- Unit and integration tests for DCA scenarios.  
- E2E tests for full DCA position cycle with multi-key scenarios.  
- Testing position state recovery after restart.
- OpenAPI specification available.  
- Documentation for DCA parameter configuration.
