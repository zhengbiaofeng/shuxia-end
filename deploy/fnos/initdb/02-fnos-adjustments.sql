USE `jeecg-boot`;

UPDATE sx_storage_source_config
SET endpoint = 'http://minio:9000', update_time = NOW()
WHERE del_flag = 0
  AND source_type = 'minio'
  AND endpoint IN (
    'http://127.0.0.1:9000',
    'http://127.0.0.1:9000/',
    'http://localhost:9000',
    'http://localhost:9000/'
  );

UPDATE sx_book_file
SET access_url = REPLACE(
      REPLACE(access_url, 'http://127.0.0.1:9000', 'http://minio:9000'),
      'http://localhost:9000',
      'http://minio:9000'
    ),
    update_time = NOW()
WHERE del_flag = 0
  AND (
    access_url LIKE 'http://127.0.0.1:9000/%'
    OR access_url LIKE 'http://localhost:9000/%'
  );

UPDATE sx_book_file
SET preview_url = REPLACE(
      REPLACE(preview_url, 'http://127.0.0.1:9000', 'http://minio:9000'),
      'http://localhost:9000',
      'http://minio:9000'
    ),
    update_time = NOW()
WHERE del_flag = 0
  AND (
    preview_url LIKE 'http://127.0.0.1:9000/%'
    OR preview_url LIKE 'http://localhost:9000/%'
  );
