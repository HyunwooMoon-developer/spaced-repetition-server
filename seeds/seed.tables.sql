BEGIN;

TRUNCATE
  "word",
  "language",
  "user";

INSERT INTO "user" ("id", "username", "name", "password")
VALUES
  (
    1,
    'admin',
    'Dunder Mifflin Admin',
    -- password = "pass"
    '$2a$10$fCWkaGbt7ZErxaxclioLteLUgg4Q3Rp09WW0s/wSLxDKYsaGYUpjG'
  );

INSERT INTO "language" ("id", "name", "user_id")
VALUES
  (1, 'Korean', 1);

INSERT INTO "word" ("id", "language_id", "original", "translation", "next")
VALUES
  (1, 1, '안녕하세요', 'Hello', 2),
  (2, 1, '감사합니다', 'Thank you', 3),
  (3, 1, '집', 'House', 4),
  (4, 1, '개발자', 'Developer', 5),
  (5, 1, '생각', 'Thinking', 6),
  (6, 1, '고양이', 'Cat', 7),
  (7, 1, '강아지', 'Dog', 8),
  (8, 1, '사자' , 'Lion', 9),
  (9, 1, '한국' , 'Korea', 10),
  (10, 1, '나라', 'Country', null);

UPDATE "language" SET head = 1 WHERE id = 1;

-- because we explicitly set the id fields
-- update the sequencer for future automatic id setting
SELECT setval('word_id_seq', (SELECT MAX(id) from "word"));
SELECT setval('language_id_seq', (SELECT MAX(id) from "language"));
SELECT setval('user_id_seq', (SELECT MAX(id) from "user"));

COMMIT;
