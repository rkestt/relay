-- ============================================================
-- 00032_drop_strategy_hotspots.sql — LWTS-6
-- Rimuove il concetto di hotspot sulle strategie (elemento
-- futuro non implementato). Gli screenshot (strategy_images)
-- restano invariati: la FK image_id va da hotspots→images,
-- il drop CASCADE della tabella non tocca strategy_images.
-- Le policy RLS e l'index cadono con la tabella.
-- ============================================================
DROP TABLE IF EXISTS strategy_hotspots CASCADE;
