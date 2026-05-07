INSERT INTO games (name, name_en, platform, cover_url, rom_url, emulator_core, category, tags, description, release_year, publisher) VALUES
('超级马里奥兄弟', 'Super Mario Bros.', 'nes', '/covers/nes/smb.png', '/roms/nes/smb.nes', 'fceumm', 'platform', ARRAY['经典','动作'], '任天堂经典平台跳跃游戏', 1985, 'Nintendo'),
('魂斗罗', 'Contra', 'nes', '/covers/nes/contra.png', '/roms/nes/contra.nes', 'fceumm', 'shooting', ARRAY['射击','双人'], '经典横版射击游戏', 1988, 'Konami'),
('双截龙', 'Double Dragon', 'nes', '/covers/nes/dd.png', '/roms/nes/dd.nes', 'fceumm', 'action', ARRAY['格斗','双人'], '经典格斗动作游戏', 1988, 'Technos'),
('怒之铁拳', 'Streets of Rage', 'md', '/covers/md/sor.png', '/roms/md/sor.md', 'genesis_plus_gx', 'action', ARRAY['格斗','双人'], '世嘉经典格斗游戏', 1991, 'Sega'),
('刺猬索尼克', 'Sonic the Hedgehog', 'md', '/covers/md/sonic.png', '/roms/md/sonic.md', 'genesis_plus_gx', 'platform', ARRAY['经典','动作'], '世嘉标志性平台游戏', 1991, 'Sega'),
('超级马里奥世界', 'Super Mario World', 'snes', '/covers/snes/smw.png', '/roms/snes/smw.sfc', 'snes9x', 'platform', ARRAY['经典','动作'], '超级任天堂经典平台游戏', 1990, 'Nintendo'),
('塞尔达传说：众神的三角力量', 'The Legend of Zelda: A Link to the Past', 'snes', '/covers/snes/zelda.png', '/roms/snes/zelda.sfc', 'snes9x', 'rpg', ARRAY['RPG','冒险'], '经典动作RPG游戏', 1991, 'Nintendo'),
('洛克人2', 'Mega Man 2', 'nes', '/covers/nes/mm2.png', '/roms/nes/mm2.nes', 'fceumm', 'platform', ARRAY['动作','经典'], '经典动作平台游戏', 1988, 'Capcom'),
('梦幻之星', 'Phantasy Star', 'md', '/covers/md/ps.png', '/roms/md/ps.md', 'genesis_plus_gx', 'rpg', ARRAY['RPG','科幻'], '世嘉经典RPG游戏', 1987, 'Sega'),
('超时空之轮', 'Chrono Trigger', 'snes', '/covers/snes/ct.png', '/roms/snes/ct.sfc', 'snes9x', 'rpg', ARRAY['RPG','时间旅行'], '经典RPG巨作', 1995, 'Square');
