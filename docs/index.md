# Project Documentation Index

## Overview

Этот документ содержит сводную информацию о всех документах проекта trader.

**Последнее обновление**: 2025-09-22

## Structure

```
docs/
├── index.md                     # Этот файл
├── templates/                   # Шаблоны для документации
│   ├── requirements.md          # Шаблон для requirements
│   └── milestones.md           # Шаблон для milestones
├── 01_product_requirements/     # Продуктовые требования
├── 02_technical_design/         # Техническое проектирование
├── 03_devops/                   # DevOps документация
└── 04_backend/                  # Backend документация
```

## Document Inventory

| Path                                    | Type         | Status      | Last updated |
|----------------------------------------|--------------|-------------|--------------|
| 01_product_requirements/readme.md     | requirements | done        | 2025-09-21   |
| 02_technical_design/readme.md          | design       | done        | 2025-09-21   |
| 03_devops/01_requirements.md           | requirements | done        | 2025-09-21   |
| 03_devops/02_milestones.md             | milestones   | done        | 2025-09-21   |
| 04_backend/01_requirements.md          | requirements | done        | 2025-09-21   |
| 04_backend/02_milestones.md            | milestones   | in-progress | 2025-09-21   |
| templates/requirements.md              | template     | done        | 2025-09-22   |
| templates/milestones.md                | template     | done        | 2025-09-22   |

## Section Status

### 01_product_requirements ✅
- **Status**: Complete
- **Documents**: 1/1
- **Description**: Базовые продуктовые требования к торговому боту

### 02_technical_design ✅
- **Status**: Complete  
- **Documents**: 1/1 + 7 диаграмм
- **Description**: Техническое проектирование архитектуры системы

### 03_devops ✅
- **Status**: Complete
- **Documents**: 2/2
- **Description**: DevOps требования и этапы реализации

### 04_backend 🟡
- **Status**: In Progress
- **Documents**: 2/2 (milestones в процессе)
- **Description**: Backend требования и планы разработки

## Missing Documentation

### High Priority
- [ ] 05_frontend/ — Frontend requirements and milestones
- [ ] 06_testing/ — Testing strategy and requirements
- [ ] 07_deployment/ — Deployment and production requirements

### Medium Priority
- [ ] 08_security/ — Security audit and compliance
- [ ] 09_monitoring/ — Monitoring and alerting setup
- [ ] 10_api_docs/ — API documentation and examples

### Low Priority
- [ ] 11_user_manual/ — End user documentation
- [ ] 12_admin_guide/ — System administration guide

## Document Templates

### For Requirements
Используйте шаблон `templates/requirements.md` для создания новых requirement документов.

**ID Format**: DOC-[SECTION]-[NNN]
- SECTION: DEVOPS, BACKEND, FRONTEND, TEST, DEPLOY, etc.
- NNN: трёхзначный номер (001, 002, ...)

### For Milestones  
Используйте шаблон `templates/milestones.md` для создания milestone документов.

**ID Format**: MILE-[NNN]
- NNN: трёхзначный номер (001, 002, ...)

### For Tasks
**ID Format**: TASK-[SECTION]-[NNN]
- Используется внутри requirements и milestones документов

## Maintenance

### Weekly Updates
- Обновлять статусы документов в этом индексе
- Проверять консистентность между requirements и milestones
- Добавлять новые документы по мере создания

### Monthly Reviews
- Архивировать устаревшие документы
- Обновлять структуру если необходимо
- Проверять соответствие реальному состоянию проекта

## Change Log

| Date       | Changes                                    |
|------------|-------------------------------------------|
| 2025-09-22 | Создан index.md и шаблоны документации    |
| 2025-09-21 | Завершены DevOps и Backend requirements  |
| 2025-09-21 | Завершено техническое проектирование     |

---

**Note**: Для обновления этого документа после создания новых файлов, запустите скрипт обновления индекса (планируется к созданию).