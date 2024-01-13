# KAIST 감사원 시스템

KAIST board of audit and inspection system backend

## Usage

```
docker compose up
```

For development

```
docker compose -f compose-dev.yaml up
npm run dev
```

## API Document

[API document](https://dev-bai.gdsckaist.com/api-docs)

## Documentation

-   [Architecture](docs/architecture.md)

### ERD

```mermaid
%%{init: {'theme': 'default' } }%%
erDiagram
    organizations {
        int id PK
        string name UK
    }
    users ||--o| organizations : belongs
    users {
        int id PK
        int OrganizationId FK
        string email UK
        string password
        string initialPassword
        enum role
        boolean isDisabled
    }
    organizations ||--o{ budgets: has
    budgets {
        int id PK
        int OrganizationId FK
        string manager
        int year
        string half
        boolean isReadOnly
    }
    budgets ||--o{ incomes: has
    incomes {
        int id PK
        int BudgetId FK
        string code
        enum source
        string category
        string content
        int amount
        string note
    }
    budgets ||--o{ expenses: has
    budgets ||--o{ specifications: has
    specifications {
        int id PK
        int BudgetId FK
        string accountNumber
        string accountBank
        string accountOwner
        string URI
        string note
    }
    expenses {
        int id PK
        int BudgetId FK
        string code
        enum source
        string category
        string project
        string content
        int amount
        string note
    }
    incomes ||--o{ transactions: has
    expenses ||--o{ transactions: has
    transactions {
        int id PK
        int IncomeId FK
        int ExpenseId FK
        date projectAt
        string manager
        string content
        enum type
        int amount
        date transactionAt
        int balance
        string accountNumber
        string accountBank
        string accountOwner
        string receivingAccountNumber
        string receivingAccountBank
        string receivingAccountOwner
        boolean hasBill
    }
    transactions ||--o{ transactions_evidences: has
    transactions_evidences {
        int id PK
        int TransactionId FK
        string URI
        string note
    }
    audit_periods {
        int year PK
        string half PK
        date start
        date end
    }
    organizations ||--o{ card_evidences: has
    card_evidences {
        int id PK
        int OrganizationId FK
        int year
        string half
        string URI
    }
    organizations ||--o{ cards: has
    cards {
        int id PK
        int OrganizationId FK
        int year
        string half
        string name
        string cardNumber
    }
    organizations ||--o{ accounts : has
    accounts {
        int id PK
        int OrganizationId FK
        int year
        string half
        string name
        string accountNumber
        string accountBank
        string accountOwner
    }
```

### Deployment

```mermaid
%%{init: {'theme': 'default' } }%%
flowchart TB
    %%{ init: { 'flowchart': { 'curve': 'basis' } } }%%
    api_server
    nginx
    postgres[(postgres)]
    postgres_backup_manager
    redis[(redis)]
    volume

    request --> nginx
    subgraph EC2
        subgraph Docker Compose
            direction RL
            nginx <--> api_server
            api_server <--> postgres
            api_server <--> redis
            postgres_backup_manager --> |dump|postgres
        end
        volume -. mount .-> postgres_backup_manager
    end

    subgraph S3
    bucket
    end

    bucket -. mount .-> volume
    api_server <--> bucket
```

## Maintainer

| Name                                      | Email                   |
| ----------------------------------------- | ----------------------- |
| [Kyungho Byoun](https://github.com/byunk) | kyungho.byoun@gmail.com |
|                                           |                         |
