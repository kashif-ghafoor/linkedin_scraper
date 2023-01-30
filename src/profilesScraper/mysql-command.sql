CREATE TABLE profiles(
    id INT AUTO_INCREMENT PRIMARY KEY,
    profile_name VARCHAR(255) NOT NULL,
    profile_url VARCHAR(255) NOT NULL,
    job_title VARCHAR(255),
    company_name VARCHAR(255),
    company_link VARCHAR(255),
    search_term VARCHAR(255),
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

UPDATE master_profiles SET is_scraped = 1, result = resultStatus, search_term = keyword WHERE url = profileUrl;

/* inserting into profiles */
INSERT INTO profiles (profile_name, profile_url, job_title, company_name, company_link, search_term) VALUES ?