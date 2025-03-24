ALTER TABLE contracts ADD COLUMN responsible_email TEXT;

-- 更新现有合同的负责人邮箱
UPDATE contracts
SET responsible_email = (
  SELECT email
  FROM users
  WHERE users.id = contracts.responsible_id
);