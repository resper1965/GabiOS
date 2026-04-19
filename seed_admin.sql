INSERT INTO user (id, name, email, emailVerified, role, banned, createdAt, updatedAt) 
VALUES ('user_1', 'Ricardo Esper', 'resper@bekaa.eu', 1, 'admin', 0, datetime('now'), datetime('now'));

INSERT INTO account (id, userId, accountId, providerId, password, createdAt, updatedAt) 
VALUES ('acc_1', 'user_1', 'resper@bekaa.eu', 'credential', '7966f4942fce83c039a308270f02aa18:1ed66b871b39779e6a192635095281633a6bdf10e342214eabbc61f28489aebf8c55f626c07ed2545e2610a8de56d0c9a4435f42ffc971b86fb6ef45ed318e8c', datetime('now'), datetime('now'));

INSERT INTO organization (id, name, slug, createdAt, updatedAt) 
VALUES ('org_bekaa', 'bekaa', 'bekaa', datetime('now'), datetime('now'));

INSERT INTO member (id, userId, organizationId, role, createdAt, updatedAt) 
VALUES ('mem_1', 'user_1', 'org_bekaa', 'owner', datetime('now'), datetime('now'));
