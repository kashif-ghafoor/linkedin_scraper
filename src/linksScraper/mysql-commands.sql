CREATE TABLE master_profiles(
    id INT AUTO_INCREMENT PRIMARY KEY,
    url VARCHAR(255) NOT NULL,
    is_scraped TINYINT(1) NOT NULL DEFAULT 0,
    result ENUM("success","failure"),
    search_term VARCHAR(25),
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
