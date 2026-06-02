-- ============================================================
-- SwatCarbon — Seed: 4 Role Admins
-- Run AFTER carbon_footprint_schema.sql
-- Passwords are bcrypt (cost=12); change after first login!
-- ============================================================

INSERT INTO users (full_name, email, password_hash, role, is_active) VALUES

-- ── farming_admin ────────────────────────────────────────────
-- Temp password: Farming@2025
('Farming Admin',
 'farming@swatcarbon.pk',
 '$2b$12$bdc57j.1I/BN97h/q5heK.PQOD8BhEaxViYaLs1W3AmQ2.Vzs9V5C',
 'farming_admin',
 1),

-- ── transport_admin ──────────────────────────────────────────
-- Temp password: Transport@2025
('Transport Admin',
 'transport@swatcarbon.pk',
 '$2b$12$FhI/GOhogLy9pytl0PQOPO4TM0rDu6fgBT4pGMFOT5vMTX7yTAFJW',
 'transport_admin',
 1),

-- ── storage_admin ────────────────────────────────────────────
-- Temp password: Storage@2025
('Storage Admin',
 'storage@swatcarbon.pk',
 '$2b$12$g4R9Y1yx/7KmdGUeGDul5.mp.5umibwUpQ4ZJx27Pa344gnq/hN3K',
 'storage_admin',
 1),

-- ── packaging_admin ──────────────────────────────────────────
-- Temp password: Packaging@2025
('Packaging Admin',
 'packaging@swatcarbon.pk',
 '$2b$12$AthhBeZB43KlU8zR7StX/ewtpgCscxeNCDoAQhDgVlxW16Oy2cSsa',
 'packaging_admin',
 1);

-- ============================================================
-- Verify
-- ============================================================
SELECT user_id, full_name, email, role, is_active, created_at
FROM users
ORDER BY user_id;
