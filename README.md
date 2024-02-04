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

## How to contribute?

1. **CAUTION**: new commits of `master` branch cause automatic the deployment to published API server. It might cause unexpected API errors or data losses.
2. Refer to [CONTRIBUTING.md](CONTRIBUTING.md)

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
    transactions ||--o{ transactions_records: has
    transactions_records {
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
    organizations ||--o{ card_records: has
    card_records {
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
    accounts ||--|| account_records: has
    account_records {
        int id PK
        int AccountId FK
        string URI
        string note
    }
```

### Deployment

![architecture](/assets/architecture.png)

## Maintainer

| Name                                        | Email                   |
| ------------------------------------------- | ----------------------- |
| [Kyungho Byoun](https://github.com/byunk)   | kyungho.byoun@gmail.com |
| [Youngmin Ryou](https://github.com/yym0329) | yym3055@gmail.com       |
