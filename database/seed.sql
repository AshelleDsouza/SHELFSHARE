-- =====================================================================
-- ShelfShare Database Seed Script
-- Safe to re-run multiple times (uses INSERT IGNORE / ON DUPLICATE)
-- =====================================================================

USE shelfshare_db;

-- 1. COURSES
INSERT INTO courses (id, course_code, course_name) VALUES
(1, 'MCA', 'Master of Computer Applications'),
(2, 'BCA', 'Bachelor of Computer Applications'),
(3, 'BTECH-CS', 'Bachelor of Technology in Computer Science & Engineering')
ON DUPLICATE KEY UPDATE course_name = VALUES(course_name);

-- 2. SEMESTERS
INSERT INTO semesters (id, course_id, semester_number) VALUES
-- MCA (Sem 1 to 4)
(1, 1, 1),
(2, 1, 2),
(3, 1, 3),
(4, 1, 4),
-- BCA (Sem 1 to 6)
(5, 2, 1),
(6, 2, 2),
(7, 2, 3),
(8, 2, 4),
(9, 2, 5),
(10, 2, 6),
-- B.Tech CSE (Sem 1 to 8)
(11, 3, 1),
(12, 3, 2),
(13, 3, 3),
(14, 3, 4),
(15, 3, 5),
(16, 3, 6),
(17, 3, 7),
(18, 3, 8)
ON DUPLICATE KEY UPDATE semester_number = VALUES(semester_number);

-- 3. SUBJECTS
INSERT INTO subjects (id, course_id, semester_id, subject_name, subject_code, description) VALUES
(1, 1, 1, 'Data Structures and Algorithms', 'MCA101', 'Core non-linear data structures, trees, graphs, sorting, searching, and complexity analysis.'),
(2, 1, 1, 'Advanced Database Management Systems', 'MCA102', 'Relational database theory, normalization, indexing, transaction processing, and concurrency control.'),
(3, 1, 2, 'Operating Systems & System Programming', 'MCA201', 'Process management, synchronization, CPU scheduling algorithms, memory management, and file systems.'),
(4, 1, 2, 'Software Engineering & Agile Methodologies', 'MCA202', 'SDLC models, Agile Scrum practices, requirements analysis, design patterns, and software testing.'),
(5, 1, 3, 'Artificial Intelligence & Machine Learning', 'MCA301', 'Heuristic search algorithms, neural networks, decision trees, NLP fundamentals, and computer vision.'),
(6, 1, 3, 'Web Technologies & Cloud Computing', 'MCA302', 'Modern full-stack web development, REST APIs, microservices, and AWS/Azure cloud architecture.'),
(7, 2, 1, 'Programming in C & Data Structures', 'BCA101', 'Fundamentals of procedural programming, pointers, memory allocation, arrays, and linked lists.'),
(8, 2, 2, 'Computer Organization & Architecture', 'BCA201', 'Instruction set architecture, ALU design, memory hierarchy, cache organization, and pipelining.'),
(9, 2, 3, 'Object-Oriented Programming with Java', 'BCA301', 'OOP paradigms, classes, inheritance, polymorphism, Java collections framework, and multithreading.'),
(10, 2, 4, 'Python Programming Lab', 'BCA401', 'Python syntax, scripting, file handling, data processing with Pandas and NumPy libraries.'),
(11, 3, 3, 'Computer Networks', 'CS301', 'Network architectures, OSI and TCP/IP protocol suites, IP addressing, routing protocols, and socket programming.'),
(12, 3, 5, 'Cyber Security & Cryptography', 'CS501', 'Classical and modern cryptography, symmetric/asymmetric ciphers, hashing, network security, and firewalls.'),
(13, 3, 6, 'Compiler Design', 'CS601', 'Lexical analysis, syntax analysis, parsing techniques, semantic analysis, intermediate code generation, and optimization.'),
(14, 1, 4, 'Cloud Computing and DevOps', 'MCA401', 'CI/CD pipelines, containerization with Docker, Kubernetes cluster orchestration, and infrastructure as code.'),
(15, 3, 4, 'Design and Analysis of Algorithms', 'CS401', 'Divide and conquer, greedy strategies, dynamic programming, NP-completeness, and graph algorithms.')
ON DUPLICATE KEY UPDATE subject_name = VALUES(subject_name), description = VALUES(description);

-- 4. USERS
-- Password for all students: 'Student@123' (bcrypt hash: $2b$10$GmpxQ0XacX62iGrD7K4sZ.jDHOhmg4OzIkD3TIcadr0nfxW2BV.Eu)
-- Password for admin: 'Admin@123' (bcrypt hash: $2b$10$JT1G8COkWhwOwVCIFe703.hweBvdafolgDq0fzdYFfrdwMVdqJTTK)
INSERT INTO users (id, full_name, email, password_hash, college_name, course_id, semester_id, role, account_status) VALUES
(1, 'System Administrator', 'admin@shelfshare.edu', '$2b$10$JT1G8COkWhwOwVCIFe703.hweBvdafolgDq0fzdYFfrdwMVdqJTTK', 'National Institute of Technology', 1, 4, 'admin', 'active'),
(2, 'Aarav Sharma', 'aarav@shelfshare.edu', '$2b$10$GmpxQ0XacX62iGrD7K4sZ.jDHOhmg4OzIkD3TIcadr0nfxW2BV.Eu', 'St. Xavier Technical College', 1, 1, 'student', 'active'),
(3, 'Priya Patel', 'priya@shelfshare.edu', '$2b$10$GmpxQ0XacX62iGrD7K4sZ.jDHOhmg4OzIkD3TIcadr0nfxW2BV.Eu', 'St. Xavier Technical College', 1, 1, 'student', 'active'),
(4, 'Rohan Mehta', 'rohan@shelfshare.edu', '$2b$10$GmpxQ0XacX62iGrD7K4sZ.jDHOhmg4OzIkD3TIcadr0nfxW2BV.Eu', 'Delhi Technological Institute', 1, 2, 'student', 'active'),
(5, 'Sneha Rao', 'sneha@shelfshare.edu', '$2b$10$GmpxQ0XacX62iGrD7K4sZ.jDHOhmg4OzIkD3TIcadr0nfxW2BV.Eu', 'Delhi Technological Institute', 1, 2, 'student', 'active'),
(6, 'Vikram Singh', 'vikram@shelfshare.edu', '$2b$10$GmpxQ0XacX62iGrD7K4sZ.jDHOhmg4OzIkD3TIcadr0nfxW2BV.Eu', 'College of Engineering Pune', 1, 3, 'student', 'active'),
(7, 'Arjun Nair', 'arjun@shelfshare.edu', '$2b$10$GmpxQ0XacX62iGrD7K4sZ.jDHOhmg4OzIkD3TIcadr0nfxW2BV.Eu', 'College of Engineering Pune', 1, 3, 'student', 'active'),
(8, 'Ananya Gupta', 'ananya@shelfshare.edu', '$2b$10$GmpxQ0XacX62iGrD7K4sZ.jDHOhmg4OzIkD3TIcadr0nfxW2BV.Eu', 'Bangalore University', 2, 3, 'student', 'active'),
(9, 'Karan Verma', 'karan@shelfshare.edu', '$2b$10$GmpxQ0XacX62iGrD7K4sZ.jDHOhmg4OzIkD3TIcadr0nfxW2BV.Eu', 'Bangalore University', 2, 4, 'student', 'active'),
(10, 'Neha Deshmukh', 'neha@shelfshare.edu', '$2b$10$GmpxQ0XacX62iGrD7K4sZ.jDHOhmg4OzIkD3TIcadr0nfxW2BV.Eu', 'Vellore Institute of Technology', 3, 3, 'student', 'active'),
(11, 'Meera Iyer', 'meera@shelfshare.edu', '$2b$10$GmpxQ0XacX62iGrD7K4sZ.jDHOhmg4OzIkD3TIcadr0nfxW2BV.Eu', 'Vellore Institute of Technology', 3, 5, 'student', 'active')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash);

-- 5. RESOURCES (20+ records matching sample files)
INSERT INTO resources (
  id, title, description, course_id, semester_id, subject_id, unit_name, resource_type, tags,
  file_name, stored_file_name, file_path, file_type, file_size, uploader_id, academic_year,
  download_count, average_rating, total_reviews, moderation_status
) VALUES
(1, 'Binary Trees and AVL Rotations Complete Guide', 'Comprehensive lecture notes covering tree traversals, BST operations, and AVL self-balancing rotations with diagrams.', 1, 1, 1, 'Unit 3: Trees and Balanced Search Trees', 'Lecture Notes', 'dsa,trees,avl,algorithms,notes', 'sample-dsa-trees-graphs.pdf', 'sample-dsa-trees-graphs.pdf', 'uploads/sample-dsa-trees-graphs.pdf', 'pdf', 34500, 2, '2025-2026', 42, 4.80, 5, 'approved'),
(2, 'Relational Normalization and ACID Transactions', 'Clear step-by-step walkthrough of 1NF, 2NF, 3NF and BCNF with functional dependencies and banking transaction examples.', 1, 1, 2, 'Unit 2: Relational Design Theory', 'Lecture Notes', 'dbms,normalization,bcnf,acid,sql', 'sample-dbms-normalization.pdf', 'sample-dbms-normalization.pdf', 'uploads/sample-dbms-normalization.pdf', 'pdf', 31200, 3, '2025-2026', 38, 4.60, 4, 'approved'),
(3, 'Operating Systems CPU Scheduling & Deadlock Prevention', 'In-depth notes on FCFS, SJF, Round Robin scheduling algorithms, plus Bankers Algorithm for deadlock avoidance.', 1, 2, 3, 'Unit 2 & 3: Process Management & Deadlocks', 'Lecture Notes', 'os,scheduling,deadlock,processes', 'sample-os-process-scheduling.pdf', 'sample-os-process-scheduling.pdf', 'uploads/sample-os-process-scheduling.pdf', 'pdf', 29800, 4, '2025-2026', 29, 4.70, 3, 'approved'),
(4, 'Computer Networks: OSI and TCP/IP Stack Handout', 'Comparison chart between 7-layer OSI model and TCP/IP stack with subnetting examples and routing algorithms.', 3, 3, 11, 'Unit 1 & 2: Network Architectures', 'Handwritten Notes', 'networks,osi,tcpip,routing,subnetting', 'sample-cn-osi-tcpip.pdf', 'sample-cn-osi-tcpip.pdf', 'uploads/sample-cn-osi-tcpip.pdf', 'pdf', 33400, 8, '2024-2025', 55, 4.90, 6, 'approved'),
(5, 'Artificial Intelligence Heuristic Search & A* Algorithm', 'Step-by-step 8-puzzle heuristic evaluation and state space graph search comparison for MCA exam preparation.', 1, 3, 5, 'Unit 2: Informed Search Techniques', 'Presentations', 'ai,search,a-star,heuristics,state-space', 'sample-ai-search-heuristics.pdf', 'sample-ai-search-heuristics.pdf', 'uploads/sample-ai-search-heuristics.pdf', 'pdf', 28600, 6, '2025-2026', 22, 4.50, 3, 'approved'),
(6, 'Agile Scrum Framework & SDLC Models Quick Revision', 'Concise summary of Scrum roles, ceremonies, artifacts, user stories, and comparison with traditional Waterfall.', 1, 2, 4, 'Unit 1: Process Models and Agile', 'Lecture Notes', 'software-engineering,agile,scrum,sdlc', 'sample-software-eng-agile.pdf', 'sample-software-eng-agile.pdf', 'uploads/sample-software-eng-agile.pdf', 'pdf', 27400, 5, '2025-2026', 19, 4.40, 2, 'approved'),
(7, 'Python Practical Lab Manual with Pandas & NumPy', 'Complete lab exercises with verified outputs: list comprehensions, decorators, file I/O, and data processing.', 2, 4, 10, 'Lab Unit 1-4: Practical Programs', 'Programming Examples', 'python,pandas,numpy,lab,practical', 'sample-python-practical-lab.pdf', 'sample-python-practical-lab.pdf', 'uploads/sample-python-practical-lab.pdf', 'pdf', 36200, 9, '2025-2026', 64, 4.90, 7, 'approved'),
(8, 'Core Java OOP Concepts & Collections Cheat Sheet', 'Explains encapsulation, polymorphism, abstract classes, interfaces, HashMap, ArrayList and thread synchronization.', 2, 3, 9, 'Unit 3 & 4: OOP and Collections', 'Reference Materials', 'java,oop,collections,multithreading', 'sample-java-oop-notes.pdf', 'sample-java-oop-notes.pdf', 'uploads/sample-java-oop-notes.pdf', 'pdf', 32000, 10, '2024-2025', 47, 4.80, 5, 'approved'),
(9, 'Full-Stack React & Node.js Application Architecture', 'Comprehensive architectural guide for building robust REST APIs with Express and state management in React.', 1, 3, 6, 'Unit 3: Modern Web Frameworks', 'Lecture Notes', 'react,node,express,rest,fullstack', 'sample-webtech-react-node.pdf', 'sample-webtech-react-node.pdf', 'uploads/sample-webtech-react-node.pdf', 'pdf', 38900, 7, '2025-2026', 36, 4.70, 4, 'approved'),
(10, 'Cloud Computing: AWS Core Architecture & Models', 'Explains IaaS, PaaS, SaaS, virtualization vs containerization, and AWS services: EC2, S3, RDS, IAM.', 1, 4, 14, 'Unit 1 & 2: Cloud Infrastructure', 'Lecture Notes', 'cloud,aws,docker,iaas,paas', 'sample-cloud-computing-aws.pdf', 'sample-cloud-computing-aws.pdf', 'uploads/sample-cloud-computing-aws.pdf', 'pdf', 31500, 7, '2025-2026', 18, 4.30, 2, 'approved'),
(11, 'Cryptography & Network Security: RSA & AES Fundamentals', 'Detailed mathematical calculations for RSA encryption/decryption, key generation, and AES block cipher structure.', 3, 5, 12, 'Unit 3: Public Key Cryptography', 'Lecture Notes', 'security,cryptography,rsa,aes,cyber', 'sample-cyber-security-basics.pdf', 'sample-cyber-security-basics.pdf', 'uploads/sample-cyber-security-basics.pdf', 'pdf', 33800, 11, '2025-2026', 31, 4.60, 3, 'approved'),
(12, 'MCA Semester 1 University Exam Question Paper (2025)', 'Official solved previous year questions for Data Structures and Advanced DBMS with mark distribution.', 1, 1, 1, 'Previous Year Exam Paper', 'Previous Year Question Papers', 'pyq,exam,mca,sem1,question-paper', 'sample-question-paper-mca-sem1.pdf', 'sample-question-paper-mca-sem1.pdf', 'uploads/sample-question-paper-mca-sem1.pdf', 'pdf', 41200, 2, '2024-2025', 88, 5.00, 8, 'approved'),
(13, 'Graph Algorithms: Dijkstra, Bellman-Ford & Kruskal', 'Senior handwritten guide with edge-case trace tables and implementation notes.', 1, 1, 1, 'Unit 4: Advanced Graphs', 'Handwritten Notes', 'dsa,graphs,dijkstra,kruskal,mst', 'sample-dsa-trees-graphs.pdf', 'sample-dsa-trees-graphs.pdf', 'uploads/sample-dsa-trees-graphs.pdf', 'pdf', 34500, 6, '2024-2025', 52, 4.80, 5, 'approved'),
(14, 'Distributed Database Architecture and Replication', 'Explains horizontal partitioning, synchronous vs asynchronous replication, and CAP theorem.', 1, 1, 2, 'Unit 4: Distributed Systems', 'Reference Materials', 'dbms,distributed,replication,cap', 'sample-dbms-normalization.pdf', 'sample-dbms-normalization.pdf', 'uploads/sample-dbms-normalization.pdf', 'pdf', 31200, 7, '2025-2026', 15, 4.20, 2, 'approved'),
(15, 'Memory Management & Paging Algorithms in OS', 'Virtual memory, FIFO, LRU, Optimal page replacement algorithms step-by-step solve.', 1, 2, 3, 'Unit 4: Virtual Memory & Paging', 'Assignments', 'os,memory,paging,lru,virtual-memory', 'sample-os-process-scheduling.pdf', 'sample-os-process-scheduling.pdf', 'uploads/sample-os-process-scheduling.pdf', 'pdf', 29800, 5, '2025-2026', 27, 4.50, 3, 'approved'),
(16, 'Compiler Design: Lexical Analysis and LL(1) Parsing', 'Grammar transformations, FIRST and FOLLOW sets, and predictive parsing table construction.', 3, 6, 13, 'Unit 2: Syntax Analysis', 'Assignments', 'compiler,parsing,ll1,first-follow', 'sample-assignment-compiler-design.docx', 'sample-assignment-compiler-design.docx', 'uploads/sample-assignment-compiler-design.docx', 'docx', 12400, 11, '2025-2026', 14, 4.30, 2, 'approved'),
(17, 'Microservices Architecture with Docker & Node.js', 'Seminar slide deck covering API Gateway, service discovery, Docker containers, and message queues.', 1, 3, 6, 'Unit 4: Microservices', 'Presentations', 'microservices,docker,nodejs,architecture', 'sample-presentation-microservices.pptx', 'sample-presentation-microservices.pptx', 'uploads/sample-presentation-microservices.pptx', 'pptx', 18600, 7, '2025-2026', 20, 4.60, 2, 'approved'),
(18, 'C Programming Pointers and Dynamic Memory Allocation', 'BCA Sem 1 essential notes: malloc, calloc, realloc, pointer arithmetic, and struct pointers.', 2, 1, 7, 'Unit 3: Pointers & Memory', 'Lecture Notes', 'c-programming,pointers,memory,bca', 'sample-python-practical-lab.pdf', 'sample-python-practical-lab.pdf', 'uploads/sample-python-practical-lab.pdf', 'pdf', 36200, 8, '2025-2026', 39, 4.70, 3, 'approved'),
(19, 'Dynamic Programming Classics: Knapsack & LCS', 'Algorithm design notes detailing subproblems, memoization vs tabulation, and time complexity.', 3, 4, 15, 'Unit 3: Dynamic Programming', 'Programming Examples', 'algorithms,dp,knapsack,lcs,complexity', 'sample-dsa-trees-graphs.pdf', 'sample-dsa-trees-graphs.pdf', 'uploads/sample-dsa-trees-graphs.pdf', 'pdf', 34500, 10, '2025-2026', 44, 4.90, 4, 'approved'),
(20, 'Computer Architecture: Cache Mapping & Pipeline Hazards', 'BCA Sem 2 reference notes on direct vs associative cache mapping and structural/data/control hazards.', 2, 2, 8, 'Unit 3: Memory and Pipelining', 'Lecture Notes', 'architecture,cache,pipelining,hazards', 'sample-os-process-scheduling.pdf', 'sample-os-process-scheduling.pdf', 'uploads/sample-os-process-scheduling.pdf', 'pdf', 29800, 9, '2024-2025', 18, 4.30, 2, 'approved'),
(21, 'Unverified Draft Notes on AI Neural Networks', 'Draft notes pending senior review on backpropagation algorithm.', 1, 3, 5, 'Unit 4: Neural Networks', 'Other', 'ai,draft,neural-networks', 'sample-ai-search-heuristics.pdf', 'sample-ai-search-heuristics.pdf', 'uploads/sample-ai-search-heuristics.pdf', 'pdf', 28600, 4, '2025-2026', 2, 3.00, 1, 'pending')
ON DUPLICATE KEY UPDATE title = VALUES(title), download_count = VALUES(download_count), average_rating = VALUES(average_rating);

-- 6. REVIEWS
INSERT INTO reviews (id, user_id, resource_id, rating, comment) VALUES
(1, 3, 1, 5, 'Extremely clear diagrams for AVL tree rotations! Saved me hours before my internal test.'),
(2, 4, 1, 5, 'Best DSA notes on ShelfShare. The graph BFS/DFS code is completely bug-free.'),
(3, 5, 1, 5, 'Super helpful unit 3 notes. Thanks senior Aarav!'),
(4, 6, 1, 4, 'Very well organized. Would have loved a few more dynamic programming problems too.'),
(5, 7, 1, 5, 'Crystal clear explanation of Dijkstra algorithm with priority queue.'),
(6, 2, 2, 5, 'Priya explained BCNF decomposition without confusing jargon. Highly recommended!'),
(7, 4, 2, 4, 'ACID properties banking example is top notch. Helped me answer 10-mark question.'),
(8, 5, 2, 5, 'Great notes, nicely structured and clean.'),
(9, 6, 2, 4, 'Concise functional dependencies walkthrough.'),
(10, 2, 3, 5, 'Rohan notes on CPU scheduling are so straightforward to revise in 30 minutes.'),
(11, 3, 3, 4, 'Bankers algorithm numericals were exact match to our semester exam paper.'),
(12, 6, 3, 5, 'Very neatly organized summary with Gantt charts.'),
(13, 2, 4, 5, 'Ananya handwritten chart for OSI layers is the best. Must-have for networks.'),
(14, 3, 4, 5, 'Subnetting solved examples helped me score full marks in assignment.'),
(15, 4, 4, 5, 'Clear distinction between distance-vector and link-state routing.'),
(16, 5, 4, 5, 'Bookmarked! Really great notes from junior to senior share.'),
(17, 7, 4, 5, 'Excellent summary of TCP handshake and congestion windows.'),
(18, 10, 4, 4, 'Super helpful diagrams for Physical and Data Link layers.'),
(19, 2, 7, 5, 'Karan Python lab manual has tested code for all 12 university experiments.'),
(20, 3, 7, 5, 'Saves so much time! The pandas dataframe operations are clearly commented.'),
(21, 4, 7, 5, 'Great practical examples for list comprehensions and decorators.'),
(22, 5, 7, 5, 'Really cleanly organized code snippets.'),
(23, 6, 7, 5, 'Cleanest Python lab manual in our college.'),
(24, 7, 7, 4, 'Well formatted. Very easy to follow.'),
(25, 8, 7, 5, 'Awesome work, helped my entire batch.'),
(26, 3, 12, 5, 'Accurate answers for previous year question paper. Exactly what I needed!')
ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment);

-- 7. BOOKMARKS
INSERT INTO bookmarks (user_id, resource_id) VALUES
(2, 1),
(2, 2),
(2, 4),
(2, 12),
(3, 1),
(3, 3),
(3, 7),
(3, 9),
(4, 1),
(4, 3),
(4, 4),
(5, 2),
(5, 6),
(6, 1),
(6, 5),
(6, 9),
(7, 1),
(7, 8),
(8, 4),
(8, 7),
(9, 7),
(9, 8),
(10, 8),
(10, 11),
(11, 11),
(11, 12)
ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP;

-- 8. DOWNLOADS HISTORY
INSERT INTO downloads (user_id, resource_id, downloaded_at) VALUES
(2, 1, NOW() - INTERVAL 10 DAY),
(2, 2, NOW() - INTERVAL 8 DAY),
(2, 4, NOW() - INTERVAL 5 DAY),
(2, 12, NOW() - INTERVAL 2 DAY),
(3, 1, NOW() - INTERVAL 9 DAY),
(3, 2, NOW() - INTERVAL 7 DAY),
(3, 7, NOW() - INTERVAL 4 DAY),
(4, 1, NOW() - INTERVAL 6 DAY),
(4, 3, NOW() - INTERVAL 3 DAY),
(5, 6, NOW() - INTERVAL 5 DAY),
(6, 5, NOW() - INTERVAL 4 DAY),
(7, 9, NOW() - INTERVAL 3 DAY),
(8, 7, NOW() - INTERVAL 2 DAY),
(9, 8, NOW() - INTERVAL 1 DAY),
(10, 11, NOW() - INTERVAL 1 DAY);

-- 9. COLLECTIONS
INSERT INTO collections (id, user_id, collection_name, description) VALUES
(1, 2, 'MCA Semester 1 Finals Revision', 'All critical lecture notes, previous year question papers, and lab manuals for first semester exams.'),
(2, 2, 'Data Structures & Algorithms Mastery', 'Top rated tree, graph, and sorting algorithms study materials.'),
(3, 3, 'DBMS & SQL Complete Pack', 'Relational normalization, transactions, and distributed database materials.'),
(4, 4, 'OS & Systems Programming', 'CPU scheduling, deadlock algorithms, and memory management.'),
(5, 8, 'BCA High Scoring Notes', 'Collected notes for programming and networks.')
ON DUPLICATE KEY UPDATE collection_name = VALUES(collection_name);

-- 10. COLLECTION_RESOURCES
INSERT INTO collection_resources (collection_id, resource_id) VALUES
(1, 1),
(1, 2),
(1, 12),
(2, 1),
(2, 13),
(2, 19),
(3, 2),
(3, 14),
(4, 3),
(4, 15),
(5, 4),
(5, 7),
(5, 8)
ON DUPLICATE KEY UPDATE added_at = CURRENT_TIMESTAMP;

-- 11. REPORTS (for Admin Moderation Testing)
INSERT INTO reports (id, reporter_id, resource_id, reason, description, status) VALUES
(1, 3, 21, 'Inappropriate content', 'This upload is an incomplete draft with corrupted equations in Section 3.', 'pending'),
(2, 5, 16, 'Other', 'The assignment document formatting is slightly skewed in older versions of Word.', 'reviewed')
ON DUPLICATE KEY UPDATE status = VALUES(status), description = VALUES(description);

-- 12. NOTIFICATIONS
INSERT INTO notifications (id, user_id, title, message, type, is_read) VALUES
(1, 2, 'Welcome to ShelfShare!', 'Welcome Aarav! Start exploring academic notes tailored to your course and semester.', 'general', 1),
(2, 2, 'New Review Received', 'Priya Patel reviewed your resource "Binary Trees and AVL Rotations Complete Guide" with 5 stars!', 'new_review', 0),
(3, 3, 'Resource Upload Success', 'Your resource "Relational Normalization and ACID Transactions" is now live on the platform.', 'upload_success', 1),
(4, 4, 'Moderation Notice', 'Your report for resource #21 has been received and is under review by the admin team.', 'report_status', 0)
ON DUPLICATE KEY UPDATE is_read = VALUES(is_read);

-- 13. ADMIN ACTIVITY LOGS
INSERT INTO admin_activity_logs (admin_id, action, target_type, target_id, details) VALUES
(1, 'DATABASE_SEED', 'system', 1, 'Initial database seed completed with courses, subjects, demo accounts, and sample resources.'),
(1, 'APPROVE_RESOURCE', 'resource', 1, 'Admin approved initial core academic materials for MCA and BCA.');
