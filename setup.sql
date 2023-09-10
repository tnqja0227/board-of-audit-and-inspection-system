CREATE TABLE organization (
	organization_id SERIAL PRIMARY KEY,
	organization_name varchar(20) NOT NULL
);

CREATE TYPE semester_type AS ENUM ('spring', 'fall')

CREATE TABLE budget (
	budget_id SERIAL PRIMARY KEY,
	organization_id INT NOT NULL,
	YEAR INT NOT NULL,
	semester semester_type NOT NULL,
	
	CONSTRAINT fk_organization
		FOREIGN KEY(organization_id)
			REFERENCES organization(organization_id)
			ON DELETE cascade
);

CREATE TYPE status_type AS ENUM ('in progress', 'approved', 'rejected');
CREATE TYPE source_type AS ENUM ('학생회비');

CREATE TABLE income (
	budget_id INT NOT NULL,
	code varchar(2) NOT NULL,
	amount INT NOT NULL,
	status public."status_type" DEFAULT 'in progress',
	opinion TEXT,
	remarks TEXT,
	
	PRIMARY KEY(budget_id, code),
	CONSTRAINT fk_budget
		FOREIGN KEY(budget_id)
			REFERENCES budget(budget_id)
			ON DELETE CASCADE
);

CREATE TABLE expense (
	budget_id INT NOT NULL,
	code varchar(2) NOT NULL,
	amount INT NOT NULL,
	SOURCE public."source_type" NOT NULL,
	project_name varchar(20) NOT NULL,
	department_name varchar(20) NOT NULL,
	manager_name varchar(20) NOT NULL,
	status public."status_type" DEFAULT 'in progress',
	opinion TEXT,
	remarks TEXT,
	
	PRIMARY KEY(budget_id, code),
	CONSTRAINT fk_budget
		FOREIGN KEY(budget_id)
			REFERENCES budget(budget_id)
			ON DELETE CASCADE
);

CREATE TYPE transaction_type AS ENUM ('공금카드', '개인카드', '계좌이체', '현금거래', '사비집행');
CREATE TYPE money_flow_type AS ENUM ('수입', '지출');

CREATE TABLE TRANSACTION (
	transaction_id SERIAL PRIMARY KEY,
	budget_id INT,
	project_date date,
	manager_name varchar(10) NOT NULL,
	description varchar(50) NOT NULL,
	transaction_type public."transaction_type" NOT NULL,
	TYPE public."money_flow_type" NOT NULL,
	amount int NOT NULL,
	transaction_date date NOT NULL,
	account_number varchar(20) NOT NULL,
	account_bank varchar(10) NOT NULL,
	account_owner varchar(10) NOT NULL,
	status public."status_type" DEFAULT 'in progress' NOT NULL,
	opinion TEXT,
	remarks TEXT,
	
	CONSTRAINT fk_budget
		FOREIGN KEY(budget_id)
			REFERENCES budget(budget_id)
			ON DELETE CASCADE
);
