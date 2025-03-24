-- Up
CREATE TABLE payment_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_id INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  planned_date DATE NOT NULL,
  actual_payment_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(contract_id) REFERENCES contracts(id)
);

CREATE INDEX idx_contract_id ON payment_plans(contract_id);

-- Down
DROP TABLE payment_plans;
DROP INDEX idx_contract_id;