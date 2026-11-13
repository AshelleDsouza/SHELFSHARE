const fs = require('fs');
const path = require('path');

function createMinimalPdf(title, subtitle, author, pagesText = []) {
  const contentStream = `BT
/F1 22 Tf
50 720 Td
(${title}) Tj
/F1 14 Tf
0 -30 Td
(${subtitle}) Tj
/F1 11 Tf
0 -25 Td
(Author: ${author} | ShelfShare Academic Resource) Tj
0 -40 Td
(--------------------------------------------------------------------------------) Tj
0 -25 Td
${pagesText.map((line, idx) => `0 -18 Td (${line.replace(/[()\\]/g, '')}) Tj`).join('\n')}
ET`;

  const streamLength = Buffer.byteLength(contentStream, 'utf8');

  let pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream
${contentStream}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000224 00000 n 
0000000${(280 + streamLength).toString().padStart(3, '0')} 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${350 + streamLength}
%%EOF`;

  return Buffer.from(pdf, 'utf8');
}

function generateSampleFiles(uploadDir) {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const sampleResources = [
    {
      file: 'sample-dsa-trees-graphs.pdf',
      title: 'Data Structures: Binary Trees and Graph Algorithms',
      subtitle: 'Complete Unit 3 Lecture Notes & Practice Problems',
      author: 'Aarav Sharma (MCA)',
      lines: [
        '1. Introduction to Non-Linear Data Structures: Trees and Binary Trees.',
        '2. Tree Traversals: Pre-order, In-order, Post-order and Level-order.',
        '3. Binary Search Trees (BST): Insertion, Deletion, and Searching complexity O(h).',
        '4. Balanced Search Trees: AVL Trees and Rotations (LL, RR, LR, RL).',
        '5. Graph Representations: Adjacency Matrix vs Adjacency List.',
        '6. Graph Traversals: Depth First Search (DFS) using Stack and Breadth First Search (BFS) using Queue.',
        '7. Shortest Path Algorithms: Dijkstras Algorithm and Bellman-Ford.',
        '8. Minimum Spanning Trees: Kruskals and Prims greedy strategies.',
        'Practice Exercise: Implement AVL rotation check in C++ / Java.',
      ],
    },
    {
      file: 'sample-dbms-normalization.pdf',
      title: 'Database Management Systems: Normalization & Transactions',
      subtitle: '1NF, 2NF, 3NF, BCNF with Functional Dependency Examples',
      author: 'Priya Patel (MCA)',
      lines: [
        '1. Relational Database Design and Anomalies (Insertion, Update, Deletion).',
        '2. Functional Dependencies and Armstrongs Axioms.',
        '3. First Normal Form (1NF): Atomic attributes, elimination of repeating groups.',
        '4. Second Normal Form (2NF): Full functional dependency on candidate keys.',
        '5. Third Normal Form (3NF): Elimination of transitive dependencies.',
        '6. Boyce-Codd Normal Form (BCNF): Every determinant must be a candidate key.',
        '7. ACID Properties of Transactions: Atomicity, Consistency, Isolation, Durability.',
        '8. Concurrency Control: Two-Phase Locking (2PL) and Serializability.',
      ],
    },
    {
      file: 'sample-os-process-scheduling.pdf',
      title: 'Operating Systems: CPU Scheduling & Deadlock Management',
      subtitle: 'Comprehensive revision guide for university exams',
      author: 'Rohan Mehta (B.Tech CSE)',
      lines: [
        '1. Process States: New, Ready, Running, Waiting, Terminated.',
        '2. Process Control Block (PCB) and Context Switching overhead.',
        '3. Scheduling Criteria: CPU Utilization, Throughput, Turnaround, Waiting, and Response time.',
        '4. Algorithms: FCFS, SJF, Round Robin with Time Quantum, Priority Scheduling.',
        '5. Synchronization: Critical Section Problem, Pettersons Solution, Semaphores.',
        '6. Deadlock Conditions: Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait.',
        '7. Deadlock Avoidance: Bankers Algorithm with Safety Check.',
      ],
    },
    {
      file: 'sample-cn-osi-tcpip.pdf',
      title: 'Computer Networks: OSI 7-Layer vs TCP/IP Architecture',
      subtitle: 'Protocol stack, IP addressing, subnetting and routing algorithms',
      author: 'Ananya Gupta (BCA)',
      lines: [
        '1. Overview of OSI Model: Physical, Data Link, Network, Transport, Session, Presentation, Application.',
        '2. TCP/IP Model and Comparison with OSI.',
        '3. Data Link Layer: Framing, Error Detection (CRC), Flow Control (Sliding Window).',
        '4. Network Layer: IPv4 vs IPv6 header format, CIDR notation and Subnetting.',
        '5. Routing Protocols: Distance Vector (RIP) vs Link State (OSPF).',
        '6. Transport Layer: TCP 3-Way Handshake, Flow Control, Congestion Control vs UDP.',
        '7. Application Layer Protocols: HTTP, HTTPS, DNS, DHCP, FTP.',
      ],
    },
    {
      file: 'sample-ai-search-heuristics.pdf',
      title: 'Artificial Intelligence: Heuristic Search & A* Algorithm',
      subtitle: 'Lecture slides & step-by-step 8-puzzle problem walkthrough',
      author: 'Vikram Singh (MCA)',
      lines: [
        '1. State Space Search formulation: Initial State, Actions, Goal Test, Path Cost.',
        '2. Uninformed Search: BFS, DFS, Uniform Cost Search, Iterative Deepening.',
        '3. Informed Search: Best-First Search and Heuristic Functions.',
        '4. A* Search: f(n) = g(n) + h(n), Admissibility and Consistency of Heuristics.',
        '5. Adversarial Search: Minimax algorithm and Alpha-Beta Pruning.',
        '6. Knowledge Representation: First-Order Logic and Resolution theorem proving.',
      ],
    },
    {
      file: 'sample-software-eng-agile.pdf',
      title: 'Software Engineering: SDLC Models and Agile Scrum Methodology',
      subtitle: 'MCA Semester 2 Revision Handout',
      author: 'Sneha Rao (MCA)',
      lines: [
        '1. Classical Waterfall Model, Prototyping, and Spiral Model.',
        '2. Agile Manifesto and 12 Principles.',
        '3. Scrum Framework: Product Owner, Scrum Master, Development Team.',
        '4. Scrum Ceremonies: Sprint Planning, Daily Standup, Sprint Review, Retrospective.',
        '5. Software Requirements Specification (SRS) according to IEEE 830.',
        '6. Software Testing: Unit, Integration, System, Black-box vs White-box.',
      ],
    },
    {
      file: 'sample-python-practical-lab.pdf',
      title: 'Python Programming: Practical Lab Manual & Code Examples',
      subtitle: 'List Comprehensions, Decorators, OOP, Pandas & NumPy Basics',
      author: 'Karan Verma (BCA)',
      lines: [
        '1. Python Data Structures: Lists, Tuples, Dictionaries, Sets.',
        '2. Functional Programming: map, filter, reduce, lambda expressions.',
        '3. Object-Oriented Python: Classes, Encapsulation, Inheritance, Polymorphism.',
        '4. Exception Handling with try-except-finally blocks.',
        '5. File I/O operations and JSON parsing.',
        '6. NumPy array operations and Pandas DataFrame manipulation for data analysis.',
      ],
    },
    {
      file: 'sample-java-oop-notes.pdf',
      title: 'Object-Oriented Programming with Java: Core Concepts',
      subtitle: 'Classes, Interfaces, Generics, and Collections Framework',
      author: 'Neha Deshmukh (B.Tech CSE)',
      lines: [
        '1. Java Platform: JVM, JRE, JDK architecture.',
        '2. Four Pillars of OOP: Abstraction, Encapsulation, Inheritance, Polymorphism.',
        '3. Abstract Classes vs Interfaces in Java 8+.',
        '4. Java Collections: ArrayList, LinkedList, HashMap, HashSet, PriorityQueue.',
        '5. Multithreading: Thread lifecycle, Runnable interface, Synchronization.',
        '6. Java Stream API and Lambda Expressions.',
      ],
    },
    {
      file: 'sample-webtech-react-node.pdf',
      title: 'Web Technologies: Full-Stack React & Node.js Guide',
      subtitle: 'Frontend components, hooks, REST APIs, and authentication',
      author: 'Arjun Nair (MCA)',
      lines: [
        '1. Modern JavaScript (ES6+): Promises, async/await, modules, destructuring.',
        '2. React Fundamentals: Components, Props, State, Virtual DOM.',
        '3. React Hooks: useState, useEffect, useContext, useMemo, useCallback.',
        '4. Node.js Architecture: Event Loop, Non-blocking I/O.',
        '5. Express.js: Middleware, Routing, Request Validation, Error Handling.',
        '6. RESTful API Design Principles and JWT Authentication.',
      ],
    },
    {
      file: 'sample-cloud-computing-aws.pdf',
      title: 'Cloud Computing: Cloud Models & Architecture Notes',
      subtitle: 'IaaS, PaaS, SaaS, AWS core services and virtualization concepts',
      author: 'Rahul Sen (MCA)',
      lines: [
        '1. Definition of Cloud Computing (NIST Model) and Essential Characteristics.',
        '2. Service Models: IaaS (EC2), PaaS (Elastic Beanstalk), SaaS (Google Workspace).',
        '3. Deployment Models: Public, Private, Hybrid, Community Cloud.',
        '4. Virtualization: Hypervisor Type-1 (Bare Metal) vs Type-2 (Hosted).',
        '5. Containerization: Docker vs Virtual Machines, Kubernetes orchestration.',
        '6. Cloud Security: Shared Responsibility Model and Identity & Access Management (IAM).',
      ],
    },
    {
      file: 'sample-cyber-security-basics.pdf',
      title: 'Cyber Security & Cryptography: Symmetric vs Asymmetric',
      subtitle: 'DES, AES, RSA, Hash Functions, and Network Defense',
      author: 'Meera Iyer (B.Tech CSE)',
      lines: [
        '1. Information Security Triad: Confidentiality, Integrity, Availability (CIA).',
        '2. Classical Ciphers: Caesar, Playfair, Hill Cipher, Vigenere.',
        '3. Symmetric Key Cryptography: DES structure and AES operation.',
        '4. Asymmetric Key Cryptography: Diffie-Hellman Key Exchange and RSA Algorithm.',
        '5. Message Authentication Codes (MAC) and SHA-256 Hashing.',
        '6. Common Attacks: Phishing, SQL Injection, Cross-Site Scripting (XSS), Man-in-the-Middle.',
      ],
    },
    {
      file: 'sample-question-paper-mca-sem1.pdf',
      title: 'MCA Semester 1 Previous Year Question Paper (2025)',
      subtitle: 'University Examination: Data Structures & Advanced Database Systems',
      author: 'ShelfShare Academic Cell',
      lines: [
        'SECTION A: Answer any 5 questions (5 x 4 = 20 marks).',
        'Q1. Explain the time complexity of Quick Sort best, average, and worst cases.',
        'Q2. Differentiate between B-Tree and B+ Tree indexing.',
        'Q3. Explain ACID properties with a banking transfer example.',
        'SECTION B: Answer any 3 questions (3 x 10 = 30 marks).',
        'Q4. Construct an AVL tree by inserting keys: 15, 20, 24, 10, 13, 7, 30, 36, 25.',
        'Q5. Discuss Conflict Serializability and precedence graph algorithm with diagram.',
      ],
    },
  ];

  console.log(`Generating ${sampleResources.length} sample PDF files in ${uploadDir}...`);

  sampleResources.forEach((res) => {
    const filePath = path.join(uploadDir, res.file);
    const pdfBuffer = createMinimalPdf(res.title, res.subtitle, res.author, res.lines);
    fs.writeFileSync(filePath, pdfBuffer);
  });

  // Also create a couple of sample DOCX / PPTX files (simple text representation for demonstration)
  const otherFiles = [
    {
      name: 'sample-presentation-microservices.pptx',
      content: 'ShelfShare Presentation: Microservices Architecture with Node.js and Docker.',
    },
    {
      name: 'sample-assignment-compiler-design.docx',
      content: 'ShelfShare Assignment: Lexical Analysis and LL(1) Parsing Table Construction.',
    },
  ];

  otherFiles.forEach((file) => {
    const filePath = path.join(uploadDir, file.name);
    fs.writeFileSync(filePath, Buffer.from(file.content, 'utf8'));
  });

  console.log('Sample files generated successfully.');
}

if (require.main === module) {
  const targetDir = path.resolve(__dirname, '..', 'uploads');
  generateSampleFiles(targetDir);
}

module.exports = { generateSampleFiles };
