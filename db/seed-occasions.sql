-- World festivals & special days: festival dates, wishes, day quotes and themed templates.
-- Idempotent: safe to re-run on a live database (unique slugs / unique text indexes + INSERT OR IGNORE).
--
-- DATES: fixed-date days are exact. Lunar/lunisolar festivals marked "VERIFY" are best estimates
-- for 2026-27 and must be checked against a local calendar before they go live
-- (edit them in /admin → Festivals). Each range starts a day early so people can send wishes the eve before.

-- ---------- topics for day quotes (topic slug = occasion key) ----------
INSERT OR IGNORE INTO topics (slug, name, emoji) VALUES
  ('christmas', 'Christmas', '🎄'),
  ('new-year', 'New Year', '🎆'),
  ('thanksgiving', 'Thanksgiving', '🦃'),
  ('mothers-day', 'Mother''s Day', '💐'),
  ('fathers-day', 'Father''s Day', '👔'),
  ('womens-day', 'Women''s Day', '💜'),
  ('teachers-day', 'Teachers'' Day', '📚'),
  ('childrens-day', 'Children''s Day', '🧸'),
  ('independence-day', 'Independence Day', '🇮🇳'),
  ('republic-day', 'Republic Day', '🇮🇳'),
  ('gandhi-jayanti', 'Gandhi Jayanti', '🕊️'),
  ('earth-day', 'Earth Day', '🌍'),
  ('environment-day', 'Environment Day', '🌳'),
  ('yoga-day', 'Yoga Day', '🧘'),
  ('labour-day', 'Labour Day', '🛠️'),
  ('diwali', 'Diwali', '🪔'),
  ('holi', 'Holi', '🎨'),
  ('eid', 'Eid', '🌙');

INSERT OR IGNORE INTO authors (slug, name, bio) VALUES
  ('charles-dickens', 'Charles Dickens', 'English novelist'),
  ('alfred-tennyson', 'Alfred Tennyson', 'English poet'),
  ('cicero', 'Cicero', 'Roman statesman and orator'),
  ('mary-wollstonecraft', 'Mary Wollstonecraft', 'English writer and early advocate of women''s rights'),
  ('john-muir', 'John Muir', 'Naturalist and conservationist'),
  ('mahatma-gandhi', 'Mahatma Gandhi', 'Leader of India''s independence movement'),
  ('oliver-wendell-holmes', 'Oliver Wendell Holmes Sr.', 'American physician and poet');

-- ---------- festival & day occurrences ----------
INSERT OR IGNORE INTO festivals (slug, name, occasion, starts_on, ends_on, headline, accent, priority) VALUES
  ('thanksgiving-2026', 'Thanksgiving', 'thanksgiving', '2026-11-25', '2026-11-26', 'Happy Thanksgiving! Say thank you with a card', '#b45309', 5),
  ('hanukkah-2026', 'Hanukkah', 'hanukkah', '2026-12-04', '2026-12-12', 'Happy Hanukkah! Share the light', '#1d4ed8', 4),            -- VERIFY
  ('sankranti-2027', 'Makar Sankranti & Pongal', 'sankranti', '2027-01-13', '2027-01-15', 'Happy Sankranti & Pongal!', '#f59e0b', 5), -- VERIFY
  ('lunar-new-year-2027', 'Lunar New Year', 'lunar-new-year', '2027-02-05', '2027-02-07', 'Happy Lunar New Year!', '#dc2626', 5),     -- VERIFY
  ('ramadan-2027', 'Ramadan', 'ramadan', '2027-02-07', '2027-02-09', 'Ramadan Mubarak', '#047857', 4),                                 -- VERIFY
  ('womens-day-2027', 'International Women''s Day', 'womens-day', '2027-03-08', '2027-03-08', 'Happy Women''s Day! Celebrate her', '#7c3aed', 5),
  ('eid-al-fitr-2027', 'Eid al-Fitr', 'eid', '2027-03-09', '2027-03-11', 'Eid Mubarak! Send your wishes', '#047857', 6),                 -- VERIFY
  ('holi-2027', 'Holi', 'holi', '2027-03-21', '2027-03-22', 'Happy Holi! Add some colour to their day', '#db2777', 6),                   -- VERIFY
  ('good-friday-2027', 'Good Friday', 'good-friday', '2027-03-26', '2027-03-26', 'A quiet thought for Good Friday', '#4b5563', 4),
  ('easter-2027', 'Easter', 'easter', '2027-03-27', '2027-03-28', 'Happy Easter!', '#65a30d', 5),
  ('baisakhi-2027', 'Baisakhi', 'baisakhi', '2027-04-13', '2027-04-14', 'Happy Baisakhi!', '#ca8a04', 5),                              -- VERIFY
  ('earth-day-2027', 'Earth Day', 'earth-day', '2027-04-22', '2027-04-22', 'Happy Earth Day 🌍', '#15803d', 3),
  ('labour-day-2027', 'Labour Day', 'labour-day', '2027-05-01', '2027-05-01', 'Happy Labour Day', '#b91c1c', 3),
  ('mothers-day-2027', 'Mother''s Day', 'mothers-day', '2027-05-08', '2027-05-09', 'Happy Mother''s Day! Make Mom a card', '#db2777', 6),
  ('eid-al-adha-2027', 'Eid al-Adha', 'eid', '2027-05-16', '2027-05-17', 'Eid al-Adha Mubarak!', '#047857', 6),                         -- VERIFY
  ('environment-day-2027', 'World Environment Day', 'environment-day', '2027-06-05', '2027-06-05', 'World Environment Day', '#15803d', 3),
  ('fathers-day-2027', 'Father''s Day', 'fathers-day', '2027-06-19', '2027-06-20', 'Happy Father''s Day! Make Dad a card', '#1d4ed8', 6),
  ('yoga-day-2027', 'International Yoga Day', 'yoga-day', '2027-06-21', '2027-06-21', 'Happy Yoga Day 🧘', '#ea580c', 3),
  ('fourth-of-july-2027', 'Fourth of July', 'fourth-of-july', '2027-07-04', '2027-07-04', 'Happy Fourth of July!', '#1e3a8a', 3),
  ('friendship-day-2027', 'Friendship Day', 'friendship-day', '2027-07-31', '2027-08-01', 'Happy Friendship Day! Tag your bestie', '#f59e0b', 5),
  ('independence-day-2027', 'Independence Day', 'independence-day', '2027-08-14', '2027-08-15', 'Happy Independence Day! Jai Hind', '#ff9933', 7),
  ('raksha-bandhan-2027', 'Raksha Bandhan', 'raksha-bandhan', '2027-08-16', '2027-08-17', 'Happy Raksha Bandhan!', '#e11d48', 6),        -- VERIFY
  ('janmashtami-2027', 'Janmashtami', 'janmashtami', '2027-08-24', '2027-08-25', 'Happy Janmashtami!', '#0e7490', 5),                  -- VERIFY
  ('ganesh-chaturthi-2027', 'Ganesh Chaturthi', 'ganesh-chaturthi', '2027-09-03', '2027-09-04', 'Ganpati Bappa Morya!', '#ea580c', 6),  -- VERIFY
  ('teachers-day-2027', 'Teachers'' Day', 'teachers-day', '2027-09-05', '2027-09-05', 'Happy Teachers'' Day! Thank a teacher', '#166534', 6),
  ('onam-2027', 'Onam', 'onam', '2027-09-11', '2027-09-12', 'Happy Onam!', '#ca8a04', 5),                                              -- VERIFY
  ('navratri-2027', 'Navratri', 'navratri', '2027-09-30', '2027-10-08', 'Happy Navratri!', '#c026d3', 2),                              -- VERIFY
  ('gandhi-jayanti-2027', 'Gandhi Jayanti', 'gandhi-jayanti', '2027-10-02', '2027-10-02', 'Remembering Bapu on Gandhi Jayanti', '#78716c', 6),
  ('dussehra-2027', 'Dussehra', 'dussehra', '2027-10-09', '2027-10-09', 'Happy Dussehra! Good wins', '#c2410c', 6),                     -- VERIFY
  ('diwali-2027', 'Diwali', 'diwali', '2027-10-27', '2027-10-30', 'Happy Diwali! Light up their status', '#a16207', 9),                 -- VERIFY
  ('halloween-2027', 'Halloween', 'halloween', '2027-10-31', '2027-10-31', 'Happy Halloween 🎃', '#ea580c', 4),
  ('childrens-day-2027', 'Children''s Day', 'childrens-day', '2027-11-14', '2027-11-14', 'Happy Children''s Day!', '#0284c7', 4),
  ('guru-nanak-jayanti-2027', 'Guru Nanak Jayanti', 'guru-nanak-jayanti', '2027-11-13', '2027-11-14', 'Happy Gurpurab!', '#d97706', 5), -- VERIFY
  ('thanksgiving-2027', 'Thanksgiving', 'thanksgiving', '2027-11-24', '2027-11-25', 'Happy Thanksgiving! Say thank you with a card', '#b45309', 5),
  ('christmas-2027', 'Christmas', 'christmas', '2027-12-20', '2027-12-26', 'Merry Christmas! Make a card for someone you love', '#b91c1c', 5),
  ('hanukkah-2027', 'Hanukkah', 'hanukkah', '2027-12-24', '2028-01-01', 'Happy Hanukkah! Share the light', '#1d4ed8', 4),            -- VERIFY
  ('new-year-2028', 'New Year', 'new-year', '2027-12-30', '2028-01-02', 'Happy New Year 2028! Send your wishes', '#d4a72c', 10);

-- ---------- wishes ({name} = the person's name) ----------
INSERT OR IGNORE INTO wishes (text, occasion) VALUES
  ('Happy Thanksgiving, {name}! I''m grateful for you today and every day.', 'thanksgiving'),
  ('Wishing you a table full of food and a heart full of thanks, {name}. Happy Thanksgiving!', 'thanksgiving'),
  ('Happy Hanukkah, {name}! May each candle bring you light, warmth and joy.', 'hanukkah'),
  ('Eight nights of light and love to you, {name}. Happy Hanukkah!', 'hanukkah'),
  ('Happy Makar Sankranti, {name}! May your kites fly high and your days be sweet as til-gud.', 'sankranti'),
  ('Happy Pongal, {name}! Wishing you a harvest of happiness and good health.', 'sankranti'),
  ('Happy Lunar New Year, {name}! Wishing you luck, health and prosperity in the year ahead.', 'lunar-new-year'),
  ('May the new lunar year bring you good fortune and great joy, {name}!', 'lunar-new-year'),
  ('Ramadan Mubarak, {name}! May this holy month bring you peace and blessings.', 'ramadan'),
  ('Wishing you a blessed and peaceful Ramadan, {name}.', 'ramadan'),
  ('Eid Mubarak, {name}! May your home be filled with joy, peace and sweet things.', 'eid'),
  ('Wishing you and your family a blessed Eid, {name}. Eid Mubarak!', 'eid'),
  ('On this Eid, may all your prayers be answered, {name}. Eid Mubarak!', 'eid'),
  ('Happy Women''s Day, {name}! The world is better and brighter because of you.', 'womens-day'),
  ('Here''s to you, {name}: strong, kind and unstoppable. Happy Women''s Day!', 'womens-day'),
  ('Wishing you a colourful and joyful Holi, {name}! Bura na mano, Holi hai!', 'holi'),
  ('Happy Good Friday, {name}. Wishing you peace, reflection and hope.', 'good-friday'),
  ('Happy Easter, {name}! May this season fill your heart with hope and new beginnings.', 'easter'),
  ('Wishing you a joyful Easter, {name}, full of sunshine and sweet surprises.', 'easter'),
  ('Happy Baisakhi, {name}! May the harvest season bring you joy and abundance.', 'baisakhi'),
  ('Happy Earth Day, {name}! Let''s take good care of the only home we have.', 'earth-day'),
  ('Happy Labour Day, {name}! Your hard work deserves to be celebrated.', 'labour-day'),
  ('Happy Mother''s Day, {name}! Thank you for your endless love and care.', 'mothers-day'),
  ('To the best mom in the world, {name}: you make everything better. Happy Mother''s Day!', 'mothers-day'),
  ('Happy Mother''s Day, {name}. Everything good in me started with you.', 'mothers-day'),
  ('Happy World Environment Day, {name}! Plant a tree, save a drop, make a difference.', 'environment-day'),
  ('Happy Father''s Day, {name}! Thank you for being my hero and my biggest supporter.', 'fathers-day'),
  ('To the world''s best dad, {name}: thanks for everything. Happy Father''s Day!', 'fathers-day'),
  ('Happy Yoga Day, {name}! Breathe in calm, breathe out stress.', 'yoga-day'),
  ('Happy Fourth of July, {name}! Wishing you fireworks, freedom and fun.', 'fourth-of-july'),
  ('Happy Friendship Day, {name}! Thanks for being the friend everyone wishes they had.', 'friendship-day'),
  ('Life is better with a friend like you, {name}. Happy Friendship Day!', 'friendship-day'),
  ('Happy Independence Day, {name}! Proud of our nation, its people and its spirit. Jai Hind!', 'independence-day'),
  ('Wishing you a proud and joyful Independence Day, {name}!', 'independence-day'),
  ('Happy Raksha Bandhan, {name}! Thank you for always having my back.', 'raksha-bandhan'),
  ('To my favourite sibling, {name}: happy Raksha Bandhan! Love you always.', 'raksha-bandhan'),
  ('Happy Janmashtami, {name}! May Lord Krishna fill your life with love and joy.', 'janmashtami'),
  ('Happy Ganesh Chaturthi, {name}! May Bappa remove every obstacle from your path.', 'ganesh-chaturthi'),
  ('Ganpati Bappa Morya! Wishing you wisdom and prosperity, {name}.', 'ganesh-chaturthi'),
  ('Happy Teachers'' Day, {name}! Thank you for teaching me so much more than lessons.', 'teachers-day'),
  ('To the teacher who made a difference, {name}: thank you. Happy Teachers'' Day!', 'teachers-day'),
  ('Happy Onam, {name}! Wishing you a feast of happiness and prosperity.', 'onam'),
  ('Happy Navratri, {name}! May the nine nights bring you strength and joy.', 'navratri'),
  ('Remembering Bapu''s message of truth and peace. Happy Gandhi Jayanti, {name}.', 'gandhi-jayanti'),
  ('Happy Dussehra, {name}! May good always win in your life.', 'dussehra'),
  ('May the lights of Diwali bring you happiness and success, {name}. Shubh Deepavali!', 'diwali'),
  ('Happy Halloween, {name}! Wishing you more treats than tricks.', 'halloween'),
  ('Happy Children''s Day, {name}! Never stop being curious and kind.', 'childrens-day'),
  ('Happy Gurpurab, {name}! May Guru Nanak Dev Ji''s teachings bring you peace.', 'guru-nanak-jayanti');

-- ---------- day quotes ----------
-- Attributed quotes are from public-domain authors. Unattributed lines are original to SupQuotes.
INSERT OR IGNORE INTO quotes (text, author_id, topic_id) VALUES
  ('I will honour Christmas in my heart, and try to keep it all the year.', (SELECT id FROM authors WHERE slug='charles-dickens'), (SELECT id FROM topics WHERE slug='christmas')),
  ('Christmas isn''t a season. It''s a feeling of warmth you carry with you.', NULL, (SELECT id FROM topics WHERE slug='christmas')),
  ('Ring out the old, ring in the new, ring, happy bells, across the snow.', (SELECT id FROM authors WHERE slug='alfred-tennyson'), (SELECT id FROM topics WHERE slug='new-year')),
  ('A new year is a blank page. Write something worth reading.', NULL, (SELECT id FROM topics WHERE slug='new-year')),
  ('Gratitude is not only the greatest of virtues, but the parent of all the others.', (SELECT id FROM authors WHERE slug='cicero'), (SELECT id FROM topics WHERE slug='thanksgiving')),
  ('Gratitude turns what we have into enough.', NULL, (SELECT id FROM topics WHERE slug='thanksgiving')),
  ('Youth fades; love droops; the leaves of friendship fall; a mother''s secret hope outlives them all.', (SELECT id FROM authors WHERE slug='oliver-wendell-holmes'), (SELECT id FROM topics WHERE slug='mothers-day')),
  ('A mother''s love is the first home we ever know.', NULL, (SELECT id FROM topics WHERE slug='mothers-day')),
  ('A father doesn''t tell you he loves you. He shows you.', NULL, (SELECT id FROM topics WHERE slug='fathers-day')),
  ('Dads are the quiet heroes behind every brave step we take.', NULL, (SELECT id FROM topics WHERE slug='fathers-day')),
  ('I do not wish them to have power over men; but over themselves.', (SELECT id FROM authors WHERE slug='mary-wollstonecraft'), (SELECT id FROM topics WHERE slug='womens-day')),
  ('Here''s to strong women: may we know them, may we be them, may we raise them.', NULL, (SELECT id FROM topics WHERE slug='womens-day')),
  ('A good teacher lights a lamp that keeps burning long after the lesson ends.', NULL, (SELECT id FROM topics WHERE slug='teachers-day')),
  ('Teachers plant seeds they may never see grow, and they plant them anyway.', NULL, (SELECT id FROM topics WHERE slug='teachers-day')),
  ('Every child comes with the message that God is not yet discouraged of man.', (SELECT id FROM authors WHERE slug='rabindranath-tagore'), (SELECT id FROM topics WHERE slug='childrens-day')),
  ('Where the mind is without fear and the head is held high, where knowledge is free.', (SELECT id FROM authors WHERE slug='rabindranath-tagore'), (SELECT id FROM topics WHERE slug='independence-day')),
  ('Freedom was earned by many. Keeping it is the work of all of us.', NULL, (SELECT id FROM topics WHERE slug='independence-day')),
  ('A constitution is a promise a nation makes to itself. Keep it.', NULL, (SELECT id FROM topics WHERE slug='republic-day')),
  ('The weak can never forgive. Forgiveness is the attribute of the strong.', (SELECT id FROM authors WHERE slug='mahatma-gandhi'), (SELECT id FROM topics WHERE slug='gandhi-jayanti')),
  ('An ounce of practice is worth more than tons of preaching.', (SELECT id FROM authors WHERE slug='mahatma-gandhi'), (SELECT id FROM topics WHERE slug='gandhi-jayanti')),
  ('In every walk with nature one receives far more than he seeks.', (SELECT id FROM authors WHERE slug='john-muir'), (SELECT id FROM topics WHERE slug='earth-day')),
  ('Heaven is under our feet as well as over our heads.', (SELECT id FROM authors WHERE slug='henry-david-thoreau'), (SELECT id FROM topics WHERE slug='earth-day')),
  ('The best time to plant a tree was years ago. The next best time is today.', NULL, (SELECT id FROM topics WHERE slug='environment-day')),
  ('Breathe in, breathe out. Calm is a superpower.', NULL, (SELECT id FROM topics WHERE slug='yoga-day')),
  ('Every honest day of work builds something bigger than ourselves.', NULL, (SELECT id FROM topics WHERE slug='labour-day')),
  ('One small lamp can push back a whole night of darkness.', NULL, (SELECT id FROM topics WHERE slug='diwali')),
  ('Life is too short for colourless days.', NULL, (SELECT id FROM topics WHERE slug='holi')),
  ('Eid is the reward of patience: a day to forgive, to share and to smile.', NULL, (SELECT id FROM topics WHERE slug='eid'));

-- ---------- themed templates (one per occasion) ----------
INSERT OR IGNORE INTO templates (name, kind, occasion, sort, layout_json) VALUES
  ('Harvest', 'any', 'thanksgiving', 20, '{"bg":{"type":"gradient","colors":["#7c2d12","#c2410c","#f59e0b"],"angle":150},"quoteMark":"rgba(255,237,213,0.3)","text":{"font":"Lora","weight":700,"color":"#fff7ed","size":0.06},"author":{"font":"Poppins","weight":500,"color":"#fed7aa","size":0.031},"brandColor":"#fed7aa"}'),
  ('Menorah Blue', 'any', 'hanukkah', 21, '{"bg":{"type":"gradient","colors":["#0c1e5b","#1d4ed8"],"angle":160},"quoteMark":"rgba(250,204,21,0.35)","text":{"font":"Playfair Display","weight":700,"color":"#fef9c3","size":0.06},"author":{"font":"Poppins","weight":500,"color":"#facc15","size":0.031},"brandColor":"#facc15"}'),
  ('Kite Sky', 'any', 'sankranti', 22, '{"bg":{"type":"gradient","colors":["#38bdf8","#fde68a"],"angle":180},"quoteMark":"rgba(255,255,255,0.4)","text":{"font":"Poppins","weight":700,"color":"#0c4a6e","size":0.056},"author":{"font":"Poppins","weight":500,"color":"#075985","size":0.03},"brandColor":"#075985"}'),
  ('Red Lantern', 'any', 'lunar-new-year', 23, '{"bg":{"type":"gradient","colors":["#7f1d1d","#dc2626"],"angle":160},"quoteMark":"rgba(252,211,77,0.35)","text":{"font":"Playfair Display","weight":700,"color":"#fde68a","size":0.06},"author":{"font":"Poppins","weight":500,"color":"#fcd34d","size":0.031},"brandColor":"#fcd34d"}'),
  ('Crescent', 'any', 'ramadan', 24, '{"bg":{"type":"gradient","colors":["#022c22","#065f46"],"angle":170},"quoteMark":"rgba(253,230,138,0.3)","text":{"font":"Playfair Display","weight":700,"color":"#fef3c7","size":0.06},"author":{"font":"Poppins","weight":500,"color":"#fcd34d","size":0.031},"brandColor":"#fcd34d"}'),
  ('Eid Gold', 'any', 'eid', 25, '{"bg":{"type":"gradient","colors":["#064e3b","#047857","#a16207"],"angle":150},"quoteMark":"rgba(253,230,138,0.3)","text":{"font":"Dancing Script","weight":700,"color":"#fef3c7","size":0.072},"author":{"font":"Poppins","weight":500,"color":"#fde68a","size":0.031},"brandColor":"#fde68a"}'),
  ('Violet', 'any', 'womens-day', 26, '{"bg":{"type":"gradient","colors":["#4c1d95","#a855f7","#f0abfc"],"angle":140},"quoteMark":"rgba(255,255,255,0.25)","text":{"font":"Playfair Display","weight":700,"color":"#ffffff","size":0.06},"author":{"font":"Poppins","weight":500,"color":"#f5d0fe","size":0.031},"brandColor":"#f5d0fe"}'),
  ('Gulal', 'any', 'holi', 27, '{"bg":{"type":"gradient","colors":["#ec4899","#f59e0b","#22c55e","#3b82f6"],"angle":135},"quoteMark":"rgba(255,255,255,0.3)","text":{"font":"Poppins","weight":700,"color":"#ffffff","size":0.058,"shadow":"rgba(0,0,0,0.3)"},"author":{"font":"Poppins","weight":500,"color":"#ffffff","size":0.031},"brandColor":"#ffffff"}'),
  ('Stillness', 'any', 'good-friday', 28, '{"bg":{"type":"gradient","colors":["#1f2937","#4b5563"],"angle":180},"quoteMark":"rgba(255,255,255,0.15)","text":{"font":"Lora","weight":600,"color":"#f3f4f6","size":0.058},"author":{"font":"Poppins","weight":500,"color":"#d1d5db","size":0.03},"brandColor":"#d1d5db"}'),
  ('Spring Pastel', 'any', 'easter', 29, '{"bg":{"type":"gradient","colors":["#fef9c3","#fbcfe8","#bfdbfe"],"angle":150},"quoteMark":"rgba(101,163,13,0.35)","text":{"font":"Dancing Script","weight":700,"color":"#3f6212","size":0.072},"author":{"font":"Poppins","weight":500,"color":"#4d7c0f","size":0.03},"brandColor":"#4d7c0f"}'),
  ('Wheat Gold', 'any', 'baisakhi', 30, '{"bg":{"type":"gradient","colors":["#a16207","#facc15"],"angle":160},"quoteMark":"rgba(255,255,255,0.3)","text":{"font":"Poppins","weight":700,"color":"#ffffff","size":0.058,"shadow":"rgba(0,0,0,0.25)"},"author":{"font":"Poppins","weight":500,"color":"#fef9c3","size":0.031},"brandColor":"#fef9c3"}'),
  ('Blue Planet', 'any', 'earth-day', 31, '{"bg":{"type":"gradient","colors":["#0c4a6e","#15803d"],"angle":150},"quoteMark":"rgba(187,247,208,0.3)","text":{"font":"Lora","weight":700,"color":"#f0fdf4","size":0.06},"author":{"font":"Poppins","weight":500,"color":"#bbf7d0","size":0.031},"brandColor":"#bbf7d0"}'),
  ('Workshop', 'any', 'labour-day', 32, '{"bg":{"type":"gradient","colors":["#450a0a","#b91c1c"],"angle":160},"quoteMark":"rgba(255,255,255,0.2)","text":{"font":"Montserrat","weight":700,"color":"#fff1f2","size":0.056},"author":{"font":"Montserrat","weight":500,"color":"#fecdd3","size":0.03},"brandColor":"#fecdd3"}'),
  ('Rose Petal', 'any', 'mothers-day', 33, '{"bg":{"type":"gradient","colors":["#fce7f3","#f9a8d4","#db2777"],"angle":160},"quoteMark":"rgba(255,255,255,0.4)","text":{"font":"Dancing Script","weight":700,"color":"#ffffff","size":0.074,"shadow":"rgba(131,24,67,0.35)"},"author":{"font":"Poppins","weight":500,"color":"#ffffff","size":0.031},"brandColor":"#ffffff"}'),
  ('Leaf Green', 'any', 'environment-day', 34, '{"bg":{"type":"gradient","colors":["#14532d","#4ade80"],"angle":150},"quoteMark":"rgba(255,255,255,0.25)","text":{"font":"Lora","weight":700,"color":"#ffffff","size":0.06},"author":{"font":"Poppins","weight":500,"color":"#dcfce7","size":0.031},"brandColor":"#dcfce7"}'),
  ('Navy Tie', 'any', 'fathers-day', 35, '{"bg":{"type":"gradient","colors":["#0f172a","#1d4ed8"],"angle":150},"quoteMark":"rgba(147,197,253,0.3)","text":{"font":"Montserrat","weight":700,"color":"#eff6ff","size":0.056},"author":{"font":"Montserrat","weight":500,"color":"#93c5fd","size":0.03},"brandColor":"#93c5fd"}'),
  ('Sunrise Calm', 'any', 'yoga-day', 36, '{"bg":{"type":"gradient","colors":["#fed7aa","#fb923c","#c2410c"],"angle":180},"quoteMark":"rgba(255,255,255,0.3)","text":{"font":"Lora","weight":600,"color":"#ffffff","size":0.058,"shadow":"rgba(0,0,0,0.2)"},"author":{"font":"Poppins","weight":500,"color":"#fff7ed","size":0.031},"brandColor":"#fff7ed"}'),
  ('Stars & Stripes', 'any', 'fourth-of-july', 37, '{"bg":{"type":"gradient","colors":["#1e3a8a","#1e3a8a","#b91c1c"],"angle":180},"quoteMark":"rgba(255,255,255,0.25)","text":{"font":"Montserrat","weight":700,"color":"#ffffff","size":0.056},"author":{"font":"Montserrat","weight":500,"color":"#fecaca","size":0.03},"brandColor":"#ffffff"}'),
  ('Sunny Pal', 'any', 'friendship-day', 38, '{"bg":{"type":"gradient","colors":["#fde047","#fb923c"],"angle":140},"quoteMark":"rgba(255,255,255,0.4)","text":{"font":"Poppins","weight":700,"color":"#7c2d12","size":0.058},"author":{"font":"Poppins","weight":500,"color":"#9a3412","size":0.031},"brandColor":"#9a3412"}'),
  ('Tiranga Wave', 'any', 'independence-day', 39, '{"bg":{"type":"gradient","colors":["#ff9933","#ffffff","#138808"],"angle":180},"quoteMark":"rgba(11,42,111,0.25)","text":{"font":"Poppins","weight":700,"color":"#0b2a6f","size":0.056},"author":{"font":"Poppins","weight":500,"color":"#0b2a6f","size":0.03},"brandColor":"#0b2a6f"}'),
  ('Rakhi Thread', 'any', 'raksha-bandhan', 40, '{"bg":{"type":"gradient","colors":["#9f1239","#f43f5e","#fb923c"],"angle":150},"quoteMark":"rgba(255,255,255,0.3)","text":{"font":"Dancing Script","weight":700,"color":"#fff1f2","size":0.072},"author":{"font":"Poppins","weight":500,"color":"#ffe4e6","size":0.031},"brandColor":"#ffe4e6"}'),
  ('Peacock', 'any', 'janmashtami', 41, '{"bg":{"type":"gradient","colors":["#083344","#0e7490","#65a30d"],"angle":150},"quoteMark":"rgba(253,224,71,0.3)","text":{"font":"Playfair Display","weight":700,"color":"#fefce8","size":0.06},"author":{"font":"Poppins","weight":500,"color":"#fde047","size":0.031},"brandColor":"#fde047"}'),
  ('Modak', 'any', 'ganesh-chaturthi', 42, '{"bg":{"type":"gradient","colors":["#9a3412","#ea580c","#facc15"],"angle":160},"quoteMark":"rgba(255,255,255,0.3)","text":{"font":"Poppins","weight":700,"color":"#ffffff","size":0.058,"shadow":"rgba(0,0,0,0.25)"},"author":{"font":"Poppins","weight":500,"color":"#fef3c7","size":0.031},"brandColor":"#fef3c7"}'),
  ('Chalkboard', 'any', 'teachers-day', 43, '{"bg":{"type":"solid","color":"#1f3d2b"},"quoteMark":"rgba(255,255,255,0.2)","text":{"font":"Lora","weight":600,"color":"#f8fafc","size":0.06},"author":{"font":"Poppins","weight":500,"color":"#bbf7d0","size":0.031},"brandColor":"#bbf7d0"}'),
  ('Pookalam', 'any', 'onam', 44, '{"bg":{"type":"gradient","colors":["#facc15","#f97316","#15803d"],"angle":150},"quoteMark":"rgba(255,255,255,0.3)","text":{"font":"Poppins","weight":700,"color":"#ffffff","size":0.058,"shadow":"rgba(0,0,0,0.3)"},"author":{"font":"Poppins","weight":500,"color":"#ffffff","size":0.031},"brandColor":"#ffffff"}'),
  ('Garba Night', 'any', 'navratri', 45, '{"bg":{"type":"gradient","colors":["#701a75","#c026d3","#f97316"],"angle":145},"quoteMark":"rgba(255,255,255,0.3)","text":{"font":"Playfair Display","weight":700,"color":"#ffffff","size":0.06},"author":{"font":"Poppins","weight":500,"color":"#fae8ff","size":0.031},"brandColor":"#fae8ff"}'),
  ('Khadi', 'any', 'gandhi-jayanti', 46, '{"bg":{"type":"solid","color":"#f5f0e6"},"align":"left","quoteMark":"#a8a29e","text":{"font":"Lora","weight":600,"color":"#292524","size":0.058},"author":{"font":"Montserrat","weight":600,"color":"#57534e","size":0.03},"brandColor":"#57534e"}'),
  ('Vijaya', 'any', 'dussehra', 47, '{"bg":{"type":"gradient","colors":["#7c2d12","#c2410c","#fbbf24"],"angle":160},"quoteMark":"rgba(255,255,255,0.3)","text":{"font":"Playfair Display","weight":700,"color":"#fffbeb","size":0.06},"author":{"font":"Poppins","weight":500,"color":"#fde68a","size":0.031},"brandColor":"#fde68a"}'),
  ('Diya Night', 'any', 'diwali', 48, '{"bg":{"type":"gradient","colors":["#1e1b4b","#581c87","#a16207"],"angle":165},"quoteMark":"rgba(253,224,71,0.35)","text":{"font":"Playfair Display","weight":700,"color":"#fde68a","size":0.062},"author":{"font":"Poppins","weight":500,"color":"#fef3c7","size":0.031},"brandColor":"#fde68a"}'),
  ('Pumpkin', 'any', 'halloween', 49, '{"bg":{"type":"gradient","colors":["#0a0a0a","#431407","#ea580c"],"angle":180},"quoteMark":"rgba(251,146,60,0.35)","text":{"font":"Montserrat","weight":700,"color":"#fdba74","size":0.058},"author":{"font":"Montserrat","weight":500,"color":"#fed7aa","size":0.03},"brandColor":"#fdba74"}'),
  ('Crayon', 'any', 'childrens-day', 50, '{"bg":{"type":"gradient","colors":["#38bdf8","#a78bfa","#f472b6"],"angle":135},"quoteMark":"rgba(255,255,255,0.35)","text":{"font":"Poppins","weight":700,"color":"#ffffff","size":0.058,"shadow":"rgba(0,0,0,0.2)"},"author":{"font":"Poppins","weight":500,"color":"#ffffff","size":0.031},"brandColor":"#ffffff"}'),
  ('Kesri', 'any', 'guru-nanak-jayanti', 51, '{"bg":{"type":"gradient","colors":["#1e3a8a","#d97706"],"angle":160},"quoteMark":"rgba(255,255,255,0.25)","text":{"font":"Playfair Display","weight":700,"color":"#fffbeb","size":0.06},"author":{"font":"Poppins","weight":500,"color":"#fde68a","size":0.031},"brandColor":"#fde68a"}'),
  ('Love Letter', 'any', 'valentines', 53, '{"bg":{"type":"gradient","colors":["#4c0519","#be123c","#fb7185"],"angle":150},"quoteMark":"rgba(255,255,255,0.3)","text":{"font":"Dancing Script","weight":700,"color":"#fff1f2","size":0.074},"author":{"font":"Poppins","weight":500,"color":"#ffe4e6","size":0.031},"brandColor":"#ffe4e6"}'),
  ('Holi Splash', 'wish', 'holi', 52, '{"bg":{"type":"gradient","colors":["#a21caf","#f43f5e","#facc15"],"angle":120},"quoteMark":null,"text":{"font":"Dancing Script","weight":700,"color":"#ffffff","size":0.074,"shadow":"rgba(0,0,0,0.3)"},"author":{"font":"Poppins","weight":500,"color":"#ffffff","size":0.031},"brandColor":"#ffffff"}');
