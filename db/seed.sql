-- Starter content. Quotes are from historical (public-domain) authors; wishes are original.
-- Runs only on an empty database (scripts/migrate.mjs --seed checks first).

INSERT INTO topics (slug, name, emoji) VALUES
  ('motivation', 'Motivation', '🔥'),
  ('life', 'Life', '🌱'),
  ('love', 'Love', '❤️'),
  ('wisdom', 'Wisdom', '🦉'),
  ('happiness', 'Happiness', '😊'),
  ('friendship', 'Friendship', '🤝');

INSERT INTO authors (slug, name, bio) VALUES
  ('seneca', 'Seneca', 'Roman Stoic philosopher'),
  ('marcus-aurelius', 'Marcus Aurelius', 'Roman emperor and Stoic philosopher'),
  ('confucius', 'Confucius', 'Chinese philosopher'),
  ('lao-tzu', 'Lao Tzu', 'Author of the Tao Te Ching'),
  ('ralph-waldo-emerson', 'Ralph Waldo Emerson', 'American essayist and poet'),
  ('henry-david-thoreau', 'Henry David Thoreau', 'American naturalist and essayist'),
  ('mark-twain', 'Mark Twain', 'American writer and humorist'),
  ('benjamin-franklin', 'Benjamin Franklin', 'American polymath'),
  ('rumi', 'Rumi', 'Persian poet and mystic'),
  ('rabindranath-tagore', 'Rabindranath Tagore', 'Bengali poet, Nobel laureate'),
  ('swami-vivekananda', 'Swami Vivekananda', 'Indian monk and philosopher'),
  ('aristotle', 'Aristotle', 'Greek philosopher'),
  ('helen-keller', 'Helen Keller', 'American author and activist');

INSERT INTO quotes (text, author_id, topic_id) VALUES
  ('Luck is what happens when preparation meets opportunity.', (SELECT id FROM authors WHERE slug='seneca'), (SELECT id FROM topics WHERE slug='motivation')),
  ('It is not that we have a short time to live, but that we waste a lot of it.', (SELECT id FROM authors WHERE slug='seneca'), (SELECT id FROM topics WHERE slug='life')),
  ('We suffer more often in imagination than in reality.', (SELECT id FROM authors WHERE slug='seneca'), (SELECT id FROM topics WHERE slug='wisdom')),
  ('The happiness of your life depends upon the quality of your thoughts.', (SELECT id FROM authors WHERE slug='marcus-aurelius'), (SELECT id FROM topics WHERE slug='happiness')),
  ('Waste no more time arguing about what a good man should be. Be one.', (SELECT id FROM authors WHERE slug='marcus-aurelius'), (SELECT id FROM topics WHERE slug='motivation')),
  ('Very little is needed to make a happy life; it is all within yourself.', (SELECT id FROM authors WHERE slug='marcus-aurelius'), (SELECT id FROM topics WHERE slug='happiness')),
  ('It does not matter how slowly you go as long as you do not stop.', (SELECT id FROM authors WHERE slug='confucius'), (SELECT id FROM topics WHERE slug='motivation')),
  ('Everything has beauty, but not everyone sees it.', (SELECT id FROM authors WHERE slug='confucius'), (SELECT id FROM topics WHERE slug='life')),
  ('Real knowledge is to know the extent of one''s ignorance.', (SELECT id FROM authors WHERE slug='confucius'), (SELECT id FROM topics WHERE slug='wisdom')),
  ('A journey of a thousand miles begins with a single step.', (SELECT id FROM authors WHERE slug='lao-tzu'), (SELECT id FROM topics WHERE slug='motivation')),
  ('Nature does not hurry, yet everything is accomplished.', (SELECT id FROM authors WHERE slug='lao-tzu'), (SELECT id FROM topics WHERE slug='life')),
  ('Being deeply loved by someone gives you strength, while loving someone deeply gives you courage.', (SELECT id FROM authors WHERE slug='lao-tzu'), (SELECT id FROM topics WHERE slug='love')),
  ('Write it on your heart that every day is the best day in the year.', (SELECT id FROM authors WHERE slug='ralph-waldo-emerson'), (SELECT id FROM topics WHERE slug='life')),
  ('The only way to have a friend is to be one.', (SELECT id FROM authors WHERE slug='ralph-waldo-emerson'), (SELECT id FROM topics WHERE slug='friendship')),
  ('Go confidently in the direction of your dreams. Live the life you have imagined.', (SELECT id FROM authors WHERE slug='henry-david-thoreau'), (SELECT id FROM topics WHERE slug='motivation')),
  ('The secret of getting ahead is getting started.', (SELECT id FROM authors WHERE slug='mark-twain'), (SELECT id FROM topics WHERE slug='motivation')),
  ('Kindness is the language which the deaf can hear and the blind can see.', (SELECT id FROM authors WHERE slug='mark-twain'), (SELECT id FROM topics WHERE slug='wisdom')),
  ('Well done is better than well said.', (SELECT id FROM authors WHERE slug='benjamin-franklin'), (SELECT id FROM topics WHERE slug='wisdom')),
  ('Let yourself be silently drawn by the strange pull of what you really love. It will not lead you astray.', (SELECT id FROM authors WHERE slug='rumi'), (SELECT id FROM topics WHERE slug='love')),
  ('What you seek is seeking you.', (SELECT id FROM authors WHERE slug='rumi'), (SELECT id FROM topics WHERE slug='life')),
  ('Raise your words, not voice. It is rain that grows flowers, not thunder.', (SELECT id FROM authors WHERE slug='rumi'), (SELECT id FROM topics WHERE slug='wisdom')),
  ('Love is the only reality and it is not a mere sentiment.', (SELECT id FROM authors WHERE slug='rabindranath-tagore'), (SELECT id FROM topics WHERE slug='love')),
  ('You can''t cross the sea merely by standing and staring at the water.', (SELECT id FROM authors WHERE slug='rabindranath-tagore'), (SELECT id FROM topics WHERE slug='motivation')),
  ('Arise, awake, and stop not till the goal is reached.', (SELECT id FROM authors WHERE slug='swami-vivekananda'), (SELECT id FROM topics WHERE slug='motivation')),
  ('In a day, when you don''t come across any problems, you can be sure that you are travelling in a wrong path.', (SELECT id FROM authors WHERE slug='swami-vivekananda'), (SELECT id FROM topics WHERE slug='life')),
  ('Happiness depends upon ourselves.', (SELECT id FROM authors WHERE slug='aristotle'), (SELECT id FROM topics WHERE slug='happiness')),
  ('A friend to all is a friend to none.', (SELECT id FROM authors WHERE slug='aristotle'), (SELECT id FROM topics WHERE slug='friendship')),
  ('Walking with a friend in the dark is better than walking alone in the light.', (SELECT id FROM authors WHERE slug='helen-keller'), (SELECT id FROM topics WHERE slug='friendship')),
  ('Keep your face to the sunshine and you cannot see a shadow.', (SELECT id FROM authors WHERE slug='helen-keller'), (SELECT id FROM topics WHERE slug='happiness')),
  ('Alone we can do so little; together we can do so much.', (SELECT id FROM authors WHERE slug='helen-keller'), (SELECT id FROM topics WHERE slug='friendship'));

INSERT INTO wishes (text, occasion) VALUES
  ('Happy Birthday, {name}! May this year bring you more laughter, more adventures and everything your heart is quietly hoping for.', 'birthday'),
  ('Wishing you the happiest of birthdays, {name}. Keep shining the way you always do!', 'birthday'),
  ('Another year older, {name}, and somehow even more awesome. Have a wonderful birthday!', 'birthday'),
  ('Happy Anniversary, {name}! Here''s to the love you share and many more beautiful years together.', 'anniversary'),
  ('Cheers to another year of love and teamwork, {name}. Happy Anniversary!', 'anniversary'),
  ('Good morning, {name}! A fresh day, a fresh start. Make it count.', 'good-morning'),
  ('Rise and shine, {name}. Wishing you a calm mind and a bright day ahead.', 'good-morning'),
  ('Good morning, {name}! May your coffee be strong and your day be kind.', 'good-morning'),
  ('Good night, {name}. Let today go and rest well. Tomorrow is a new page.', 'good-night'),
  ('Sweet dreams, {name}. Sleep peacefully and wake up refreshed.', 'good-night'),
  ('Congratulations, {name}! Your hard work truly paid off. So proud of you.', 'congratulations'),
  ('Get well soon, {name}. Sending you strength, rest and warm wishes.', 'get-well'),
  ('Merry Christmas, {name}! May your home be filled with warmth, light and joy.', 'christmas'),
  ('Wishing you a peaceful and joyful Christmas, {name}, with the people you love most.', 'christmas'),
  ('Happy New Year, {name}! May the year ahead be full of new beginnings and good news.', 'new-year'),
  ('Cheers to a fresh start, {name}. Happy New Year and may all your plans come true!', 'new-year'),
  ('Happy Diwali, {name}! May the festival of lights brighten your home and your heart.', 'diwali'),
  ('Wishing you and your family a joyful and prosperous Diwali, {name}.', 'diwali'),
  ('Happy Holi, {name}! May your life be as colourful as this festival.', 'holi'),
  ('Happy Republic Day, {name}! Proud of our nation, proud of our people.', 'republic-day'),
  ('Happy Makar Sankranti, {name}! May your kites fly high and your days be sweet.', 'sankranti'),
  ('Happy Valentine''s Day, {name}. You make every day feel special.', 'valentines');

-- Templates. layout_json follows shared/layout.ts. bg_key = Internxt object key (optional).
INSERT INTO templates (name, kind, occasion, sort, layout_json) VALUES
  ('Midnight', 'any', NULL, 1, '{"bg":{"type":"gradient","colors":["#1f1c2c","#928dab"],"angle":135},"quoteMark":"rgba(255,255,255,0.18)","text":{"font":"Playfair Display","weight":700,"color":"#ffffff","size":0.062},"author":{"font":"Poppins","weight":500,"color":"rgba(255,255,255,0.85)","size":0.032},"brandColor":"rgba(255,255,255,0.7)"}'),
  ('Sunrise', 'any', NULL, 2, '{"bg":{"type":"gradient","colors":["#ff9a56","#ff6a88","#ff99ac"],"angle":160},"quoteMark":"rgba(255,255,255,0.25)","text":{"font":"Poppins","weight":700,"color":"#ffffff","size":0.058,"shadow":"rgba(0,0,0,0.18)"},"author":{"font":"Poppins","weight":500,"color":"#fff3ee","size":0.032},"brandColor":"rgba(255,255,255,0.8)"}'),
  ('Paper', 'quote', NULL, 3, '{"bg":{"type":"solid","color":"#f6f1e7"},"align":"left","quoteMark":"#d9b26a","text":{"font":"Lora","weight":600,"italic":true,"color":"#2b2520","size":0.06},"author":{"font":"Montserrat","weight":600,"color":"#8a6d3b","size":0.03},"brandColor":"#8a6d3b"}'),
  ('Ocean', 'any', NULL, 4, '{"bg":{"type":"gradient","colors":["#0f2027","#203a43","#2c5364"],"angle":180},"quoteMark":"rgba(120,220,255,0.25)","text":{"font":"Montserrat","weight":700,"color":"#e8f9ff","size":0.056},"author":{"font":"Montserrat","weight":500,"color":"#7fd6f5","size":0.03},"brandColor":"rgba(232,249,255,0.7)"}'),
  ('Blush', 'wish', NULL, 5, '{"bg":{"type":"gradient","colors":["#fbd3e9","#bb377d"],"angle":145},"quoteMark":null,"text":{"font":"Dancing Script","weight":700,"color":"#ffffff","size":0.075,"shadow":"rgba(80,0,40,0.3)"},"author":{"font":"Poppins","weight":500,"color":"#fff","size":0.03},"brandColor":"rgba(255,255,255,0.85)"}'),
  ('Forest', 'quote', NULL, 6, '{"bg":{"type":"gradient","colors":["#134e5e","#71b280"],"angle":125},"quoteMark":"rgba(255,255,255,0.2)","text":{"font":"Lora","weight":700,"color":"#ffffff","size":0.06},"author":{"font":"Poppins","weight":500,"color":"#e0ffe8","size":0.031},"brandColor":"rgba(255,255,255,0.75)"}'),
  ('Christmas Night', 'wish', 'christmas', 10, '{"bg":{"type":"gradient","colors":["#0b3d2e","#14532d","#7f1d1d"],"angle":160},"quoteMark":null,"text":{"font":"Dancing Script","weight":700,"color":"#fff7e6","size":0.074},"author":{"font":"Poppins","weight":500,"color":"#fcd34d","size":0.03},"brandColor":"#fcd34d"}'),
  ('New Year Gold', 'wish', 'new-year', 11, '{"bg":{"type":"gradient","colors":["#0f0c29","#302b63","#24243e"],"angle":150},"quoteMark":null,"text":{"font":"Playfair Display","weight":700,"color":"#f5d27a","size":0.064},"author":{"font":"Poppins","weight":500,"color":"#ffffff","size":0.03},"brandColor":"#f5d27a"}'),
  ('Tiranga', 'wish', 'republic-day', 12, '{"bg":{"type":"gradient","colors":["#ff9933","#ffffff","#138808"],"angle":180},"quoteMark":null,"text":{"font":"Poppins","weight":700,"color":"#0b2a6f","size":0.058},"author":{"font":"Poppins","weight":500,"color":"#0b2a6f","size":0.03},"brandColor":"#0b2a6f"}');

-- Festival occurrences (one row per year). Add more from the admin page.
INSERT INTO festivals (slug, name, occasion, starts_on, ends_on, headline, accent, priority) VALUES
  ('christmas-2026', 'Christmas', 'christmas', '2026-12-20', '2026-12-26', 'Merry Christmas! Make a card for someone you love', '#b91c1c', 5),
  ('new-year-2027', 'New Year', 'new-year', '2026-12-30', '2027-01-02', 'Happy New Year 2027! Send your wishes', '#d4a72c', 10),
  ('republic-day-2027', 'Republic Day', 'republic-day', '2027-01-25', '2027-01-26', 'Happy Republic Day', '#ff9933', 5),
  ('valentines-2027', 'Valentine''s Day', 'valentines', '2027-02-12', '2027-02-14', 'Say it with a card this Valentine''s', '#e11d48', 5);
