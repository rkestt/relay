-- 00015_add_denari_operator.sql — Add missing Denari defender (Operation High Stakes)

INSERT INTO operators (id, name, side, icon_url) VALUES
    ('c3838382-3838-3838-3838-383838383838', 'Denari', 'defender', NULL)
ON CONFLICT (id) DO NOTHING;
