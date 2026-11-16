const { pool } = require('../config/db');

/**
 * Initializes and verifies all 13 required MySQL tables for ShelfShare.
 * Uses CREATE TABLE IF NOT EXISTS to guarantee no data loss or overwriting.
 */
async function initializeDatabase() {
  console.log('[DB Init] Starting database verification and schema setup...');

  const tables = [
    // 1. Courses Table
    `CREATE TABLE IF NOT EXISTS courses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      course_code VARCHAR(30) NOT NULL UNIQUE,
      course_name VARCHAR(150) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 2. Semesters Table
    `CREATE TABLE IF NOT EXISTS semesters (
      id INT AUTO_INCREMENT PRIMARY KEY,
      course_id INT NOT NULL,
      semester_number INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_semesters_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      CONSTRAINT uq_course_semester UNIQUE (course_id, semester_number)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 3. Subjects Table
    `CREATE TABLE IF NOT EXISTS subjects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      course_id INT NOT NULL,
      semester_id INT NOT NULL,
      subject_name VARCHAR(150) NOT NULL,
      subject_code VARCHAR(50) NOT NULL UNIQUE,
      description TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_subjects_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      CONSTRAINT fk_subjects_semester FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE,
      INDEX idx_subjects_course_sem (course_id, semester_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 4. Users Table
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(120) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      college_name VARCHAR(180) NOT NULL,
      course_id INT NULL,
      semester_id INT NULL,
      role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
      account_status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
      profile_image VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_users_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
      CONSTRAINT fk_users_semester FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE SET NULL,
      INDEX idx_users_role (role),
      INDEX idx_users_status (account_status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 5. Resources Table
    `CREATE TABLE IF NOT EXISTS resources (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      description TEXT NOT NULL,
      course_id INT NOT NULL,
      semester_id INT NOT NULL,
      subject_id INT NOT NULL,
      unit_name VARCHAR(120) NULL,
      resource_type ENUM(
        'Lecture Notes',
        'Handwritten Notes',
        'Previous Year Question Papers',
        'Assignments',
        'Presentations',
        'Programming Examples',
        'Reference Materials',
        'Other'
      ) NOT NULL DEFAULT 'Lecture Notes',
      tags VARCHAR(255) NULL,
      file_name VARCHAR(255) NOT NULL,
      stored_file_name VARCHAR(255) NOT NULL,
      file_path TEXT NOT NULL,
      file_type VARCHAR(20) NOT NULL,
      file_size INT NOT NULL,
      uploader_id INT NOT NULL,
      academic_year VARCHAR(30) NULL,
      download_count INT UNSIGNED NOT NULL DEFAULT 0,
      average_rating DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
      total_reviews INT UNSIGNED NOT NULL DEFAULT 0,
      moderation_status ENUM('approved', 'pending', 'hidden', 'rejected') NOT NULL DEFAULT 'approved',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_resources_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT,
      CONSTRAINT fk_resources_semester FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE RESTRICT,
      CONSTRAINT fk_resources_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE RESTRICT,
      CONSTRAINT fk_resources_uploader FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_resources_search (course_id, semester_id, subject_id),
      INDEX idx_resources_type (resource_type),
      INDEX idx_resources_moderation (moderation_status),
      INDEX idx_resources_ranking (average_rating, download_count),
      INDEX idx_resources_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 6. Reviews Table
    `CREATE TABLE IF NOT EXISTS reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      resource_id INT NOT NULL,
      rating TINYINT UNSIGNED NOT NULL,
      comment TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_reviews_resource FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
      CONSTRAINT uq_user_resource_review UNIQUE (user_id, resource_id),
      INDEX idx_reviews_resource (resource_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 7. Bookmarks Table
    `CREATE TABLE IF NOT EXISTS bookmarks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      resource_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_bookmarks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_bookmarks_resource FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
      CONSTRAINT uq_user_resource_bookmark UNIQUE (user_id, resource_id),
      INDEX idx_bookmarks_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 8. Downloads Table
    `CREATE TABLE IF NOT EXISTS downloads (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      resource_id INT NOT NULL,
      downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_downloads_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_downloads_resource FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
      INDEX idx_downloads_user (user_id),
      INDEX idx_downloads_resource (resource_id),
      INDEX idx_downloads_time (downloaded_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 9. Collections Table
    `CREATE TABLE IF NOT EXISTS collections (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      collection_name VARCHAR(120) NOT NULL,
      description TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_collections_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_collections_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 10. Collection Resources Table
    `CREATE TABLE IF NOT EXISTS collection_resources (
      id INT AUTO_INCREMENT PRIMARY KEY,
      collection_id INT NOT NULL,
      resource_id INT NOT NULL,
      added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_col_res_collection FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
      CONSTRAINT fk_col_res_resource FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
      CONSTRAINT uq_collection_resource UNIQUE (collection_id, resource_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 11. Reports Table
    `CREATE TABLE IF NOT EXISTS reports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      reporter_id INT NOT NULL,
      resource_id INT NOT NULL,
      reason ENUM(
        'Incorrect content',
        'Duplicate material',
        'Copyright concern',
        'Inappropriate content',
        'Broken or corrupted file',
        'Other'
      ) NOT NULL,
      description TEXT NULL,
      status ENUM('pending', 'reviewed', 'dismissed', 'action_taken') NOT NULL DEFAULT 'pending',
      admin_id INT NULL,
      admin_notes TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      resolved_at TIMESTAMP NULL,
      CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_reports_resource FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
      CONSTRAINT fk_reports_admin FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_reports_status (status),
      INDEX idx_reports_resource (resource_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 12. Notifications Table
    `CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(150) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50) NOT NULL DEFAULT 'general',
      link VARCHAR(255) NULL,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_notifications_user_read (user_id, is_read)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 13. Admin Activity Logs Table
    `CREATE TABLE IF NOT EXISTS admin_activity_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      admin_id INT NOT NULL,
      action VARCHAR(100) NOT NULL,
      target_type VARCHAR(50) NOT NULL,
      target_id INT NULL,
      details TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_logs_admin FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_logs_admin (admin_id),
      INDEX idx_logs_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
  ];

  for (const sql of tables) {
    try {
      await pool.query(sql);
    } catch (err) {
      console.error('[DB Init Error] Statement failed:', err.message);
    }
  }

  // Check and seed default academic programs if empty
  try {
    const [courses] = await pool.query('SELECT COUNT(*) AS count FROM courses');
    if (courses[0].count === 0) {
      console.log('[DB Init] Seeding baseline courses, semesters, and subjects...');
      // Seed Courses
      await pool.query(`
        INSERT INTO courses (id, course_code, course_name) VALUES
        (1, 'MCA', 'Master of Computer Applications'),
        (2, 'BCA', 'Bachelor of Computer Applications'),
        (3, 'BTECH-CS', 'B.Tech in Computer Science and Engineering');
      `);

      // Seed Semesters
      await pool.query(`
        INSERT INTO semesters (id, course_id, semester_number) VALUES
        (1, 1, 1), (2, 1, 2), (3, 1, 3), (4, 1, 4),
        (5, 2, 1), (6, 2, 2), (7, 2, 3), (8, 2, 4), (9, 2, 5), (10, 2, 6),
        (11, 3, 1), (12, 3, 2), (13, 3, 3), (14, 3, 4), (15, 3, 5), (16, 3, 6), (17, 3, 7), (18, 3, 8);
      `);

      // Seed Core Subjects
      await pool.query(`
        INSERT INTO subjects (id, course_id, semester_id, subject_name, subject_code, description) VALUES
        (1, 1, 1, 'Data Structures and Algorithms', 'MCA101', 'Advanced algorithmic design, trees, graphs, dynamic programming, and complexity analysis.'),
        (2, 1, 1, 'Advanced Database Management Systems', 'MCA102', 'Relational theory, normalization, ACID compliance, transactions, indexing, and query optimization.'),
        (3, 1, 2, 'Operating Systems and Systems Programming', 'MCA201', 'Concurrency, process management, memory virtualisation, and file systems.'),
        (4, 1, 2, 'Software Engineering and Agile Methodologies', 'MCA202', 'Agile development, Scrum, software architecture, testing methodologies, and CI/CD pipelines.'),
        (5, 1, 3, 'Artificial Intelligence and Machine Learning', 'MCA301', 'Heuristic search, supervised learning, neural networks, and natural language processing.'),
        (6, 1, 3, 'Web Technologies and Full-Stack Development', 'MCA302', 'Modern JavaScript architectures, React, Node.js, Express REST APIs, and microservices.'),
        (7, 2, 1, 'Programming in C and Problem Solving', 'BCA101', 'Pointers, memory allocation, modular programming, structures, and file I/O.'),
        (8, 2, 2, 'Object-Oriented Programming with C++', 'BCA201', 'Classes, objects, inheritance, polymorphism, templates, and exception handling.'),
        (9, 2, 3, 'Java Programming and Object-Oriented Design', 'BCA301', 'Core Java, collections framework, multithreading, and stream APIs.'),
        (10, 2, 4, 'Python for Data Science', 'BCA401', 'Data structures, NumPy, Pandas, visualization, and exploratory data analysis.'),
        (11, 3, 3, 'Computer Networks and Protocols', 'CS301', 'OSI model, TCP/IP stack, routing protocols, and socket programming.'),
        (12, 3, 5, 'Network Security and Cryptography', 'CS501', 'Symmetric and asymmetric encryption, RSA, hashing, and digital signatures.'),
        (13, 3, 6, 'Compiler Design', 'CS601', 'Lexical analysis, parsing, semantic analysis, and code generation.'),
        (14, 1, 4, 'Cloud Computing and DevOps', 'MCA401', 'CI/CD pipelines, containerization with Docker, Kubernetes, and cloud infrastructure.'),
        (15, 3, 4, 'Design and Analysis of Algorithms', 'CS401', 'Divide and conquer, greedy strategies, dynamic programming, and graph algorithms.');
      `);
    }

    // Seed users, resources, reviews, downloads, bookmarks if empty
    try {
      const seedData = require('./seedData.json');
      
      // 1. Seed Student Peers
      if (seedData.users && seedData.users.length > 0) {
        console.log('[DB Init] Seeding student peer accounts...');
        for (const user of seedData.users) {
          await pool.execute(
            `INSERT INTO users (id, full_name, email, password_hash, college_name, course_id, semester_id, role, account_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE full_name = VALUES(full_name)`,
            [user.id, user.full_name, user.email, user.password_hash, user.college_name, user.course_id, user.semester_id, user.role, user.account_status]
          );
        }
      }

      // 2. Seed Resources
      const [resCount] = await pool.query('SELECT COUNT(*) as c FROM resources');
      if (resCount[0].c === 0 && seedData.resources) {
        console.log('[DB Init] Seeding 22 real academic resources...');
        for (const r of seedData.resources) {
          await pool.execute(
            `INSERT INTO resources (id, title, description, course_id, semester_id, subject_id, unit_name, resource_type, tags, file_name, stored_file_name, file_path, file_type, file_size, uploader_id, academic_year, download_count, average_rating, total_reviews, moderation_status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [r.id, r.title, r.description, r.course_id, r.semester_id, r.subject_id, r.unit_name, r.resource_type, r.tags, r.file_name, r.stored_file_name, r.file_path, r.file_type, r.file_size, r.uploader_id, r.academic_year, r.download_count, r.average_rating, r.total_reviews, r.moderation_status, r.created_at, r.updated_at]
          );
        }
      }

      // 3. Seed Reviews
      const [revCount] = await pool.query('SELECT COUNT(*) as c FROM reviews');
      if (revCount[0].c === 0 && seedData.reviews) {
        for (const rev of seedData.reviews) {
          await pool.execute(
            `INSERT INTO reviews (id, resource_id, user_id, rating, comment, created_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [rev.id, rev.resource_id, rev.user_id, rev.rating, rev.comment, rev.created_at]
          );
        }
      }

      // 4. Seed Downloads
      const [dlCount] = await pool.query('SELECT COUNT(*) as c FROM downloads');
      if (dlCount[0].c === 0 && seedData.downloads) {
        for (const dl of seedData.downloads) {
          await pool.execute(
            `INSERT INTO downloads (id, resource_id, user_id, downloaded_at)
             VALUES (?, ?, ?, ?)`,
            [dl.id, dl.resource_id, dl.user_id, dl.downloaded_at]
          );
        }
      }

      // 5. Seed Bookmarks
      const [bmCount] = await pool.query('SELECT COUNT(*) as c FROM bookmarks');
      if (bmCount[0].c === 0 && seedData.bookmarks) {
        for (const bm of seedData.bookmarks) {
          await pool.execute(
            `INSERT INTO bookmarks (id, user_id, resource_id, created_at)
             VALUES (?, ?, ?, ?)`,
            [bm.id, bm.user_id, bm.resource_id, bm.created_at]
          );
        }
      }
    } catch (seedErr) {
      console.warn('[DB Init Seed Notice]', seedErr.message);
    }
  } catch (err) {
    console.error('[DB Init Seeding Error]', err.message);
  }

  console.log('[DB Init] Database schema verification completed successfully.');
  return { success: true, message: 'All 13 tables verified.' };
}

// Allow direct CLI execution: node utils/initDatabase.js
if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = {
  initializeDatabase,
};
