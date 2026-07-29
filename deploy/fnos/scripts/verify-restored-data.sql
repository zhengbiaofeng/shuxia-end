USE `jeecg-boot`;

SELECT 'books', COUNT(*)
FROM sx_book
WHERE del_flag = 0;

SELECT 'chapters', COUNT(*)
FROM sx_book_chapter
WHERE del_flag = 0;

SELECT 'chapter_paths', COUNT(*)
FROM sx_book_chapter
WHERE del_flag = 0
  AND content_path IS NOT NULL
  AND content_path <> '';

SELECT 'storage_total', COUNT(*)
FROM sx_storage_source_config;

SELECT 'storage_active', COUNT(*)
FROM sx_storage_source_config
WHERE del_flag = 0;

SELECT 'old_file_urls', COUNT(*)
FROM sx_book_file
WHERE del_flag = 0
  AND (
    access_url LIKE 'http://127.0.0.1:9000/%'
    OR access_url LIKE 'http://localhost:9000/%'
    OR preview_url LIKE 'http://127.0.0.1:9000/%'
    OR preview_url LIKE 'http://localhost:9000/%'
  );

SELECT 'formal_storage', COUNT(*)
FROM sx_storage_source_config
WHERE del_flag = 0
  AND source_type = 'minio'
  AND endpoint = 'http://minio:9000'
  AND bucket_name IN ('sx-book', 'novel');

SELECT 'known_title', COUNT(*)
FROM sx_book
WHERE del_flag = 0
  AND book_name = '万相之王';
